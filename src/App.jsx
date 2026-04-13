import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import Header   from './components/Header'
import StepBar  from './components/StepBar'
import ConfigStep   from './components/steps/ConfigStep'
import UploadStep   from './components/steps/UploadStep'
import AnalysisStep from './components/steps/AnalysisStep'

const slide = {
  initial:   { opacity: 0, x: 30 },
  animate:   { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit:      { opacity: 0, x: -20, transition: { duration: 0.18 } },
}

export default function App() {
  const step = useStore((s) => s.step)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-2">
        <StepBar />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-20">
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
      </main>
    </div>
  )
}
