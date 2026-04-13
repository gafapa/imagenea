import { Settings2, FileText, Images } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

const TABS = [
  { n: 1, label: 'Configuración', Icon: Settings2 },
  { n: 2, label: 'Documento',     Icon: FileText  },
  { n: 3, label: 'Imágenes',      Icon: Images    },
]

export default function StepBar() {
  const step    = useStore((s) => s.step)
  const setStep = useStore((s) => s.setStep)

  return (
    <nav className="flex gap-1 border-b border-surface-border mb-6">
      {TABS.map(({ n, label, Icon }) => {
        const isActive = n === step
        return (
          <button
            key={n}
            onClick={() => setStep(n)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg focus:outline-none
              ${isActive
                ? 'text-indigo-300'
                : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
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
