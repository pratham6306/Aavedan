import React, { useState, useEffect } from 'react';
import { HiGlobeAlt } from 'react-icons/hi2';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'or', label: 'Odia (ଓଡ଼ିଆ)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'ur', label: 'Urdu (اردو)' },
];

export default function GoogleTranslate() {
  const [selectedLang, setSelectedLang] = useState('en');

  // Read active language from cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/i);
    if (match && match[1]) {
      setSelectedLang(match[1]);
    }
  }, []);

  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setSelectedLang(langCode);

    // 1. Set Google Translate Cookie across paths & domains
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;

    // 2. Trigger Google Translate native combo select element if present
    const comboElem = document.querySelector('.goog-te-combo');
    if (comboElem) {
      comboElem.value = langCode;
      comboElem.dispatchEvent(new Event('change'));
    }
    
    // 3. Dispatch custom event for counters and components to re-animate
    window.dispatchEvent(new CustomEvent('google-lang-change', { detail: langCode }));
  };

  return (
    <div className="relative inline-flex items-center">
      <style>{`
        /* Hide all Google Translate default top toolbars and overlays */
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.skiptranslate,
        #goog-gt-tt,
        .goog-te-balloon-frame {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0px !important;
          position: static !important;
        }
        .skiptranslate {
          font-family: inherit !important;
        }
      `}</style>

      <div className="flex items-center gap-1.5 bg-[#4f3313]/90 hover:bg-[#5f3c17] text-[#fef08a] border border-amber-600/60 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer">
        <HiGlobeAlt className="h-4 w-4 text-amber-400 shrink-0" />
        <select
          value={selectedLang}
          onChange={handleLanguageChange}
          className="bg-transparent text-xs font-bold text-[#fef08a] outline-none cursor-pointer pr-1"
          title="Select Language"
        >
          {LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code} className="bg-[#1c1109] text-amber-100 font-semibold py-1">
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
