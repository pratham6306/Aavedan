/**
 * Footer.jsx
 * ------------
 * Full-width site footer with a dark government-blue background.
 *
 * Layout:
 *   • About column – brief platform description
 *   • Quick Links   – internal navigation
 *   • Contact       – email & helpline
 *   • Bottom bar    – copyright + SIH badge
 */
import { Link } from 'react-router-dom';
import { HiShieldCheck } from 'react-icons/hi2';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const quickLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'File a Complaint', to: '/complaints/create' },
  { label: 'View Schemes', to: '/schemes' },
  { label: 'FAQs', to: '/faq' },
  { label: 'Privacy Policy', to: '/privacy' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gov-900 text-gray-300">
      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {/* ── About ─────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HiShieldCheck className="h-7 w-7 text-gov-400" />
            <span className="text-lg font-bold text-white">GovConnect</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            A unified government complaint management and scheme discovery
            platform. Empowering citizens to engage with public services
            efficiently and transparently.
          </p>
        </div>

        {/* ── Quick Links ───────────────── */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Quick Links
          </h4>
          <ul className="space-y-2">
            {quickLinks.map(({ label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Contact ───────────────────── */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Contact
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <FiMail className="h-4 w-4 text-gov-400" />
              <a href="mailto:support@govconnect.gov.in" className="hover:text-white transition-colors">
                support@govconnect.gov.in
              </a>
            </li>
            <li className="flex items-center gap-2">
              <FiPhone className="h-4 w-4 text-gov-400" />
              <a href="tel:1800-111-555" className="hover:text-white transition-colors">
                1800-111-555 (Toll Free)
              </a>
            </li>
            <li className="flex items-start gap-2">
              <FiMapPin className="mt-0.5 h-4 w-4 text-gov-400" />
              <span>Ministry of Electronics &amp; IT, New Delhi, India</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-4">
          <p className="text-center text-xs text-gray-500">
            &copy; {year} GovConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
