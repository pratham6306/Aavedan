/**
 * Sidebar.jsx
 * -------------
 * Left sidebar navigation for the authenticated dashboard layout.
 *
 * Props:
 *   isOpen    – boolean  – whether the sidebar is expanded
 *   onToggle  – function – toggle expand/collapse
 *
 * Features:
 *   • Fixed w-64 on desktop, overlay on mobile
 *   • Smooth Framer Motion width / opacity animations
 *   • Active link highlighting via react-router-dom NavLink
 *   • Glass-card aesthetic
 */
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiPlusCircle,
  HiClipboardDocumentList,
  HiDocumentText,
  HiAcademicCap,
  HiBell,
  HiUserCircle,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';

/* ── Navigation items ───────────────────────── */
const navItems = [
  { label: 'Dashboard',        to: '/dashboard',         icon: HiHome },
  { label: 'Create Complaint', to: '/complaints/create', icon: HiPlusCircle },
  { label: 'My Complaints',    to: '/my-complaints',     icon: HiClipboardDocumentList },
  { label: 'All Complaints',   to: '/complaints',        icon: HiDocumentText },
  { label: 'Schemes',          to: '/schemes',           icon: HiAcademicCap },
  { label: 'Notifications',    to: '/notifications',     icon: HiBell },
  { label: 'Profile',          to: '/profile',           icon: HiUserCircle },
];

/* ── Helper: NavLink class builder ──────────── */
function linkClasses({ isActive }) {
  const base =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
  return isActive
    ? `${base} bg-gov-600 text-white shadow-sm`
    : `${base} text-gray-600 hover:bg-gov-50 hover:text-gov-700`;
}

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <>
      {/* ── Mobile backdrop ──────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ────────────────── */}
      <motion.aside
        className={`
          fixed top-16 left-0 z-40 flex h-[calc(100vh-4rem)] flex-col
          glass-card rounded-none border-l-0 border-t-0 border-b-0
          lg:sticky lg:top-16 lg:z-30
          ${isOpen ? 'w-64' : 'w-0 lg:w-16'}
          overflow-hidden transition-[width] duration-300 ease-in-out
        `}
      >
        {/* Inner wrapper – keeps content from collapsing */}
        <div className="flex h-full w-64 flex-col">
          {/* Toggle button */}
          <div className="flex items-center justify-end px-3 py-3">
            <button
              onClick={onToggle}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gov-50 hover:text-gov-600 transition-colors"
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? (
                <HiChevronLeft className="h-5 w-5" />
              ) : (
                <HiChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to} end className={linkClasses}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom branding */}
          {isOpen && (
            <div className="border-t border-gray-100 px-4 py-3 text-[11px] text-gray-400">
              Aavedan-Setu v1.0
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
