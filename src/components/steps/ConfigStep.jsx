import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Image,
  Key,
  RefreshCw,
  XCircle,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { callAI } from '../../lib/ai'
import {
  AI_GUIDES,
  AI_PROVIDERS,
  IMAGE_GUIDES,
  IMAGE_PROVIDERS,
  getLocalizedGuide,
  getLocalizedHint,
  getLocalizedLabel,
} from '../../lib/providerMeta'
import { useStore } from '../../store'
import { useI18n } from '../../hooks/useI18n'

const LOCAL_PROVIDERS = new Set(['ollama', 'lmstudio'])

function isCorsError(error) {
  return (
    error instanceof TypeError ||
    error.message === 'Failed to fetch' ||
    error.message.includes('CORS') ||
    error.message.includes('ERR_FAILED') ||
    error.message.includes('NetworkError')
  )
}

function isHosted() {
  const { hostname } = window.location
  return hostname !== '' && hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')
}

async function fetchModels(config) {
  const { aiProvider, aiUrl, aiKey } = config

  if (aiProvider === 'ollama') {
    const response = await fetch(`${aiUrl}/api/tags`)
    if (!response.ok) throw new Error(`Ollama ${response.status}`)
    return (await response.json()).models?.map((model) => ({ id: model.name, label: model.name })) ?? []
  }

  if (aiProvider === 'lmstudio') {
    const response = await fetch(`${aiUrl}/v1/models`, {
      headers: { Authorization: 'Bearer lm-studio' },
    })
    if (!response.ok) throw new Error(`LM Studio ${response.status}`)
    return (await response.json()).data?.map((model) => ({ id: model.id, label: model.id })) ?? []
  }

  if (aiProvider === 'openrouter') {
    const headers = { 'Content-Type': 'application/json' }
    if (aiKey) headers.Authorization = `Bearer ${aiKey}`

    const response = await fetch('https://openrouter.ai/api/v1/models', { headers })
    if (!response.ok) throw new Error(`OpenRouter ${response.status}`)

    return (await response.json()).data
      ?.sort((a, b) => a.id.localeCompare(b.id))
      .map((model) => ({
        id: model.id,
        label: model.id,
        free: model.id.endsWith(':free') || model.pricing?.prompt === '0',
      })) ?? []
  }

  return []
}

function KeyGuide({ guide, openLabel }) {
  const [open, setOpen] = useState(false)
  const panelId = `key-guide-${guide?.title?.replace(/\s+/g, '-').toLowerCase() ?? 'panel'}`

  if (!guide) return null

  return (
    <div className="rounded-xl border border-indigo-200 overflow-hidden">
      <button
        type="button"
        id={`${panelId}-btn`}
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="flex items-center gap-2 text-xs font-medium text-indigo-700">
          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
          {guide.title}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={`${panelId}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-3 space-y-2 border-t border-indigo-100 bg-indigo-50">
              <ol className="space-y-1.5">
                {guide.steps.map((step, index) => (
                  <li key={`${step.text}-${index}`} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-xs text-slate-700 flex-1">
                      {step.text}
                      {step.url && (
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 ml-1.5 text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          {openLabel} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ol>

              {guide.note && (
                <p className="text-[11px] text-slate-500 border-t border-indigo-100 pt-2 mt-2">
                  {guide.note}
                </p>
              )}

              {guide.modelUrl && guide.modelLabel && (
                <a
                  href={guide.modelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
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

export default function ConfigStep() {
  const { t, language } = useI18n()
  const { config, setConfig } = useStore()
  const [testStatus, setTestStatus] = useState(null)
  const [testMsg, setTestMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [models, setModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)

  const aiProviders = useMemo(() => {
    return Object.fromEntries(
      Object.entries(AI_PROVIDERS).map(([key, provider]) => [
        key,
        { ...provider, displayLabel: getLocalizedLabel(provider, language) },
      ])
    )
  }, [language])

  const imageProviders = useMemo(() => {
    return Object.fromEntries(
      Object.entries(IMAGE_PROVIDERS).map(([key, provider]) => [
        key,
        {
          ...provider,
          displayLabel: getLocalizedLabel(provider, language),
          displayHint: getLocalizedHint(provider, language),
        },
      ])
    )
  }, [language])

  const aiGuide = useMemo(
    () => getLocalizedGuide(AI_GUIDES[config.aiProvider], language),
    [config.aiProvider, language]
  )

  const imageGuide = useMemo(
    () => getLocalizedGuide(IMAGE_GUIDES[config.imgProvider], language),
    [config.imgProvider, language]
  )

  const aiProvider = aiProviders[config.aiProvider]
  const imgProvider = imageProviders[config.imgProvider]

  function handleAiProvider(value) {
    const provider = AI_PROVIDERS[value]
    setConfig({
      aiProvider: value,
      aiUrl: provider.defaultUrl,
      aiModel: provider.defaultModel,
      aiKey: '',
    })
    setModels([])
    setTestStatus(null)
  }

  const corsParams = { host: window.location.origin, provider: aiProviders[config.aiProvider]?.displayLabel ?? config.aiProvider }
  const showCorsWarning = LOCAL_PROVIDERS.has(config.aiProvider) && isHosted()

  async function refreshModels() {
    setLoadingModels(true)
    setModels([])

    try {
      const list = await fetchModels(config)
      if (!list.length) throw new Error(t('config.noModels'))

      setModels(list)
      if (!list.find((model) => model.id === config.aiModel)) {
        setConfig({ aiModel: list[0].id })
      }
      toast.success(t('config.modelsLoaded', { count: list.length }))
    } catch (error) {
      const msg = isCorsError(error)
        ? t('config.corsError', corsParams)
        : t('config.modelsError', { message: error.message })
      toast.error(msg)
    } finally {
      setLoadingModels(false)
    }
  }

  async function testConnection() {
    setTesting(true)
    setTestStatus(null)

    try {
      const reply = await callAI([{ role: 'user', content: 'Reply with only the word: CONNECTED' }], config)
      setTestStatus('ok')
      setTestMsg(reply.trim().slice(0, 80))
    } catch (error) {
      setTestStatus('error')
      setTestMsg(isCorsError(error) ? t('config.corsError', corsParams) : error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">
          <span className="gradient-text">{t('config.title')}</span>
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">{t('config.subtitle')}</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-sm text-slate-800">{t('config.aiSection')}</h2>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">{t('config.aiProvider')}</label>
            <select
              value={config.aiProvider}
              onChange={(event) => handleAiProvider(event.target.value)}
              className="input-base"
            >
              {Object.entries(aiProviders).map(([key, provider]) => (
                <option key={key} value={key}>
                  {provider.displayLabel}
                </option>
              ))}
            </select>
          </div>

          {aiProvider.defaultUrl && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">{t('config.serverUrl')}</label>
                <input
                  type="text"
                  value={config.aiUrl}
                  onChange={(event) => setConfig({ aiUrl: event.target.value })}
                  className="input-base"
                  placeholder={aiProvider.defaultUrl}
                />
              </div>
              {showCorsWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {t('config.corsWarning', corsParams)}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-500">{t('config.model')}</label>
              <button
                type="button"
                onClick={refreshModels}
                disabled={loadingModels}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-40 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} />
                {loadingModels ? t('common.loading') : t('config.refreshModels')}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {models.length > 0 ? (
                <motion.div
                  key="model-select"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <select
                    value={config.aiModel}
                    onChange={(event) => setConfig({ aiModel: event.target.value })}
                    className="input-base pr-8 appearance-none"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                        {model.free ? ` · ${t('common.free')}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs text-slate-400 mt-1">
                    {t('config.availableModels', { count: models.length })}
                  </p>
                </motion.div>
              ) : (
                <motion.div key="model-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <input
                    type="text"
                    value={config.aiModel}
                    onChange={(event) => setConfig({ aiModel: event.target.value })}
                    className="input-base"
                    placeholder="llama3.2"
                  />
                  <p className="text-xs text-slate-400 mt-1">{t('config.modelHelp')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {aiProvider.needsKey && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  <Key className="w-3 h-3 inline mr-1" />
                  {t('config.apiKey')}
                </label>
                <input
                  type="password"
                  value={config.aiKey}
                  onChange={(event) => setConfig({ aiKey: event.target.value })}
                  className="input-base"
                  placeholder="sk-or-..."
                />
              </div>
              <KeyGuide guide={aiGuide} openLabel={t('common.open')} />
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={testConnection}
              disabled={testing}
              className="btn-ghost text-xs py-1.5 px-3 border border-slate-200 hover:border-indigo-400"
            >
              {testing ? (
                <span className="inline-block w-3.5 h-3.5 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {testing ? t('common.testing') : t('config.testConnection')}
            </button>

            {testStatus && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-1.5 mt-2 text-xs ${testStatus === 'ok' ? 'text-green-600' : 'text-red-600'}`}
              >
                {testStatus === 'ok' ? (
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                )}
                <span className="break-all">
                  {testStatus === 'ok'
                    ? t('config.connected', { message: testMsg })
                    : t('config.connectionError', { message: testMsg })}
                </span>
              </motion.div>
            )}
          </div>
        </section>

        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-violet-600" />
            <h2 className="font-semibold text-sm text-slate-800">{t('config.imageSection')}</h2>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">{t('config.imageProvider')}</label>
            <select
              value={config.imgProvider}
              onChange={(event) => setConfig({ imgProvider: event.target.value, imgKey: '', googleCx: '' })}
              className="input-base"
            >
              {Object.entries(imageProviders).map(([key, provider]) => (
                <option key={key} value={key}>
                  {provider.displayLabel}
                  {provider.free ? ` · ${t('common.freeUpper')}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1.5">{imgProvider.displayHint}</p>
          </div>

          {imgProvider.free ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700">{t('config.noKeyRequired')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  <Key className="w-3 h-3 inline mr-1" />
                  {t('config.apiKey')}
                </label>
                <input
                  type="password"
                  value={config.imgKey}
                  onChange={(event) => setConfig({ imgKey: event.target.value })}
                  className="input-base"
                  placeholder="..."
                />
              </div>

              {imgProvider.cx && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">{t('config.googleCx')}</label>
                  <input
                    type="text"
                    value={config.googleCx}
                    onChange={(event) => setConfig({ googleCx: event.target.value })}
                    className="input-base"
                    placeholder="017576662512468239146:omuauf_lfve"
                  />
                </div>
              )}

              <KeyGuide guide={imageGuide} openLabel={t('common.open')} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
