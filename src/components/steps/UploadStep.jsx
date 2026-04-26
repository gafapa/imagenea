import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Sparkles, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import { analyzeDocument } from '../../lib/ai'
import { useStore } from '../../store'
import { useI18n } from '../../hooks/useI18n'

function extractSections(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const nodes = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')

  return Array.from(nodes)
    .map((element, index) => ({
      idx: index,
      text: element.textContent.trim(),
      html: element.outerHTML,
      isHeading: /^H[1-6]$/.test(element.tagName),
    }))
    .filter((section) => section.text.length > 10)
}

export default function UploadStep() {
  const { t, language } = useI18n()
  const { config, setDocument, setTopics, setStep } = useStore()
  const [analyzing, setAnalyzing] = useState(false)
  const textareaRef = useRef(null)

  const runAnalysis = useCallback(
    async (text, sections) => {
      try {
        toast.loading(t('upload.analysisLoading'), { id: 'analyzing' })
        const topics = await analyzeDocument(text, sections.length, config, language)
        setTopics(topics)
        toast.success(t('upload.analysisSuccess', { count: topics.length }), { id: 'analyzing' })
        setStep(3)
      } catch (error) {
        toast.error(t('upload.analysisError', { message: error.message }), { id: 'analyzing' })
        console.error(error)
      }
    },
    [config, language, setStep, setTopics, t]
  )

  const readFile = useCallback(
    async (file) => {
      setAnalyzing(true)

      try {
        let html
        let text

        if (file.name.endsWith('.docx')) {
          const mammoth = (await import('mammoth')).default
          const buffer = await file.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
          html = result.value
          text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        } else {
          text = await file.text()
          html = `<p>${text
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .join('</p><p>')}</p>`
        }

        const sections = extractSections(html)
        setDocument({ name: file.name, text, html, sections })
        toast.success(t('upload.loadedDocument', { count: sections.length }))
        await runAnalysis(text, sections)
      } catch (error) {
        toast.error(t('upload.readError', { message: error.message }))
        console.error(error)
      } finally {
        setAnalyzing(false)
      }
    },
    [runAnalysis, setDocument, t]
  )

  const onDrop = useCallback(
    async (files) => {
      const file = files[0]
      if (!file) return
      await readFile(file)
    },
    [readFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: analyzing,
  })

  async function handlePaste() {
    const text = textareaRef.current?.value.trim() ?? ''

    if (!text || text.length < 50) {
      toast.error(t('upload.minChars'))
      return
    }

    const html = `<p>${text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join('</p><p>')}</p>`

    const sections = extractSections(html)
    setDocument({ name: 'pasted-text.docx', text, html, sections })
    toast.success(t('upload.loadedText', { count: sections.length }))

    setAnalyzing(true)
    try {
      await runAnalysis(text, sections)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass p-6">
        <h2 className="text-lg font-semibold mb-1">{t('upload.title')}</h2>
        <p className="text-slate-500 text-sm">{t('upload.subtitle')}</p>
      </div>

      <div
        {...getRootProps()}
        className={`glass rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive ? 'dropzone-active scale-[1.01]' : 'hover:border-indigo-500/40'
        }`}
        style={{ borderStyle: 'dashed' }}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={analyzing ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {analyzing ? (
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
            </div>
          ) : (
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
              <UploadCloud className="w-7 h-7 text-slate-500" />
            </div>
          )}
        </motion.div>

        {analyzing ? (
          <>
            <p className="font-medium text-indigo-600 mb-1">{t('upload.analyzing')}</p>
            <p className="text-xs text-slate-500">{t('upload.preparing')}</p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-700 mb-1">
              {isDragActive ? t('upload.dropActive') : t('upload.dropIdle')}
            </p>
            <p className="text-xs text-slate-500">{t('upload.pickFile')}</p>
          </>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-slate-500 bg-[#f1f5f9]">{t('upload.orPaste')}</span>
        </div>
      </div>

      <div className="glass p-4 space-y-3">
        <label htmlFor="paste-area" className="sr-only">{t('upload.placeholder')}</label>
        <textarea
          ref={textareaRef}
          id="paste-area"
          rows={7}
          className="input-base resize-none"
          placeholder={t('upload.placeholder')}
          disabled={analyzing}
        />
        <button
          type="button"
          onClick={handlePaste}
          disabled={analyzing}
          className="btn-primary w-full justify-center"
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('upload.analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t('upload.analyze')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
