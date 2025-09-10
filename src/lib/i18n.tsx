'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../locales/en.json';
import pt from '../locales/pt.json';

type Language = 'en' | 'pt';
type TranslationKey = string;

interface TranslationContextType {
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  availableLanguages: { code: Language; name: string }[];
}

const translations = { en, pt };

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pt')) {
      setLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (browserLang === 'pt') {
        setLanguage('pt');
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      // Fallback to English if translation not found
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
      }
      if (typeof value !== 'string') {
        return key; // Return key if translation not found
      }
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, replacement]) => {
        value = value.replace(new RegExp(`{${param}}`, 'g'), replacement);
      });
    }

    return value;
  };

  const availableLanguages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'pt' as Language, name: 'Português' },
  ];

  return (
    <TranslationContext.Provider
      value={{
        t,
        language,
        setLanguage: handleSetLanguage,
        availableLanguages,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Hook for getting translated text
export function useT() {
  const { t } = useTranslation();
  return t;
}
