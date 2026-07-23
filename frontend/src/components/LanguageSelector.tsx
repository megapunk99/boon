import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import { Globe } from 'lucide-react'

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  ta: '🇮🇳',
  bn: '🇮🇳',
  te: '🇮🇳',
  mr: '🇮🇳',
}

export default function LanguageSelector() {
  const { lang, setLang, t, availableLanguages } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = availableLanguages.find(l => l.code === lang)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all"
        title={t('language.select')}
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current?.native || 'English'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 py-1 bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl z-50">
          <div className="px-3 py-1.5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {t('language.select')}
          </div>
          {availableLanguages.map(l => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors ${
                lang === l.code
                  ? 'text-emerald-300 bg-emerald-500/10'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="text-base">{LANGUAGE_FLAGS[l.code]}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{l.native}</span>
                <span className="text-[10px] text-gray-500">{l.name}</span>
              </div>
              {lang === l.code && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
