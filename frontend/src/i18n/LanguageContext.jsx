import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext, LANGS } from './lang';

const STORAGE_KEY = 'mcdm-lang';

function readInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    // úložiště nemusí být dostupné
  }
  return 'cs';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitial);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // volba pak platí jen do obnovení stránky
    }
  }, [lang]);

  // tr(cs, en): vrátí text (nebo JSX) pro aktuální jazyk
  const tr = useCallback((cs, en) => (lang === 'en' ? en : cs), [lang]);
  const value = useMemo(() => ({ lang, setLang, tr }), [lang, tr]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
