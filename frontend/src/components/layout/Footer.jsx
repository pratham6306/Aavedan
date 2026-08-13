import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import logo from '../../assets/logo.png';

export default function Footer({ variant = 'brown' }) {
  const year = new Date().getFullYear();

  if (variant === 'dashboard') {
    return (
      <footer className="mt-8 mb-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-3xl bg-[#FCF0D7]/85 backdrop-blur-xl border border-amber-600/35 shadow-[0_0_22px_rgba(217,119,6,0.22),0_10px_30px_rgba(0,0,0,0.07)] text-slate-800 overflow-hidden transition-all duration-300 hover:shadow-[0_0_28px_rgba(217,119,6,0.30),0_12px_35px_rgba(0,0,0,0.09)]"
        >
          {/* Main Grid */}
          <div className="p-6 md:p-8 grid gap-8 sm:grid-cols-2 items-start">
            {/* About Column */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-12 w-12 object-contain bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-xs border border-amber-600/30 transition-transform duration-300 hover:scale-105"
                />
                <span className="text-lg md:text-xl font-extrabold text-[#1a2536] tracking-tight uppercase notranslate">
                  AAVEDAN SETU
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed max-w-lg font-medium">
                A unified government complaint management and scheme discovery platform. Empowering citizens to engage with public services efficiently and transparently.
              </p>
            </div>

            {/* Contact Column */}
            <div id="footer-contact" className="sm:justify-self-end">
              <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#1a2536]">
                CONTACT
              </h4>
              <ul className="space-y-2.5 text-xs md:text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2 group">
                  <FiMail className="h-4 w-4 text-amber-800 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <a href="mailto:support@aavedansetu.gov.in" className="hover:text-amber-950 transition-colors">
                    support@aavedansetu.gov.in
                  </a>
                </li>
                <li className="flex items-center gap-2 group">
                  <FiPhone className="h-4 w-4 text-amber-800 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <a href="tel:1800-111-555" className="hover:text-amber-950 transition-colors">
                    1800-111-555 (Toll Free)
                  </a>
                </li>
                <li className="flex items-start gap-2 group">
                  <FiMapPin className="mt-0.5 h-4 w-4 text-amber-800 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Ministry of Electronics & IT, New Delhi, India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-[#F4E3C3]/75 backdrop-blur-md border-t border-amber-600/25 py-3 text-center text-xs font-bold text-slate-600">
            &copy; {year} Aavedan-Setu. All rights reserved.
          </div>
        </motion.div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-br from-[#2d1b0d] via-[#1c0f05] to-[#2d1b0d] text-amber-100/70 border-t border-amber-950/20">
      {/* Main grid */}
      <div className="mx-auto max-w-5xl px-6 py-12 grid gap-10 sm:grid-cols-2">
        {/* About */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Logo" className="h-12 w-12 object-contain bg-white p-1.5 rounded-xl shadow-md border border-white/20" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-white tracking-tight leading-none">AAVEDAN SETU</span>
              <span className="text-[11px] font-semibold text-[#f59e0b] leading-none tracking-wide mt-1">E-GOVERNANCE PLATFORM</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-amber-200/50">
            A unified government complaint management and scheme discovery platform. Empowering citizens to engage with public services efficiently and transparently.
          </p>
        </div>

        {/* Contact */}
        <div id="footer-contact">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-200/50">
            Contact
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <FiMail className="h-4 w-4 text-amber-400" />
              <a href="mailto:support@aavedansetu.gov.in" className="hover:text-amber-300 transition-colors">
                support@aavedansetu.gov.in
              </a>
            </li>
            <li className="flex items-center gap-2">
              <FiPhone className="h-4 w-4 text-amber-400" />
              <a href="tel:1800-111-555" className="hover:text-amber-300 transition-colors">
                1800-111-555 (Toll Free)
              </a>
            </li>
            <li className="flex items-start gap-2">
              <FiMapPin className="mt-0.5 h-4 w-4 text-amber-400" />
              <span>Ministry of Electronics & IT, New Delhi, India</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-6 py-4 sm:flex-row">
          <p className="text-xs text-amber-200/30">
            &copy; {year} Aavedan-Setu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
