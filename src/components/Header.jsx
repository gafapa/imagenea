import { ImageIcon } from 'lucide-react'

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-surface-border"
      style={{ background: 'rgba(13,20,36,0.9)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-900/50">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            <span className="gradient-text">ImageDoc</span>
            <span className="text-slate-300"> AI</span>
          </span>
        </div>

        <p className="hidden sm:block text-xs text-slate-500">
          Enriquece documentos Word con imágenes generadas por IA
        </p>
      </div>
    </header>
  )
}
