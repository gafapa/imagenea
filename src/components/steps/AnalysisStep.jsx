import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Download, SearchIcon, Sparkles,
  CheckCircle, RefreshCw, ImageOff, Wand2, AlertCircle,
  FileText, ImageIcon,
} from 'lucide-react'
import toast            from 'react-hot-toast'
import { useStore }     from '../../store'
import { searchImages } from '../../lib/images'
import { generateAndDownload } from '../../lib/docx'

// ── MAIN STEP ─────────────────────────────────────────────────────────────────

export default function AnalysisStep() {
  const {
    config, sections, topics, updateTopic,
    imageResults, imageLoading, setImageResults, setImageLoading,
    selected, selectImage,
    generating, generationMsg, setGenerating,
    reset,
  } = useStore()

  const [searchingAll, setSearchingAll] = useState(false)

  const selectedCount = Object.keys(selected).length

  async function doSearch(topicId, queryOverride) {
    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return
    const query = queryOverride ?? topic.imageQuery
    if (queryOverride) updateTopic(topicId, { imageQuery: queryOverride })

    setImageLoading(topicId, true)
    setImageResults(topicId, [])
    try {
      const imgs = await searchImages(query, config)
      setImageResults(topicId, imgs)
      if (!imgs.length) toast(`Sin resultados para "${query}"`, { icon: '🔍' })
    } catch (e) {
      toast.error(`[${config.imgProvider}] ${e.message}`)
      console.error(e)
    }
    setImageLoading(topicId, false)
  }

  async function searchAll() {
    setSearchingAll(true)
    for (const t of topics) await doSearch(t.id)
    setSearchingAll(false)
    toast.success('Búsqueda completada')
  }

  async function generate() {
    if (selectedCount === 0) { toast.error('Selecciona al menos una imagen'); return }
    setGenerating(true, 'Iniciando…')
    try {
      await generateAndDownload(
        sections, topics, selected,
        (msg) => setGenerating(true, msg)
      )
      toast.success(`¡Documento generado con ${selectedCount} imagen${selectedCount > 1 ? 'es' : ''}!`)
    } catch (e) {
      toast.error('Error generando: ' + e.message)
      console.error(e)
    }
    setGenerating(false)
  }

  return (
    <div className="space-y-4">

      {/* ── Top bar ── */}
      <div className="glass p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Temas detectados
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {topics.length} temas · {selectedCount}/{topics.length} imagen{selectedCount !== 1 ? 'es' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={searchAll}
            disabled={searchingAll || generating}
            className="btn-ghost border border-surface-border hover:border-indigo-500/40 text-xs py-1.5"
          >
            {searchingAll
              ? <span className="w-3.5 h-3.5 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
              : <SearchIcon className="w-3.5 h-3.5" />}
            Buscar todas
          </button>
          <button
            onClick={generate}
            disabled={selectedCount === 0 || generating}
            className="btn-primary text-sm py-2"
          >
            {generating
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Download className="w-4 h-4" />}
            {generating ? (generationMsg.slice(0, 24) || 'Generando…') : 'Descargar Word'}
          </button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-4 items-start">

        {/* LEFT: Document preview (sticky) */}
        <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-[72px]">
          <DocPreview sections={sections} topics={topics} selected={selected} />
        </div>

        {/* RIGHT: Topic cards */}
        <div className="flex-1 min-w-0 space-y-3">
          {topics.map((topic, i) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={i}
              results={imageResults[topic.id] ?? []}
              loading={imageLoading[topic.id] ?? false}
              selectedImg={selected[topic.id] ?? null}
              onSearch={(q) => doSearch(topic.id, q)}
              onSelect={(img) => selectImage(topic.id, img)}
              onQueryChange={(q) => updateTopic(topic.id, { imageQuery: q })}
              onSectionChange={(n) => updateTopic(topic.id, { sectionIdx: parseInt(n) || 0 })}
              maxSection={Math.max(0, sections.length - 1)}
            />
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex justify-between items-center pt-1">
        <button onClick={reset} className="btn-ghost">
          <ChevronLeft className="w-4 h-4" /> Nuevo documento
        </button>
        <button onClick={generate} disabled={selectedCount === 0 || generating} className="btn-primary">
          {generating
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Download className="w-4 h-4" />}
          {generating ? 'Generando…' : `Descargar Word (${selectedCount})`}
        </button>
      </div>
    </div>
  )
}

// ── DOCUMENT PREVIEW ──────────────────────────────────────────────────────────

function DocPreview({ sections, topics, selected }) {
  // sectionIdx → topic[]
  const insertMap = useMemo(() => {
    const map = {}
    topics.forEach((t) => {
      if (!map[t.sectionIdx]) map[t.sectionIdx] = []
      map[t.sectionIdx].push(t)
    })
    return map
  }, [topics])

  const selectedCount = Object.keys(selected).length
  const total         = topics.length

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          Vista previa
        </span>
        <span className={`badge text-xs border ${
          selectedCount === total && total > 0
            ? 'bg-green-900/40 text-green-400 border-green-700/40'
            : 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40'
        }`}>
          {selectedCount}/{total}
        </span>
      </div>

      {/* Scrollable doc */}
      <div className="overflow-y-auto flex-1 p-3 space-y-1 text-[11px] leading-relaxed">
        {sections.length === 0 && (
          <p className="text-slate-600 text-center py-8">Sin secciones cargadas</p>
        )}

        {sections.map((sec, i) => (
          <div key={i}>
            {/* Text */}
            <p className={`${
              sec.isHeading
                ? 'font-bold text-slate-200 text-xs mt-2 mb-1'
                : 'text-slate-500'
            }`}>
              {sec.text.length > 130 ? sec.text.slice(0, 130) + '…' : sec.text}
            </p>

            {/* Image slots after this section */}
            {insertMap[i]?.map((topic) => {
              const img = selected[topic.id]
              return (
                <motion.div
                  key={topic.id}
                  layout
                  className="my-2 rounded-xl overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {img ? (
                      <motion.div
                        key="img"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="relative"
                      >
                        <img
                          src={img.thumb}
                          alt={topic.title}
                          className="w-full h-24 object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent rounded-xl flex items-end p-2">
                          <div>
                            <p className="text-white text-[10px] font-semibold leading-tight truncate">
                              {topic.title}
                            </p>
                            <p className="text-white/60 text-[9px] truncate">{img.source}</p>
                          </div>
                        </div>
                        {/* Green check */}
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-2 border-dashed border-indigo-500/25 rounded-xl h-16 flex flex-col items-center justify-center gap-1 bg-indigo-900/10"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-500/40" />
                        <p className="text-[9px] text-slate-600 px-2 truncate max-w-full">{topic.title}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer progress bar */}
      <div className="border-t border-surface-border px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500">Imágenes colocadas</span>
          <span className="text-[10px] text-slate-400">{selectedCount}/{total}</span>
        </div>
        <div className="h-1 rounded-full bg-surface-hover overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            animate={{ width: total > 0 ? `${(selectedCount / total) * 100}%` : '0%' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ── TOPIC CARD ────────────────────────────────────────────────────────────────

function TopicCard({ topic, index, results, loading, selectedImg, onSearch, onSelect, onQueryChange, onSectionChange, maxSection }) {
  const [expanded, setExpanded]   = useState(true)
  const [localQuery, setLocalQuery] = useState(topic.imageQuery)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-surface-hover/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
               style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
            {topic.id}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-100 text-sm leading-tight">{topic.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{topic.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedImg && (
            <span className="badge bg-green-900/40 text-green-400 border border-green-700/40">
              <CheckCircle className="w-3 h-3" /> OK
            </span>
          )}
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} className="text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-surface-border">

              {/* Controls */}
              <div className="flex flex-wrap items-end gap-3 pt-3">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs text-slate-500 mb-1">Búsqueda (inglés)</label>
                  <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    onBlur={() => onQueryChange(localQuery)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { onQueryChange(localQuery); onSearch(localQuery) } }}
                    className="input-base"
                    placeholder="e.g. urban farming rooftop"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-slate-500 mb-1">Párrafo #</label>
                  <input
                    type="number"
                    value={topic.sectionIdx}
                    min={0}
                    max={maxSection}
                    onChange={(e) => onSectionChange(e.target.value)}
                    className="input-base"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onQueryChange(localQuery); onSearch(localQuery) }}
                  disabled={loading}
                  className="btn-primary py-2 text-xs"
                >
                  {loading
                    ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <SearchIcon className="w-3.5 h-3.5" />}
                  Buscar
                </button>
              </div>

              {/* Alternative queries */}
              {topic.altQueries?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-violet-400" />
                    Alternativas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.altQueries.map((q, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          setLocalQuery(q)
                          onQueryChange(q)
                          onSearch(q)
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors
                          ${topic.imageQuery === q
                            ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                            : 'bg-surface border-surface-border text-slate-400 hover:border-indigo-500/40 hover:text-slate-200'
                          }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results warning */}
              {!loading && results.length === 0 && topic.altQueries?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-xl bg-amber-900/20 border border-amber-700/30 px-3 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    Sin resultados — prueba una alternativa o cambia el proveedor de imágenes.
                  </p>
                </motion.div>
              )}

              {/* Selected image mini-preview */}
              {selectedImg && (
                <div className="flex items-center gap-3 rounded-xl bg-indigo-900/20 border border-indigo-700/30 p-2">
                  <img src={selectedImg.thumb} alt="" className="w-16 h-10 object-cover rounded-lg flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-indigo-300 font-medium truncate">{selectedImg.photographer}</p>
                    <p className="text-xs text-slate-500 truncate">{selectedImg.source} · {selectedImg.license}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(null) }}
                    className="text-slate-500 hover:text-red-400 flex-shrink-0 p-1"
                    title="Deseleccionar"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-video rounded-lg bg-surface-hover animate-pulse" />
                  ))}
                </div>
              )}

              {/* Image grid */}
              {!loading && results.length > 0 && (
                <ImageGrid results={results} selected={selectedImg} onSelect={onSelect} />
              )}

              {/* Empty state */}
              {!loading && results.length === 0 && !topic.altQueries?.length && (
                <div className="flex flex-col items-center gap-2 py-6 text-slate-600">
                  <ImageOff className="w-8 h-8" />
                  <p className="text-xs">Haz clic en "Buscar" para encontrar imágenes</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── IMAGE GRID ────────────────────────────────────────────────────────────────

function ImageGrid({ results, selected, onSelect }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {results.map((img) => {
        const isSelected = selected?.id === img.id
        return (
          <motion.button
            key={img.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : img) }}
            className={`relative aspect-video rounded-xl overflow-hidden focus:outline-none group ${isSelected ? 'img-selected' : ''}`}
            title={`${img.photographer} — ${img.source}\n${img.license}`}
          >
            <img
              src={img.thumb}
              alt={img.photographer}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={(e) => { e.target.parentElement.style.display = 'none' }}
            />
            <div className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-indigo-600/30' : 'bg-black/0 group-hover:bg-black/20'}`} />

            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow"
              >
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </motion.div>
            )}

            <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1 pt-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-[9px] truncate">{img.source}</p>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
