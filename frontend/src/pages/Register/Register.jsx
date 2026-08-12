import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Globe, Headphones, ChevronDown } from "lucide-react";

import RegisterNavbar from "./RegisterNavbar";
import RegisterHero from "./RegisterHero";
import RegisterFloatingCards from "./RegisterFloatingCards";
import RegisterQuickActions from "./RegisterQuickActions";
import RegisterLatestNews from "./RegisterLatestNews";
import RegisterCard from "./RegisterCard";
import RegisterAIChat from "./RegisterAIChat";
import RegisterFooter from "./RegisterFooter";

import background from "../../assets/background.png";

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Language Dropdown states for yellow area
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("English");
  const dropdownRef = useRef(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Close language dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleHelpClick = () => {
    const footerElement = document.getElementById("register-footer");
    if (footerElement) {
      footerElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const languages = [
    { code: "en", label: "English", display: "English" },
    { code: "hi", label: "Hindi (हिन्दी)", display: "Hindi" },
    { code: "or", label: "Odia (ଓଡ଼ିଆ)", display: "Odia" },
  ];

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6c548]">
        <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f6c548] flex flex-col justify-between overflow-y-auto">
      {/* Portal Section */}
      <div className="w-full flex-1">
        <div className="relative w-full lg:h-screen lg:max-h-[850px] min-h-[840px] overflow-hidden bg-[#f6c548]">
          <img
            src={background}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />

          <RegisterNavbar />

          {/* Floating Actions on Yellow background (aligned under Navbar.jsx at top-right corner) */}
          <div className="absolute top-[80px] right-10 z-30 flex items-center gap-6 pointer-events-auto select-none">
            {/* Language Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLangDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 text-[#0B1D48] hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-0 outline-none font-bold text-[15px]"
              >
                <Globe size={18} className="text-sky-500" />
                <span>{activeLang}</span>
                <ChevronDown
                  size={14}
                  className={`text-[#0B1D48] transition-transform duration-200 ${
                    langDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50 transition-all">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setActiveLang(lang.display);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[14px] font-bold transition-colors flex justify-between items-center cursor-pointer ${
                        activeLang === lang.display
                          ? "text-amber-800 bg-amber-50"
                          : "text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                      }`}
                    >
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Help Center Smooth Scroll Anchor */}
            <button
              onClick={handleHelpClick}
              className="flex items-center gap-2 text-[#0B1D48] hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-0 outline-none font-bold text-[15px]"
            >
              <Headphones size={18} className="text-slate-400" />
              Help Center
            </button>
          </div>
       
          {/* ── MAIN CONTENT GRID MATCHING LOGIN.JSX ── */}
          <main className="relative z-10 flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-8 pt-20 lg:pt-24 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              
              {/* COLUMN 1: Hero, Quick Actions, News Slider (Left 5 Columns) */}
              <div className="flex flex-col gap-6 items-start lg:col-span-5 w-full order-last lg:order-first">
                <RegisterHero />
                <RegisterQuickActions onAIChatToggle={() => setIsAIChatOpen(true)} />
                <RegisterLatestNews />
              </div>

              {/* COLUMN 2: Center Grid Spacer for Floating Cards */}
              <div className="hidden lg:block lg:col-span-3 relative pointer-events-none" />

              {/* Floating ID Cards */}
              <RegisterFloatingCards />

              {/* COLUMN 3: Register Form Card (Right 4 Columns) */}
              <div className="w-full lg:col-span-4 flex justify-center lg:justify-end py-2 relative z-10 h-full items-start order-first lg:order-last lg:translate-x-4 lg:mt-6">
                <RegisterCard />
              </div>

            </div>
          </main>
        </div>
      </div>

      {/* Government Footer */}
      <RegisterFooter />

      {/* Slide-in AI Assistant Chat Drawer */}
      <RegisterAIChat
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </div>
  );
}
