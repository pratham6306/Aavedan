import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiLanguage, HiChevronDown, HiCheck, HiMagnifyingGlass, HiGlobeAlt } from 'react-icons/hi2';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', flag: '🇮🇳' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇳🇵' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'zh-CN', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
];

export default function LanguageTranslator({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Initialize Google Translate Script & Sync Cookie
  useEffect(() => {
    // Check initial cookie or saved preference
    const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
    if (match && match[1]) {
      const parts = match[1].split('/');
      const currentCode = parts[parts.length - 1];
      if (currentCode && LANGUAGES.some((l) => l.code === currentCode)) {
        setSelectedLang(currentCode);
      }
    } else {
      const saved = localStorage.getItem('preferred_lang');
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        setSelectedLang(saved);
      }
    }

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: LANGUAGES.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle language switch
  const handleSelectLanguage = (langCode) => {
    setSelectedLang(langCode);
    localStorage.setItem('preferred_lang', langCode);

    // Set Google Translate cookie
    const host = window.location.hostname;
    if (langCode === 'en') {
      document.cookie = 'googtrans=/en/en; path=/;';
      document.cookie = `googtrans=/en/en; path=/; domain=${host};`;
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${host};`;
    }

    // Trigger Google Translate dropdown change
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change'));
      selectElem.dispatchEvent(new Event('input'));
    }

    // Dispatch custom event for stats counters animation
    window.dispatchEvent(new CustomEvent('google-lang-change', { detail: langCode }));

    // Reload page to guarantee 100% translation across all React dynamic nodes & routes
    window.location.reload();
  };

  const activeLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative inline-block text-left notranslate ${className}`} ref={dropdownRef}>
      {/* Hidden container for Google Translate widget */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 hover:border-amber-400/70 text-amber-100 font-semibold text-xs transition-all shadow-sm focus:outline-none"
        title="Change Language / भाषा बदलें"
      >
        <span className="text-amber-400 flex items-center text-sm">
          <HiLanguage className="w-4 h-4" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-xs">{activeLangObj.flag}</span>
          <span className="font-bold tracking-wide">{activeLangObj.native}</span>
        </span>
        <HiChevronDown
          className={`w-3.5 h-3.5 text-amber-300/80 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 rounded-2xl border border-amber-700/50 bg-[#1a1008] p-2 shadow-2xl backdrop-blur-xl z-[9999]"
          >
            {/* Header & Search */}
            <div className="p-2 border-b border-amber-900/50">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <HiGlobeAlt className="w-4 h-4 text-amber-400" />
                  Select Language
                </span>
                <span className="text-[10px] text-amber-400/70 font-medium">Google Translate</span>
              </div>
              <div className="relative">
                <HiMagnifyingGlass className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-amber-400/60" />
                <input
                  type="text"
                  placeholder="Search language / भाषा खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-amber-800/60 pl-8 pr-3 py-1.5 text-xs text-amber-100 placeholder-amber-500/50 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Language List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-1 mt-1 space-y-0.5">
              {filteredLanguages.length === 0 ? (
                <div className="p-3 text-center text-xs text-amber-400/60">No languages found</div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-600/30 text-amber-200 font-bold border border-amber-500/40'
                          : 'text-amber-100/80 hover:bg-amber-900/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{lang.flag}</span>
                        <div className="flex flex-col text-left">
                          <span className="text-amber-100 font-bold">{lang.native}</span>
                          <span className="text-[10px] text-amber-300/60">{lang.name}</span>
                        </div>
                      </div>
                      {isSelected && <HiCheck className="h-4 w-4 text-amber-400" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
