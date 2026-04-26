import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImageIcon,
  ImageOff,
  Plus,
  RefreshCw,
  SearchIcon,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generateAndDownload } from '../../lib/docx'
import { getProviderConfigError, searchImages } from '../../lib/images'
import { useStore } from '../../store'
import { useI18n } from '../../hooks/useI18n'

const SECTIONS_PER_PAGE = 8

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item) await worker(item)
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
    addTopic,
    removeTopic,
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
  const [pickerOpen, setPickerOpen] = useState(false)
  const latestRequestsRef = useRef({})

  const selectedCount = Object.values(selected).filter(Boolean).length

  async function doSearch(topicId, queryOverride) {
    const configError = getProviderConfigError(config)
    if (configError) {
      toast.error(t(configError.key, configError.params))
      return
    }

    const topic = topics.find((item) => item.id === topicId)
    const query = (queryOverride ?? topic?.imageQuery ?? '').trim()
    if (!query) return

    if (queryOverride && topic) {
      updateTopic(topicId, { imageQuery: query })
    }

    const requestId = `${Date.now()}-${Math.random()}`
    latestRequestsRef.current[topicId] = requestId

    setImageLoading(topicId, true)
    setImageResults(topicId, [])

    try {
      const images = await searchImages(query, config)

      if (latestRequestsRef.current[topicId] !== requestId) return

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

  async function handleAddSpot(sectionIdx, query) {
    const id = Date.now()
    const newTopic = {
      id,
      title: query,
      description: '',
      imageQuery: query,
      altQueries: [],
      sectionIdx,
    }
    addTopic(newTopic)
    await doSearch(id, query)
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
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {t('analysis.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('analysis.summary', { selected: selectedCount, total: topics.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="btn-ghost border border-surface-border hover:border-indigo-500/40 text-xs py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('analysis.addSpot')}
          </button>

          <button
            type="button"
            onClick={searchAll}
            disabled={searchingAll || generating}
            className="btn-ghost border border-surface-border hover:border-indigo-500/40 text-xs py-1.5"
          >
            {searchingAll ? (
              <span className="w-3.5 h-3.5 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
          <DocPreview sections={sections} topics={topics} selected={selected} onAddSpot={handleAddSpot} />
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
              onRemove={() => removeTopic(topic.id)}
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
          {generating
            ? generationMsg.slice(0, 24) || t('app.loadingStep')
            : `${t('analysis.download')} (${selectedCount})`}
        </button>
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <SectionPickerModal
            sections={sections}
            onClose={() => setPickerOpen(false)}
            onAdd={async (sectionIdx, query) => {
              setPickerOpen(false)
              await handleAddSpot(sectionIdx, query)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function DocPreview({ sections, topics, selected, onAddSpot }) {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [addingAt, setAddingAt] = useState(null)
  const [addQuery, setAddQuery] = useState('')

  const pageCount = Math.ceil(sections.length / SECTIONS_PER_PAGE) || 1
  const pagedSections = sections.slice(page * SECTIONS_PER_PAGE, (page + 1) * SECTIONS_PER_PAGE)

  const insertMap = useMemo(() => {
    const map = {}
    topics.forEach((topic) => {
      if (!map[topic.sectionIdx]) map[topic.sectionIdx] = []
      map[topic.sectionIdx].push(topic)
    })
    return map
  }, [topics])

  const selectedCount = Object.values(selected).filter(Boolean).length
  const total = topics.length

  function handleSectionClick(idx) {
    setAddingAt(addingAt === idx ? null : idx)
    setAddQuery('')
  }

  async function handleAddSubmit(event) {
    event.preventDefault()
    const q = addQuery.trim()
    if (!q) return
    setAddingAt(null)
    setAddQuery('')
    await onAddSpot(addingAt, q)
  }

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          {t('analysis.preview')}
        </span>
        <span
          className={`badge text-xs border ${
            selectedCount === total && total > 0
              ? 'bg-green-50 text-green-600 border-green-200'
              : 'bg-indigo-50 text-indigo-600 border-indigo-200'
          }`}
        >
          {selectedCount}/{total}
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-0.5 text-[11px] leading-relaxed">
        {sections.length === 0 && (
          <p className="text-slate-500 text-center py-8">{t('analysis.noSections')}</p>
        )}

        {pagedSections.map((section) => {
          const idx = section.idx
          const isAdding = addingAt === idx

          return (
            <div key={idx}>
              <button
                type="button"
                onClick={() => handleSectionClick(idx)}
                title={t('analysis.clickToAdd')}
                className={`w-full text-left rounded-lg px-1.5 py-0.5 transition-colors group ${
                  section.isHeading
                    ? 'font-bold text-slate-800 text-xs mt-2 mb-0.5 cursor-pointer hover:bg-indigo-50'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-slate-800 cursor-pointer'
                }`}
              >
                {section.text.length > 130 ? `${section.text.slice(0, 130)}…` : section.text}
                <Plus className="inline-block w-3 h-3 ml-1 text-indigo-400 opacity-0 group-hover:opacity-70 transition-opacity" />
              </button>

              <AnimatePresence>
                {isAdding && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleAddSubmit}
                    className="flex gap-1 my-1 overflow-hidden"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={addQuery}
                      onChange={(e) => setAddQuery(e.target.value)}
                      placeholder={t('analysis.addSpotPlaceholder')}
                      className="input-base text-[11px] py-1 px-2 flex-1 min-w-0"
                    />
                    <button type="submit" className="btn-primary text-[10px] px-2 py-1 flex-shrink-0">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingAt(null)}
                      className="btn-ghost text-[10px] px-2 py-1 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {insertMap[idx]?.map((topic) => {
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
                          className="border-2 border-dashed border-indigo-200 rounded-xl h-16 flex flex-col items-center justify-center gap-1 bg-indigo-50/50"
                        >
                          <ImageIcon className="w-4 h-4 text-indigo-300" />
                          <p className="text-[9px] text-slate-500 px-2 truncate max-w-full">{topic.title}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )
        })}
      </div>

      {pageCount > 1 && (
        <div className="border-t border-surface-border px-3 py-2 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-ghost px-2 py-1 text-xs disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-slate-500">
            {t('analysis.pageOf', { page: page + 1, total: pageCount })}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
            className="btn-ghost px-2 py-1 text-xs disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="border-t border-surface-border px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500">{t('analysis.imagesPlaced')}</span>
          <span className="text-[10px] text-slate-500">{selectedCount}/{total}</span>
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

function SectionPickerModal({ sections, onClose, onAdd }) {
  const { t } = useI18n()
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const pageCount = Math.ceil(sections.length / SECTIONS_PER_PAGE) || 1
  const pagedSections = sections.slice(page * SECTIONS_PER_PAGE, (page + 1) * SECTIONS_PER_PAGE)

  async function handleSubmit(event) {
    event.preventDefault()
    if (selectedIdx === null || !query.trim()) return
    await onAdd(selectedIdx, query.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="glass w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            {t('analysis.addSpot')}
          </h3>
          <button type="button" onClick={onClose} className="btn-ghost p-1.5 -mr-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-xs text-slate-500 mb-3">{t('analysis.clickToAdd')}</p>

          {pagedSections.map((section) => {
            const isSelected = selectedIdx === section.idx

            return (
              <button
                type="button"
                key={section.idx}
                onClick={() => setSelectedIdx(section.idx)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium'
                    : 'hover:bg-surface-hover text-slate-700'
                }`}
              >
                {section.isHeading ? (
                  <strong>{section.text.length > 90 ? `${section.text.slice(0, 90)}…` : section.text}</strong>
                ) : (
                  section.text.length > 90 ? `${section.text.slice(0, 90)}…` : section.text
                )}
              </button>
            )
          })}
        </div>

        {pageCount > 1 && (
          <div className="border-t border-surface-border px-4 py-2 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-slate-500">
              {t('analysis.pageOf', { page: page + 1, total: pageCount })}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-surface-border p-4 flex gap-2 flex-shrink-0"
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('analysis.addSpotPlaceholder')}
            className="input-base flex-1"
            disabled={selectedIdx === null}
          />
          <button
            type="submit"
            disabled={selectedIdx === null || !query.trim()}
            className="btn-primary flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('analysis.addSpot')}
          </button>
        </form>
      </motion.div>
    </motion.div>
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
  onRemove,
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
      <div className="flex items-stretch">
        <button
          type="button"
          className="flex-1 flex items-start justify-between gap-3 p-4 text-left hover:bg-surface-hover/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
              style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <h3
                id={`topic-heading-${topic.id}`}
                className="font-semibold text-slate-800 text-sm leading-tight"
              >
                {topic.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{topic.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedImg && (
              <span className="badge bg-green-50 text-green-600 border border-green-200">
                <CheckCircle className="w-3 h-3" /> OK
              </span>
            )}
            <motion.div animate={{ rotate: expanded ? 90 : 0 }} className="text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </div>
        </button>

        <button
          type="button"
          onClick={onRemove}
          title={t('analysis.removeSpot')}
          className="px-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-surface-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label={t('analysis.removeSpot')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={`topic-heading-${topic.id}`}
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
                    <Wand2 className="w-3 h-3 text-violet-500" />
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
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-slate-800'
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
                  className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{t('analysis.noResultsHint')}</p>
                </motion.div>
              )}

              {selectedImg && (
                <div className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 p-2">
                  <img
                    src={selectedImg.thumb}
                    alt=""
                    className="w-16 h-10 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-indigo-700 font-medium truncate">{selectedImg.photographer}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {selectedImg.source} · {selectedImg.license}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0 p-1 transition-colors"
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
                <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                  <ImageOff className="w-8 h-8" />
                  <p className="text-xs text-slate-500">{t('analysis.emptyState')}</p>
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
  const [brokenIds, setBrokenIds] = useState(() => new Set())

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {results
        .filter((img) => !brokenIds.has(img.id))
        .map((img) => {
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
              aria-label={
                isSelected
                  ? t('analysis.deselect', { title: topicTitle })
                  : `${t('common.search')} ${topicTitle}`
              }
            >
              <img
                src={img.thumb}
                alt={img.photographer}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                onError={() => setBrokenIds((prev) => new Set([...prev, img.id]))}
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
