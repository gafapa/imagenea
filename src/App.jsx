import { Suspense, lazy, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { useI18n } from './hooks/useI18n'
import Header from './components/Header'
import StepBar from './components/StepBar'

const ConfigStep = lazy(() => import('./components/steps/ConfigStep'))
const UploadStep = lazy(() => import('./components/steps/UploadStep'))
const AnalysisStep = lazy(() => import('./components/steps/AnalysisStep'))

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.18 } },
}

function StepFallback() {
  const { t } = useI18n()

  return (
    <div className="glass p-6 text-sm text-slate-400" role="status" aria-live="polite">
      {t('app.loadingStep')}
    </div>
  )
}

export default function App() {
  const step = useStore((state) => state.step)
  const language = useStore((state) => state.language)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-2">
        <StepBar />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-20">
        <Suspense fallback={<StepFallback />}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...slide}>
                <ConfigStep />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" {...slide}>
                <UploadStep />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" {...slide}>
                <AnalysisStep />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  )
}
