import { useCallback, useState } from 'react'
import { useDropzone }  from 'react-dropzone'
import { motion }       from 'framer-motion'
import { UploadCloud, FileText, Sparkles } from 'lucide-react'
import toast            from 'react-hot-toast'
import { useStore }     from '../../store'
import { analyzeDocument } from '../../lib/ai'

function extractSections(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const nodes = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')
  return Array.from(nodes)
    .map((el, idx) => ({
      idx,
      text:      el.textContent.trim(),
      html:      el.outerHTML,
      isHeading: /^H[1-6]$/.test(el.tagName),
    }))
    .filter((s) => s.text.length > 10)
}

export default function UploadStep() {
  const { config, setDocument, setTopics, setStep } = useStore()  // setStep used by runAnalysis
  const [analyzing, setAnalyzing] = useState(false)
  const [loaded, setLoaded]       = useState(false)

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    await readFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  })

  async function readFile(file) {
    setAnalyzing(true)
    try {
      let html, text

      if (file.name.endsWith('.docx')) {
        const mammoth = (await import('mammoth')).default
        const buf = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer: buf })
        html = result.value
        text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      } else {
        text = await file.text()
        html = '<p>' + text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).join('</p><p>') + '</p>'
      }

      const sections = extractSections(html)
      setDocument({ name: file.name, text, html, sections })
      setLoaded(true)

      toast.success(`Documento cargado — ${sections.length} párrafos`)

      // Auto-analyze
      await runAnalysis(text, sections, config)
    } catch (e) {
      toast.error('Error leyendo el archivo: ' + e.message)
      console.error(e)
    }
    setAnalyzing(false)
  }

  async function handlePaste() {
    const textarea = document.getElementById('paste-area')
    const text = textarea?.value.trim()
    if (!text || text.length < 50) {
      toast.error('Escribe o pega al menos 50 caracteres')
      return
    }
    const html = '<p>' + text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).join('</p><p>') + '</p>'
    const sections = extractSections(html)
    setDocument({ name: 'texto-pegado.docx', text, html, sections })
    setLoaded(true)
    toast.success(`Texto cargado — ${sections.length} párrafos`)
    setAnalyzing(true)
    await runAnalysis(text, sections, config)
    setAnalyzing(false)
  }

  async function runAnalysis(text, sections, cfg) {
    try {
      toast.loading('Analizando documento con IA…', { id: 'analyzing' })
      const topics = await analyzeDocument(text, sections.length, cfg)
      setTopics(topics)
      toast.success(`${topics.length} temas detectados`, { id: 'analyzing' })
      setStep(3)
    } catch (e) {
      toast.error('Error IA: ' + e.message, { id: 'analyzing' })
      console.error(e)
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass p-6">
        <h2 className="text-lg font-semibold mb-1">Carga tu documento</h2>
        <p className="text-slate-400 text-sm">
          Sube un <code className="text-indigo-400">.docx</code> o <code className="text-indigo-400">.txt</code>,
          o pega el texto directamente. La IA lo analizará automáticamente.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`glass rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'dropzone-active scale-[1.01]' : 'hover:border-indigo-500/40'}`}
        style={{ borderStyle: 'dashed' }}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={analyzing ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {analyzing ? (
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
            </div>
          ) : (
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800 flex items-center justify-center">
              <UploadCloud className="w-7 h-7 text-slate-400" />
            </div>
          )}
        </motion.div>

        {analyzing ? (
          <>
            <p className="font-medium text-indigo-400 mb-1">Analizando con IA…</p>
            <p className="text-xs text-slate-500">Extrayendo temas y preparando búsquedas</p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-300 mb-1">
              {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
            </p>
            <p className="text-xs text-slate-500">o haz clic para seleccionar — .docx o .txt</p>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-slate-600 bg-[#0d1424]">O pega texto directamente</span>
        </div>
      </div>

      {/* Paste area */}
      <div className="glass p-4 space-y-3">
        <textarea
          id="paste-area"
          rows={7}
          className="input-base resize-none"
          placeholder="Pega aquí el contenido de tu documento…"
          disabled={analyzing}
        />
        <button
          onClick={handlePaste}
          disabled={analyzing}
          className="btn-primary w-full justify-center"
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analizando…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analizar con IA
            </>
          )}
        </button>
      </div>

    </div>
  )
}
