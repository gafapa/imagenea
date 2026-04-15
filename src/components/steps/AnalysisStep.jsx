import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Download,
  FileText,
  ImageIcon,
  ImageOff,
  RefreshCw,
  SearchIcon,
  Sparkles,
  Wand2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generateAndDownload } from '../../lib/docx'
import { searchImages } from '../../lib/images'
import { useStore } from '../../store'
import { useI18n } from '../../hooks/useI18n'

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item) {
        await worker(item)
      }
    }
  })

  await Promise.all(workers)
}

export default function AnalysisStep() {
  const { t } = useI18n()
  const {
    config,
    sections,
    topics,
    updateTopic,
    imageResults,
    imageLoading,
    setImageResults,
    setImageLoading,
    selected,
    selectImage,
    generating,
    generationMsg,
    setGenerating,
    reset,
  } = useStore()

  const [searchingAll, setSearchingAll] = useState(false)
  const latestRequestsRef = useRef({})

  const selectedCount = Object.values(selected).filter(Boolean).length

  async function doSearch(topicId, queryOverride) {
    const topic = topics.find((item) => item.id === topicId)
    if (!topic) return

    const query = (queryOverride ?? topic.imageQuery).trim()
    if (!query) return

    if (queryOverride) {
      updateTopic(topicId, { imageQuery: query })
    }

    const requestId = `${Date.now()}-${Math.random()}`
    latestRequestsRef.current[topicId] = requestId

    setImageLoading(topicId, true)
    setImageResults(topicId, [])

    try {
      const images = await searchImages(query, config)

      if (latestRequestsRef.current[topicId] !== requestId) {
        return
      }

      setImageResults(topicId, images)

      if (!images.length) {
        toast(t('analysis.noResults', { query }), { icon: 'i' })
      }
    } catch (error) {
      if (latestRequestsRef.current[topicId] === requestId) {
        toast.error(error.message)
      }
      console.error(error)
    } finally {
      if (latestRequestsRef.current[topicId] === requestId) {
        setImageLoading(topicId, false)
      }
    }
  }

  async function searchAll() {
    setSearchingAll(true)

    try {
      await runWithConcurrency(topics, 3, async (topic) => {
        await doSearch(topic.id)
      })
      toast.success(t('analysis.searchComplete'))
    } finally {
      setSearchingAll(false)
    }
  }

  async function generate() {
    if (selectedCount === 0) {
      toast.error(t('analysis.selectOne'))
      return
    }

    setGenerating(true, t('app.loadingStep'))

    try {
      await generateAndDownload(sections, topics, selected, {
        filename: 'imagenea-document.docx',
        onProgress: (topic) => setGenerating(true, t('analysis.downloadingImage', { title: topic.title })),
        missingImageLabel: t('analysis.missingImage'),
        unknownPhotographer: t('analysis.unknownPhotographer'),
        unknownSource: t('analysis.unknownSource'),
      })

      toast.success(t('analysis.generated', { count: selectedCount }))
    } catch (error) {
      toast.error(t('analysis.generateError', { message: error.message }))
      console.error(error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {t('analysis.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('analysis.summary', { selected: selectedCount, total: topics.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={searchAll}
            disabled={searchingAll || generating}
            className="btn-ghost border border-surface-border hover:border-indigo-500/40 text-xs py-1.5"
          >
            {searchingAll ? (
              <span className="w-3.5 h-3.5 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <SearchIcon className="w-3.5 h-3.5" />
            )}
            {t('analysis.searchAll')}
          </button>

          <button
            type="button"
            onClick={generate}
            disabled={selectedCount === 0 || generating}
            className="btn-primary text-sm py-2"
          >
            {generating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {generating ? generationMsg.slice(0, 24) || t('app.loadingStep') : t('analysis.download')}
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-[88px]">
          <DocPreview sections={sections} topics={topics} selected={selected} />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={index}
              results={imageResults[topic.id] ?? []}
              loading={imageLoading[topic.id] ?? false}
              selectedImg={selected[topic.id] ?? null}
              onSearch={(query) => doSearch(topic.id, query)}
              onSelect={(img) => selectImage(topic.id, img)}
              onQueryChange={(query) => updateTopic(topic.id, { imageQuery: query })}
              onSectionChange={(value) =>
                updateTopic(topic.id, {
                  sectionIdx: Math.min(Math.max(0, parseInt(value, 10) || 0), Math.max(0, sections.length - 1)),
                })
              }
              maxSection={Math.max(0, sections.length - 1)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <button type="button" onClick={reset} className="btn-ghost">
          <ChevronLeft className="w-4 h-4" /> {t('analysis.newDocument')}
        </button>

        <button
          type="button"
          onClick={generate}
          disabled={selectedCount === 0 || generating}
          className="btn-primary"
        >
          {generating ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {generating ? generationMsg.slice(0, 24) || t('app.loadingStep') : `${t('analysis.download')} (${selectedCount})`}
        </button>
      </div>
    </div>
  )
}

function DocPreview({ sections, topics, selected }) {
  const { t } = useI18n()

  const insertMap = useMemo(() => {
    const map = {}

    topics.forEach((topic) => {
      if (!map[topic.sectionIdx]) {
        map[topic.sectionIdx] = []
      }

      map[topic.sectionIdx].push(topic)
    })

    return map
  }, [topics])

  const selectedCount = Object.values(selected).filter(Boolean).length
  const total = topics.length

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          {t('analysis.preview')}
        </span>
        <span
          className={`badge text-xs border ${
            selectedCount === total && total > 0
              ? 'bg-green-900/40 text-green-400 border-green-700/40'
              : 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40'
          }`}
        >
          {selectedCount}/{total}
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-1 text-[11px] leading-relaxed">
        {sections.length === 0 && <p className="text-slate-600 text-center py-8">{t('analysis.noSections')}</p>}

        {sections.map((section, index) => (
          <div key={index}>
            <p className={section.isHeading ? 'font-bold text-slate-200 text-xs mt-2 mb-1' : 'text-slate-500'}>
              {section.text.length > 130 ? `${section.text.slice(0, 130)}...` : section.text}
            </p>

            {insertMap[index]?.map((topic) => {
              const img = selected[topic.id]

              return (
                <motion.div key={topic.id} layout className="my-2 rounded-xl overflow-hidden">
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
                        <img src={img.thumb} alt={topic.title} className="w-full h-24 object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent rounded-xl flex items-end p-2">
                          <div>
                            <p className="text-white text-[10px] font-semibold leading-tight truncate">{topic.title}</p>
                            <p className="text-white/60 text-[9px] truncate">{img.source}</p>
                          </div>
                        </div>
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

      <div className="border-t border-surface-border px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500">{t('analysis.imagesPlaced')}</span>
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

function TopicCard({
  topic,
  index,
  results,
  loading,
  selectedImg,
  onSearch,
  onSelect,
  onQueryChange,
  onSectionChange,
  maxSection,
}) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(true)
  const [localQuery, setLocalQuery] = useState(topic.imageQuery)
  const panelId = `topic-panel-${topic.id}`

  useEffect(() => {
    setLocalQuery(topic.imageQuery)
  }, [topic.imageQuery])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass overflow-hidden"
    >
      <button
        type="button"
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-surface-hover/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
            style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}
          >
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
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-surface-border">
              <div className="flex flex-wrap items-end gap-3 pt-3">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs text-slate-500 mb-1">{t('analysis.searchLabel')}</label>
                  <input
                    type="text"
                    value={localQuery}
                    onChange={(event) => setLocalQuery(event.target.value)}
                    onBlur={() => onQueryChange(localQuery)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        onQueryChange(localQuery)
                        onSearch(localQuery)
                      }
                    }}
                    className="input-base"
                    placeholder="e.g. urban farming rooftop"
                  />
                </div>

                <div className="w-20">
                  <label className="block text-xs text-slate-500 mb-1">{t('analysis.paragraphLabel')}</label>
                  <input
                    type="number"
                    value={topic.sectionIdx}
                    min={0}
                    max={maxSection}
                    onChange={(event) => onSectionChange(event.target.value)}
                    className="input-base"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onQueryChange(localQuery)
                    onSearch(localQuery)
                  }}
                  disabled={loading}
                  className="btn-primary py-2 text-xs"
                >
                  {loading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SearchIcon className="w-3.5 h-3.5" />
                  )}
                  {t('common.search')}
                </button>
              </div>

              {topic.altQueries?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-violet-400" />
                    {t('analysis.alternatives')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.altQueries.map((query, altIndex) => (
                      <button
                        type="button"
                        key={altIndex}
                        onClick={() => {
                          setLocalQuery(query)
                          onQueryChange(query)
                          onSearch(query)
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          topic.imageQuery === query
                            ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                            : 'bg-surface border-surface-border text-slate-400 hover:border-indigo-500/40 hover:text-slate-200'
                        }`}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!loading && results.length === 0 && topic.altQueries?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-xl bg-amber-900/20 border border-amber-700/30 px-3 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">{t('analysis.noResultsHint')}</p>
                </motion.div>
              )}

              {selectedImg && (
                <div className="flex items-center gap-3 rounded-xl bg-indigo-900/20 border border-indigo-700/30 p-2">
                  <img src={selectedImg.thumb} alt="" className="w-16 h-10 object-cover rounded-lg flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-indigo-300 font-medium truncate">{selectedImg.photographer}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {selectedImg.source} · {selectedImg.license}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className="text-slate-500 hover:text-red-400 flex-shrink-0 p-1"
                    aria-label={t('analysis.deselect', { title: topic.title })}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {loading && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[...Array(12)].map((_, skeletonIndex) => (
                    <div key={skeletonIndex} className="aspect-video rounded-lg bg-surface-hover animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && results.length > 0 && (
                <ImageGrid results={results} selected={selectedImg} onSelect={onSelect} topicTitle={topic.title} />
              )}

              {!loading && results.length === 0 && !topic.altQueries?.length && (
                <div className="flex flex-col items-center gap-2 py-6 text-slate-600">
                  <ImageOff className="w-8 h-8" />
                  <p className="text-xs">{t('analysis.emptyState')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ImageGrid({ results, selected, onSelect, topicTitle }) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {results.map((img) => {
        const isSelected = selected?.id === img.id

        return (
          <motion.button
            type="button"
            key={img.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(isSelected ? null : img)}
            className={`relative aspect-video rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group ${isSelected ? 'img-selected' : ''}`}
            title={`${img.photographer} - ${img.source}\n${img.license}`}
            aria-pressed={isSelected}
            aria-label={isSelected ? t('analysis.deselect', { title: topicTitle }) : `${t('common.search')} ${topicTitle}`}
          >
            <img
              src={img.thumb}
              alt={img.photographer}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={(event) => {
                if (event.currentTarget.parentElement) {
                  event.currentTarget.parentElement.style.display = 'none'
                }
              }}
            />
            <div
              className={`absolute inset-0 transition-opacity ${
                isSelected ? 'bg-indigo-600/30' : 'bg-black/0 group-hover:bg-black/20'
              }`}
            />

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
