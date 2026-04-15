import { useMemo } from 'react'
import { useStore } from '../store'
import { translate } from '../lib/i18n'

export function useI18n() {
  const language = useStore((state) => state.language)

  const t = useMemo(() => {
    return (key, params) => translate(language, key, params)
  }, [language])

  return { language, t }
}
