import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'bn' | 'te' | 'mr'

interface LanguageContextType {
  lang: SupportedLanguage
  setLang: (lang: SupportedLanguage) => void
  t: (key: string, params?: Record<string, string | number>) => string
  availableLanguages: { code: SupportedLanguage; name: string; native: string }[]
}

// ── Translations Loader ──────────────────────────────────────────────────

const translationsCache = new Map<string, any>()

async function loadTranslations(lang: SupportedLanguage): Promise<any> {
  if (translationsCache.has(lang)) {
    return translationsCache.get(lang)
  }

  try {
    const module = await import(`./translations/${lang}.json`)
    translationsCache.set(lang, module.default)
    return module.default
  } catch {
    // Fallback to English
    const enModule = await import('./translations/en.json')
    translationsCache.set(lang, enModule.default)
    return enModule.default
  }
}

const LANGUAGE_NAMES: Record<SupportedLanguage, { name: string; native: string }> = {
  en: { name: 'English', native: 'English' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  ta: { name: 'Tamil', native: 'தமிழ்' },
  bn: { name: 'Bengali', native: 'বাংলা' },
  te: { name: 'Telugu', native: 'తెలుగు' },
  mr: { name: 'Marathi', native: 'मराठी' },
}

// ── Context ──────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | null>(null)

const STORAGE_KEY = 'boon-language'

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result == null) return undefined
    result = result[key]
  }
  return typeof result === 'string' ? result : undefined
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key]
    return value != null ? String(value) : `{{${key}}}`
  })
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && ['en', 'hi', 'ta', 'bn', 'te', 'mr'].includes(stored)) {
        return stored as SupportedLanguage
      }
    } catch {}
    return 'en'
  })

  const [translations, setTranslations] = useState<any>({})

  useEffect(() => {
    loadTranslations(lang).then(setTranslations)
  }, [lang])

  const setLang = useCallback((newLang: SupportedLanguage) => {
    setLangState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch {}
    // Set HTML lang attribute
    document.documentElement.lang = newLang
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(translations, key)
      if (value) return interpolate(value, params)

      // Try to get from English as fallback
      const enData = translationsCache.get('en')
      const enValue = enData ? getNestedValue(enData, key) : undefined
      if (enValue) return interpolate(enValue, params)

      // Fallback: return the key itself
      return key
    },
    [translations],
  )

  const availableLanguages = Object.entries(LANGUAGE_NAMES).map(([code, names]) => ({
    code: code as SupportedLanguage,
    ...names,
  }))

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

// ── t() convenience function for components without useLanguage hook ────
// (Not exported — components should use useLanguage hook instead)
