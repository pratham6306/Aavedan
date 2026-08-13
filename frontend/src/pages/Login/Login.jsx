/**
 * @file Login.jsx
 * @description Redesigned premium login page matching the custom AAVEDAN-SETU layout.
 *              Features a split-screen layout overlaying a custom high-res background,
 *              floating animated ID cards (Aadhaar, Ayushman, Ration) positioned with mathematically uniform spacing,
 *              an interactive Latest Schemes slider (zoomed-in for readability), a dedicated compact Login form card,
 *              Aavedan Setu brand logo integration, a language switching dropdown (English, Hindi, Odia),
 *              a smooth scroll anchor from Help Center to the contact footer, and a yellow contact footer.
 */

import { useState, useEffect, useRef } from 'react';
import LoginAIChat from './LoginAIChat';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Globe, Headphones, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  HiEnvelope,
  HiLockClosed,
  HiEye,
  HiEyeSlash,
  HiHome,
  HiDocumentText,
  HiChartBar,
  HiUserGroup,
  HiCpuChip,
  HiPhone,
  HiGlobeAlt,
  HiChevronDown,
  HiArrowRight,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';

import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import RegisterNavbar from '../Register/RegisterNavbar';
import RegisterFooter from '../Register/RegisterFooter';
import RegisterFloatingCards from '../Register/RegisterFloatingCards';

// Import background asset matching Register page
import background from '../../assets/background.png';
import aadhaarImg from '../../assets/aadhaar.jpg';
import rationImg from '../../assets/ration.jpg';
import ayushmanImg from '../../assets/ayushman.jpg';

/* ── Animation Variants ── */
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Mock Data for Latest Schemes Slider ── */
const SCHEME_ITEMS = [
  {
    title: 'PM Kisan Yojana',
    date: 'Updated: May 20, 2024',
    desc: 'Financial support of ₹6,000 per year provided to eligible farmer families across India.',
    iconColor: 'bg-emerald-500',
    svgIcon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    ),
  },
  {
    title: 'Ayushman Bharat',
    date: 'Updated: May 18, 2024',
    desc: 'Free health insurance cover of up to ₹5 Lakh per family for secondary hospitalizations.',
    iconColor: 'bg-indigo-500',
    svgIcon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Digital Scholarship',
    date: 'Updated: May 15, 2024',
    desc: 'Direct scholarships for students pursuing engineering, technical, and medical courses.',
    iconColor: 'bg-amber-500',
    svgIcon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithOTP, isAuthenticated, loading: authLoading } = useAuth();

  const [loginType, setLoginType] = useState('password'); // 'password' or 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemeIndex, setSchemeIndex] = useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Language Dropdown states
  const [selectedLang, setSelectedLang] = useState('English');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: "en", label: "English", display: "English" },
    { code: "hi", label: "Hindi (हिन्दी)", display: "Hindi" },
    { code: "or", label: "Odia (ଓଡ଼ିଆ)", display: "Odia" },
  ];

  // Close language dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleHelpClick = () => {
    const contactFooter = document.getElementById('register-footer');
    if (contactFooter) {
      contactFooter.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    watch: loginWatch,
    trigger: loginTrigger,
    formState: { errors: loginErrors },
  } = useForm({
    defaultValues: {
      identifier: '',
      password: '',
      phone: '',
      otp: '',
    },
  });

  const phoneValue = loginWatch('phone');

  /* ── Cooldown timer ── */
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  /* ── Redirect if already authenticated ── */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /* ── Trigger OTP sending ── */
  const sendVerificationOTP = async () => {
    const isPhoneValid = await loginTrigger('phone');
    if (!isPhoneValid) return;

    setOtpSending(true);
    try {
      const res = await authService.sendOTP({ phone: phoneValue });
      setOtpSent(true);
      setCooldown(60);
      toast.success(res.message || 'OTP sent successfully!');
    } catch (error) {
      const message =
        error?.response?.data?.phone?.[0] ||
        error?.response?.data?.message ||
        'Failed to send OTP. Ensure phone number is registered.';
      toast.error(message);
    } finally {
      setOtpSending(false);
    }
  };

  /* ── Login Form submission ── */
  const onLoginSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (loginType === 'password') {
        await login({
          identifier: data.identifier.trim(),
          password: data.password,
        });
      } else {
        await loginWithOTP({
          phone: data.phone.trim(),
          otp: data.otp.trim(),
        });
      }
      toast.success('Welcome back! Redirecting to dashboard…');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        error?.response?.data?.message ||
        'Authentication failed. Please check details.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Google Sign In Handler ── */
  const handleGoogleSignIn = () => {
    toast.info('Google authentication integration coming soon!');
  };

  /* ── Scheme slider handlers ── */
  const handlePrevScheme = () => {
    if (schemeIndex > 0) {
      setSchemeIndex((prev) => prev - 1);
    }
  };

  const handleNextScheme = () => {
    if (schemeIndex < SCHEME_ITEMS.length - 2) {
      setSchemeIndex((prev) => prev + 1);
    }
  };

  /* ── Smooth Scroll to Footer Contacts ── */
  const handleHelpCenterClick = () => {
    const contactFooter = document.getElementById('register-footer');
    if (contactFooter) {
      contactFooter.scrollIntoView({ behavior: 'smooth' });
      toast.info('Scrolling to support contact information…');
    }
  };

  /* ── Auth loading state ── */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-400 via-amber-300 to-orange-400">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f6c548] flex flex-col justify-between overflow-y-auto font-sans">
      
      {/* ── Dropdown outside click catcher backdrop ── */}
      {isLangDropdownOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent cursor-default"
          onClick={() => setIsLangDropdownOpen(false)}
        />
      )}

      {/* ── Portal Section matching Register.jsx ── */}
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
              type="button"
              onClick={() => setIsLangDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 text-[#0B1D48] hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-0 outline-none font-bold text-[15px]"
            >
              <Globe size={18} className="text-sky-500" />
              <span>{selectedLang}</span>
              <ChevronDown
                size={14}
                className={`text-[#0B1D48] transition-transform duration-200 ${
                  isLangDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50 transition-all">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.display);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[14px] font-bold transition-colors flex justify-between items-center cursor-pointer ${
                      selectedLang === lang.display
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
            type="button"
            onClick={handleHelpClick}
            className="flex items-center gap-2 text-[#0B1D48] hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-0 outline-none font-bold text-[15px]"
          >
            <Headphones size={18} className="text-slate-400" />
            Help Center
          </button>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 pl-6 pr-6 md:pl-12 md:pr-6 lg:pr-0 items-center max-w-[1440px] mx-auto w-full pt-24 lg:pt-28">
          
          {/* COLUMN 1: Titles & Actions (Left 5 Columns) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 items-start relative h-auto lg:-translate-y-20">
            
            {/* Titles & Paragraph (Enlarged Fonts) */}
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#E11D48] tracking-wide select-none">
                Smart Services.
              </span>
              <h1 className="text-[38px] font-black tracking-tight leading-[1.1] text-slate-900 mt-1 select-none">
                <span className="text-[#991B1B]">Strong India.</span>
                <br />
                <span className="text-[#0F172A]">AI-Powered</span>
                <br />
                <span className="text-[#0F172A]">Citizen Services</span>
              </h1>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed mt-4 max-w-sm select-none">
                Empowering every citizen with AI-driven governance.
                <br /><br />
                Submit complaints, track applications,
                discover schemes and receive instant
                government assistance — all from one
                secure platform.
              </p>
            </div>

            {/* 4 Feature Circular Cards Row */}
            <div className="grid grid-cols-4 gap-4 max-w-[390px] select-none mt-2">
              
              <div className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-indigo-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
                  <HiDocumentText className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[11px] font-extrabold text-slate-700 leading-none">Submit</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">Complaint</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-emerald-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
                  <HiChartBar className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[11px] font-extrabold text-slate-700 leading-none">Track</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">Status</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#FFFBEB] border border-amber-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[11px] font-extrabold text-slate-700 leading-none">Find</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">Schemes</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setIsAIChatOpen(true)}>
                <div className="w-12 h-12 rounded-full bg-[#FDF4FF] border border-fuchsia-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
                  <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[11px] font-extrabold text-slate-700 leading-none">AI</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">Assistant</span>
                </div>
              </div>

            </div>

            {/* Latest Schemes Section (Matching Signup Layout & Design) */}
            <div className="flex gap-4 items-start max-w-[440px] w-full select-none mt-6">
              
              {/* Left Column (Title and Slider Buttons) */}
              <div className="w-[110px] flex-shrink-0">
                <h2 className="text-[#8c2323] text-2xl font-bold">Latest</h2>
                <h2 className="text-[#14295d] text-2xl font-black leading-none">Schemes</h2>
                <div className="flex gap-2 mt-4 select-none">
                  {/* Left Arrow Button */}
                  <button
                    type="button"
                    onClick={handlePrevScheme}
                    disabled={schemeIndex === 0}
                    className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all ${
                      schemeIndex === 0
                        ? "bg-white text-gray-300 cursor-not-allowed opacity-50 border border-slate-100"
                        : "bg-white text-[#14295d] hover:bg-gray-50 hover:scale-110 active:scale-95 cursor-pointer border border-slate-200"
                    }`}
                    aria-label="Previous schemes"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Right Arrow Button */}
                  <button
                    type="button"
                    onClick={handleNextScheme}
                    disabled={schemeIndex >= SCHEME_ITEMS.length - 2}
                    className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all ${
                      schemeIndex >= SCHEME_ITEMS.length - 2
                        ? "bg-purple-300 text-white cursor-not-allowed opacity-50"
                        : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-110 active:scale-95 cursor-pointer"
                    }`}
                    aria-label="Next schemes"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Cards Slider Wrapper */}
              <div className="w-[310px] overflow-hidden">
                <motion.div
                  className="flex gap-2 py-1"
                  animate={{ x: -schemeIndex * 153 }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                >
                  {SCHEME_ITEMS.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-[145px] bg-white/50 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-4 flex flex-col justify-between h-[210px] flex-shrink-0"
                    >
                      <div>
                        <div className="flex items-start gap-1.5">
                          <div className={`w-8 h-8 rounded-full ${item.iconColor} flex items-center justify-center shrink-0 border border-white shadow-sm`}>
                            {item.svgIcon}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[11px] text-[#1c2957] truncate w-[80px]" title={item.title}>
                              {item.title}
                            </h3>
                            <p className="text-[8px] text-gray-500 mt-0.5">
                              {item.date}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2 text-[10px] text-[#334155] leading-normal line-clamp-4 font-medium">
                          {item.desc}
                        </p>
                      </div>

                      <Link
                        to="/schemes"
                        className="mt-2 text-purple-600 font-bold text-[11px] hover:text-purple-800 transition flex items-center gap-1 self-start cursor-pointer"
                      >
                        Read More →
                      </Link>
                    </div>
                  ))}
                </motion.div>
              </div>

            </div>

          </div>

          {/* COLUMN 2: Center Grid Spacer */}
          <div className="hidden lg:block lg:col-span-3 relative pointer-events-none" />

          {/* Floating Cards (Positioned exactly like Register page) */}
          <RegisterFloatingCards />

          {/* COLUMN 3: The Zoomed-In Login Form Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="w-full lg:col-span-4 flex justify-center lg:justify-end py-2 relative z-10 h-full items-start mt-16 lg:mr-0 lg:-translate-x-6"
          >
            <div className="bg-white/70 backdrop-blur-3xl rounded-[34px] border border-white/70 shadow-[0_40px_80px_rgba(0,0,0,.12)] p-8 md:py-8 md:px-10 w-full max-w-[430px] flex flex-col gap-6 overflow-hidden">
              
              {/* Form Headers */}
              <div className="flex flex-col select-none">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                    Welcome Back! 👋
                  </h2>
                  <Link
                    to="/"
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 px-3.5 py-1.5 rounded-xl shadow-md hover:scale-[1.03] transition-all cursor-pointer"
                    title="Return to Home Page"
                  >
                    <HiHome className="w-3.5 h-3.5 text-white" />
                    <span>Home</span>
                  </Link>
                </div>
                <p className="text-xs text-slate-400 font-bold mt-1.5">
                  Securely access all government services using your account.
                </p>
              </div>

              {/* Login Type Tabs */}
              <div className="flex border-b border-slate-100 text-sm font-extrabold select-none">
                <button
                  type="button"
                  onClick={() => setLoginType('password')}
                  className={`pb-2.5 px-4 transition-all border-b-2 text-[15px] cursor-pointer ${
                    loginType === 'password'
                      ? 'text-violet-600 border-violet-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('otp')}
                  className={`pb-2.5 px-4 transition-all border-b-2 text-[15px] cursor-pointer ${
                    loginType === 'otp'
                      ? 'text-violet-600 border-violet-600'
                      : 'text-slate-400 border-transparent hover:text-slate-600'
                  }`}
                >
                  {"Login with OTP"}
                </button>
              </div>

              {/* LOGIN FORM */}
              <form
                onSubmit={handleLoginSubmit(onLoginSubmit)}
                className="flex flex-col gap-5"
                noValidate
              >
                {loginType === 'password' ? (
                  <>
                    {/* Email / Phone Field */}
                    <div className="flex flex-col">
                      <label htmlFor="identifier" className="text-xs font-bold text-slate-600 mb-1.5">
                        Email / Phone Number
                      </label>
                      <div className="relative">
                        <HiEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          id="identifier"
                          type="text"
                          placeholder="Enter your email or phone number"
                          className={`w-full py-4 pl-10 pr-4 text-[15px] bg-white border ${loginErrors.identifier ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                          {...loginRegister('identifier', {
                            required: 'Email address or Phone number is required',
                            validate: (value) => {
                              const trimmed = value.trim();
                              if (!EMAIL_REGEX.test(trimmed) && !PHONE_REGEX.test(trimmed)) {
                                return 'Enter a valid email address or 10-digit Indian phone number';
                              }
                              return true;
                            },
                          })}
                        />
                      </div>
                      {loginErrors.identifier && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                          {loginErrors.identifier.message}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="flex flex-col">
                      <label htmlFor="password" className="text-xs font-bold text-slate-600 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className={`w-full py-4 pl-10 pr-10 text-[15px] bg-white border ${loginErrors.password ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                          {...loginRegister('password', { required: 'Password is required' })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <HiEyeSlash className="w-4.5 h-4.5" /> : <HiEye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                          {loginErrors.password.message}
                        </p>
                      )}

                      {/* Forgot Password Link */}
                      <div className="flex justify-end mt-2">
                        <Link
                          to="/forgot-password"
                          className="text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Phone number */}
                    <div className="flex flex-col">
                      <label htmlFor="phone" className="text-xs font-bold text-slate-600 mb-1.5">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <HiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                          <input
                            id="phone"
                            type="tel"
                            placeholder="Enter 10-digit number"
                            className={`w-full py-4 pl-10 pr-4 text-[15px] bg-white border ${loginErrors.phone ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                            disabled={otpSent}
                            {...loginRegister('phone', {
                              required: 'Phone number is required for OTP login',
                              pattern: {
                                value: PHONE_REGEX,
                                message: 'Please enter a valid 10-digit Indian phone number',
                              },
                            })}
                          />
                        </div>
                        {!otpSent && (
                          <button
                            type="button"
                            onClick={sendVerificationOTP}
                            disabled={otpSending || cooldown > 0}
                            className="px-4 py-4 rounded-2xl border border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white transition-all font-bold text-xs whitespace-nowrap cursor-pointer disabled:opacity-50"
                          >
                            {otpSending ? 'Sending…' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Send OTP'}
                          </button>
                        )}
                      </div>
                      {loginErrors.phone && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                          {loginErrors.phone.message}
                        </p>
                      )}
                    </div>

                    {/* OTP code */}
                    {otpSent && (
                      <div className="flex flex-col">
                        <label htmlFor="otp" className="text-xs font-bold text-slate-600 mb-1.5">
                          Verification Code (OTP)
                        </label>
                        <div className="relative">
                          <HiChatBubbleLeftRight className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                          <input
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className={`w-full py-4 pl-10 pr-4 text-[15px] bg-white border ${loginErrors.otp ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                            {...loginRegister('otp', {
                              required: 'OTP is required',
                              pattern: {
                                value: /^\d{6}$/,
                                message: 'OTP must be a 6-digit number',
                              },
                            })}
                          />
                        </div>
                        {loginErrors.otp && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">
                            {loginErrors.otp.message}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-3 text-xs font-bold">
                          <span className="text-[10px] text-slate-400">OTP Sent successfully</span>
                          <button
                            type="button"
                            onClick={sendVerificationOTP}
                            disabled={otpSending || cooldown > 0}
                            className="text-violet-600 hover:text-violet-700 disabled:opacity-50 cursor-pointer"
                          >
                            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || (loginType === 'otp' && !otpSent)}
                  style={{
                    background: "linear-gradient(135deg,#6D28D9,#9333EA,#7C3AED)"
                  }}
                  className="w-full py-3.5 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 active:translate-y-0 text-[15px] select-none mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <span>{loginType === 'password' ? 'Login' : 'Verify & Login'}</span>
                  )}
                </button>
              </form>

              {/* Divider lines */}
              <div className="relative flex py-1.5 items-center select-none">
                <div className="flex-grow border-t border-slate-200/80"></div>
                <span className="flex-shrink mx-4 text-xs font-black text-slate-400">OR</span>
                <div className="flex-grow border-t border-slate-200/80"></div>
              </div>

              {/* Google OAuth button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 border border-slate-200 bg-white/70 backdrop-blur-md hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-3 text-sm select-none"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.13-1.15 2.19l3.22 2.5c1.88-1.73 2.98-4.28 2.98-6.52z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.22-2.5c-.9.6-2.05.96-3.48.96-3.24 0-5.97-2.18-6.95-5.11H1.02v2.58C3 21.09 7.21 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.05 14.44c-.25-.7-.39-1.46-.39-2.24s.14-1.54.39-2.24V7.38H1.02c-.85 1.7-1.34 3.59-1.34 5.62s.49 3.92 1.34 5.62l4.03-3.18z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.21 0 3 2.91 1.02 6.38l4.03 3.18c.98-2.93 3.71-5.11 6.95-5.11z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Registration link footer */}
              <div className="text-center select-none">
                <span className="text-xs font-bold text-slate-500">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-extrabold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                  >
                    Register Now
                  </Link>
                </span>
              </div>

            </div>
          </motion.div>
        </main>
        </div>
      </div>

      <RegisterFooter />

      <LoginAIChat
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </div>
  );
}
