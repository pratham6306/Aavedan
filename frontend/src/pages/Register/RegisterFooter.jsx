import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import logo from "../../assets/logo.png";

export default function RegisterFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="register-footer" className="w-full">
      {/* Premium Yellowish Glassmorphism Container */}
      <div
        className="
          overflow-hidden
          bg-yellow-500/10
          backdrop-blur-xl
          border-t
          border-yellow-500/15
          text-slate-800
        "
      >
        {/* Main grid */}
        <div className="mx-auto max-w-7xl px-8 py-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-2">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt="Logo"
                className="h-16 w-16 object-contain bg-white p-1.5 rounded-xl shadow-md border border-white/20"
              />
              <span className="text-[20px] font-extrabold text-[#0B1D48] tracking-tight uppercase leading-none">
                Aavedan Setu
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 font-medium">
              A unified government complaint management and scheme discovery
              platform. Empowering citizens to engage with public services
              efficiently and transparently.
            </p>
          </div>

          {/* Contact */}
          <div className="ml-0 sm:ml-28">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#0B1D48]">
              Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FiMail className="h-4 w-4 text-amber-600" />
                <a 
                  href="mailto:support@aavedansetu.gov.in" 
                  className="hover:text-amber-600 font-bold text-slate-700 transition-colors"
                >
                  support@aavedansetu.gov.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="h-4 w-4 text-amber-600" />
                <a 
                  href="tel:1800-111-555" 
                  className="hover:text-amber-600 font-bold text-slate-700 transition-colors"
                >
                  1800-111-555 (Toll Free)
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 h-4 w-4 text-amber-600" />
                <span className="font-bold text-slate-700">
                  Ministry of Electronics &amp; IT, New Delhi, India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/5 py-4 bg-black/5">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-8">
            <p className="text-xs font-semibold text-slate-500">
              &copy; {year} Aavedan-Setu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
