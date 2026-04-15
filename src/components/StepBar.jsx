import { Settings2, FileText, Images } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useI18n } from '../hooks/useI18n'

export default function StepBar() {
  const { t } = useI18n()
  const step = useStore((state) => state.step)
  const setStep = useStore((state) => state.setStep)

  const tabs = [
    { n: 1, label: t('steps.config'), Icon: Settings2 },
    { n: 2, label: t('steps.document'), Icon: FileText },
    { n: 3, label: t('steps.images'), Icon: Images },
  ]

  return (
    <nav className="flex gap-1 border-b border-surface-border mb-6" aria-label="Workflow steps">
      {tabs.map(({ n, label, Icon }) => {
        const isActive = n === step

        return (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isActive ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'
            }`}
            aria-current={isActive ? 'step' : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {label}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-full"
                transition={{ duration: 0.22, ease: 'easeOut' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
