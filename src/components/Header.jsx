import { ImageIcon } from 'lucide-react'
import { useStore } from '../store'
import { useI18n } from '../hooks/useI18n'
import { LANGUAGE_OPTIONS } from '../lib/i18n'

export default function Header() {
  const { t } = useI18n()
  const language = useStore((state) => state.language)
  const setLanguage = useStore((state) => state.setLanguage)

  return (
    <header
      className="sticky top-0 z-40 border-b border-surface-border"
      style={{ background: 'rgba(13,20,36,0.9)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-14 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-900/50">
            <ImageIcon className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight block">
              <span className="gradient-text">Imagenea</span>
            </span>
            <p className="hidden sm:block text-xs text-slate-500">
              {t('header.tagline')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="sr-only">
            {t('header.language')}
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="input-base min-w-[140px] py-2 text-xs"
            aria-label={t('header.language')}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}
