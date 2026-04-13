import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Image, CheckCircle, XCircle,
  RefreshCw, ChevronDown, ExternalLink, BookOpen, Key,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../../store'
import { callAI } from '../../lib/ai'
import { PROVIDERS } from '../../lib/images'

// ── AI PROVIDERS ───────────────────────────────────────────────────────────────
const AI_PROVIDERS = {
  ollama:     { label: 'Ollama (local)',    defaultUrl: 'http://localhost:11434', defaultModel: 'llama3.2',                            needsKey: false },
  lmstudio:   { label: 'LM Studio (local)', defaultUrl: 'http://localhost:1234',  defaultModel: 'local-model',                         needsKey: false },
  openrouter: { label: 'OpenRouter (nube)', defaultUrl: '',                        defaultModel: 'meta-llama/llama-3.2-3b-instruct:free', needsKey: true  },
}

// ── API KEY GUIDES ─────────────────────────────────────────────────────────────
const AI_KEY_GUIDES = {
  openrouter: {
    title: 'Cómo obtener la API key de OpenRouter',
    free: true,
    steps: [
      { text: 'Crea una cuenta gratuita',         url: 'https://openrouter.ai/sign-up' },
      { text: 'Ve a "Keys" en tu perfil',          url: 'https://openrouter.ai/keys' },
      { text: 'Haz clic en "Create Key" y cópiala' },
      { text: 'Pega la key en el campo de arriba' },
    ],
    note: 'Modelos marcados con ":free" no consumen créditos.',
    modelUrl: 'https://openrouter.ai/models?q=free',
    modelLabel: 'Ver modelos gratuitos',
  },
}

const IMG_KEY_GUIDES = {
  rijksmuseum: {
    title: 'Cómo obtener la API key del Rijksmuseum',
    free: true,
    steps: [
      { text: 'Ve al portal de datos del Rijksmuseum',    url: 'https://data.rijksmuseum.nl/object-metadata/api/' },
      { text: 'Haz clic en "Register" (registro gratuito)' },
      { text: 'Confirma tu email y accede a tu perfil' },
      { text: 'Ve a "API Key" y cópiala' },
      { text: 'Pega la key en el campo de arriba' },
    ],
  },
  europeana: {
    title: 'Cómo obtener la API key de Europeana',
    free: true,
    steps: [
      { text: 'Ve al portal de desarrolladores de Europeana', url: 'https://pro.europeana.eu/page/get-api' },
      { text: 'Haz clic en "Request API key"' },
      { text: 'Rellena el formulario (nombre, email, uso)' },
      { text: 'Recibirás la key por email en segundos' },
      { text: 'Pega la key en el campo de arriba' },
    ],
    note: 'La misma key sirve para Europeana y Museo del Prado.',
  },
  prado: {
    title: 'Cómo obtener acceso al Museo del Prado',
    free: true,
    steps: [
      { text: 'El Prado usa la API de Europeana', url: 'https://pro.europeana.eu/page/get-api' },
      { text: 'Haz clic en "Request API key"' },
      { text: 'Rellena el formulario (nombre, email, uso)' },
      { text: 'Recibirás la key por email en segundos' },
      { text: 'Pega la key en el campo de arriba' },
    ],
    note: 'La misma key de Europeana filtra obras exclusivamente del Prado.',
  },
  pexels: {
    title: 'Cómo obtener la API key de Pexels',
    free: true,
    steps: [
      { text: 'Crea una cuenta gratuita en Pexels', url: 'https://www.pexels.com/join/' },
      { text: 'Ve al portal de la API',              url: 'https://www.pexels.com/api/' },
      { text: 'Haz clic en "Your API Key"' },
      { text: 'Acepta los términos y copia la key' },
      { text: 'Pega la key en el campo de arriba' },
    ],
    note: 'Límite gratuito: 200 solicitudes/hora, 20 000/mes.',
  },
  pixabay: {
    title: 'Cómo obtener la API key de Pixabay',
    free: true,
    steps: [
      { text: 'Crea una cuenta gratuita en Pixabay', url: 'https://pixabay.com/accounts/register/' },
      { text: 'Ve a la documentación de la API',      url: 'https://pixabay.com/api/docs/' },
      { text: 'Tu API key aparece automáticamente en la página cuando estás logado' },
      { text: 'Cópiala y pégala en el campo de arriba' },
    ],
    note: 'Límite gratuito: 100 solicitudes/minuto.',
  },
  unsplash: {
    title: 'Cómo obtener la Access Key de Unsplash',
    free: true,
    steps: [
      { text: 'Crea una cuenta gratuita en Unsplash', url: 'https://unsplash.com/join' },
      { text: 'Ve al portal de desarrolladores',       url: 'https://unsplash.com/developers' },
      { text: 'Haz clic en "New Application"' },
      { text: 'Acepta los términos y dale un nombre' },
      { text: 'Copia el campo "Access Key"' },
      { text: 'Pega la key en el campo de arriba' },
    ],
    note: 'Límite gratuito: 50 solicitudes/hora (modo demo).',
  },
  google: {
    title: 'Cómo configurar Google Images (2 credenciales)',
    free: true,
    steps: [
      { text: '① Crea un proyecto en Google Cloud Console',    url: 'https://console.cloud.google.com/' },
      { text: '② Activa la "Custom Search JSON API"',          url: 'https://console.cloud.google.com/apis/library/customsearch.googleapis.com' },
      { text: '③ Ve a "Credenciales" → "Crear credencial" → "Clave de API" — cópiala' },
      { text: '④ Crea un motor de búsqueda en Programmable Search', url: 'https://programmablesearchengine.google.com/controlpanel/create' },
      { text: '⑤ Activa "Buscar en toda la web" y copia el ID del motor (cx)' },
      { text: '⑥ Pega la API Key y el CX en los campos de arriba' },
    ],
    note: 'Límite gratuito: 100 búsquedas/día. Ampliable a 10 000/día con facturación.',
  },
}

// ── FETCH MODELS ───────────────────────────────────────────────────────────────
async function fetchModels(config) {
  const { aiProvider, aiUrl, aiKey } = config
  if (aiProvider === 'ollama') {
    const res = await fetch(`${aiUrl}/api/tags`)
    if (!res.ok) throw new Error(`Ollama ${res.status}`)
    return (await res.json()).models?.map((m) => ({ id: m.name, label: m.name })) ?? []
  }
  if (aiProvider === 'lmstudio') {
    const res = await fetch(`${aiUrl}/v1/models`, { headers: { Authorization: 'Bearer lm-studio' } })
    if (!res.ok) throw new Error(`LM Studio ${res.status}`)
    return (await res.json()).data?.map((m) => ({ id: m.id, label: m.id })) ?? []
  }
  if (aiProvider === 'openrouter') {
    const headers = { 'Content-Type': 'application/json' }
    if (aiKey) headers['Authorization'] = `Bearer ${aiKey}`
    const res = await fetch('https://openrouter.ai/api/v1/models', { headers })
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
    return (await res.json()).data
      ?.sort((a, b) => a.id.localeCompare(b.id))
      .map((m) => ({ id: m.id, label: m.id, free: m.id.endsWith(':free') || m.pricing?.prompt === '0' })) ?? []
  }
  return []
}

// ── KEY GUIDE COMPONENT ────────────────────────────────────────────────────────
function KeyGuide({ guide }) {
  const [open, setOpen] = useState(false)
  if (!guide) return null

  return (
    <div className="rounded-xl border border-indigo-700/30 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-indigo-300">
          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
          {guide.title}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-3 space-y-2 border-t border-indigo-700/20 bg-indigo-950/30">
              <ol className="space-y-1.5">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-600/40 text-indigo-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-slate-300 flex-1">
                      {step.text}
                      {step.url && (
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 ml-1.5 text-indigo-400 hover:text-indigo-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Abrir <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              {guide.note && (
                <p className="text-[11px] text-slate-500 border-t border-indigo-700/20 pt-2 mt-2">
                  ℹ️ {guide.note}
                </p>
              )}
              {guide.modelUrl && (
                <a
                  href={guide.modelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> {guide.modelLabel}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ConfigStep() {
  const { config, setConfig } = useStore()
  const [testStatus, setTestStatus]     = useState(null)
  const [testMsg, setTestMsg]           = useState('')
  const [testing, setTesting]           = useState(false)
  const [models, setModels]             = useState([])
  const [loadingModels, setLoadingModels] = useState(false)

  function handleAiProvider(val) {
    const p = AI_PROVIDERS[val]
    setConfig({ aiProvider: val, aiUrl: p.defaultUrl, aiModel: p.defaultModel })
    setModels([])
  }

  async function refreshModels() {
    setLoadingModels(true)
    setModels([])
    try {
      const list = await fetchModels(config)
      if (!list.length) throw new Error('No se encontraron modelos')
      setModels(list)
      if (!list.find((m) => m.id === config.aiModel)) setConfig({ aiModel: list[0].id })
      toast.success(`${list.length} modelos encontrados`)
    } catch (e) {
      toast.error('Error obteniendo modelos: ' + e.message)
    }
    setLoadingModels(false)
  }

  async function testConnection() {
    setTesting(true)
    setTestStatus(null)
    try {
      const reply = await callAI([{ role: 'user', content: 'Reply with only the word: CONNECTED' }], config)
      setTestStatus('ok')
      setTestMsg(reply.trim().slice(0, 80))
    } catch (e) {
      setTestStatus('error')
      setTestMsg(e.message)
    }
    setTesting(false)
  }

  const imgProvider = PROVIDERS[config.imgProvider]
  const aiProvider  = AI_PROVIDERS[config.aiProvider]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">
          <span className="gradient-text">Configura tu entorno</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Conecta con tu proveedor de IA y elige la fuente de imágenes.
          Los proveedores marcados con <span className="text-green-400 font-semibold">GRATIS</span> no requieren API key.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* ── AI SECTION ── */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-slate-200">Proveedor de IA</h2>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Motor</label>
            <select value={config.aiProvider} onChange={(e) => handleAiProvider(e.target.value)} className="input-base">
              {Object.entries(AI_PROVIDERS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {config.aiProvider !== 'openrouter' && (
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">URL del servidor</label>
              <input
                type="text" value={config.aiUrl}
                onChange={(e) => setConfig({ aiUrl: e.target.value })}
                className="input-base" placeholder="http://localhost:11434"
              />
            </div>
          )}

          {/* Model with refresh */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-500">Modelo</label>
              <button onClick={refreshModels} disabled={loadingModels}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors">
                <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
                {loadingModels ? 'Cargando…' : 'Refrescar modelos'}
              </button>
            </div>
            <AnimatePresence mode="wait">
              {models.length > 0 ? (
                <motion.div key="sel" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative">
                  <select value={config.aiModel} onChange={(e) => setConfig({ aiModel: e.target.value })} className="input-base pr-8 appearance-none">
                    {models.map((m) => <option key={m.id} value={m.id}>{m.label}{m.free ? ' ✦ gratis' : ''}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <p className="text-xs text-slate-600 mt-1">{models.length} modelo{models.length !== 1 ? 's' : ''} disponible{models.length !== 1 ? 's' : ''}</p>
                </motion.div>
              ) : (
                <motion.div key="inp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <input type="text" value={config.aiModel} onChange={(e) => setConfig({ aiModel: e.target.value })}
                    className="input-base" placeholder="llama3.2" />
                  <p className="text-xs text-slate-600 mt-1">Escribe el nombre o usa "Refrescar modelos"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {aiProvider?.needsKey && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  <Key className="w-3 h-3 inline mr-1" />API Key
                </label>
                <input type="password" value={config.aiKey}
                  onChange={(e) => setConfig({ aiKey: e.target.value })}
                  className="input-base" placeholder="sk-or-..." />
              </div>
              <KeyGuide guide={AI_KEY_GUIDES[config.aiProvider]} />
            </div>
          )}

          {/* Test connection */}
          <div>
            <button onClick={testConnection} disabled={testing}
              className="btn-ghost text-xs py-1.5 px-3 border border-surface-border hover:border-indigo-500/50">
              {testing
                ? <span className="inline-block w-3.5 h-3.5 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                : <Zap className="w-3.5 h-3.5" />}
              {testing ? 'Probando…' : 'Probar conexión'}
            </button>
            {testStatus && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-1.5 mt-2 text-xs ${testStatus === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {testStatus === 'ok' ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                <span className="break-all">{testStatus === 'ok' ? `Conectado — "${testMsg}"` : testMsg}</span>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── IMAGE SECTION ── */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-violet-400" />
            <h2 className="font-semibold text-sm text-slate-200">Fuente de imágenes</h2>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Proveedor</label>
            <select value={config.imgProvider}
              onChange={(e) => setConfig({ imgProvider: e.target.value, imgKey: '' })}
              className="input-base">
              {Object.entries(PROVIDERS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}{v.free ? ' ✦ GRATIS' : ''}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1.5">{imgProvider?.hint}</p>
          </div>

          {imgProvider?.free ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-900/20 border border-green-800/30 px-3 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-xs text-green-300">Sin registro ni API key requerida.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  <Key className="w-3 h-3 inline mr-1" />API Key
                </label>
                <input type="password" value={config.imgKey}
                  onChange={(e) => setConfig({ imgKey: e.target.value })}
                  className="input-base" placeholder="Pega tu API key aquí" />
              </div>

              {config.imgProvider === 'google' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">CX — ID del motor de búsqueda</label>
                  <input type="text" value={config.googleCx}
                    onChange={(e) => setConfig({ googleCx: e.target.value })}
                    className="input-base" placeholder="ej: 017576662512468239146:omuauf_lfve" />
                </div>
              )}

              <KeyGuide guide={IMG_KEY_GUIDES[config.imgProvider]} />
            </div>
          )}

        </section>
      </div>
    </div>
  )
}
