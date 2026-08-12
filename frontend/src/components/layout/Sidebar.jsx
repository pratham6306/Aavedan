import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiHome,
  HiPlusCircle,
  HiClipboardDocumentList,
  HiDocumentText,
  HiAcademicCap,
  HiBell,
  HiUserCircle,
  HiQuestionMarkCircle,
  HiArrowRightOnRectangle,
  HiChevronRight,
  HiXMark,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { useUnreadNotifications } from '../../hooks/useNotifications';

/* ── Navigation items matching reference screenshot ───────────── */
const navItems = [
  { label: 'Dashboard',        to: '/dashboard',         icon: HiHome },
  { label: 'Create Complaint', to: '/complaints/create', icon: HiPlusCircle },
  { label: 'My Complaints',    to: '/my-complaints',     icon: HiClipboardDocumentList },
  { label: 'All Complaints',   to: '/complaints',        icon: HiDocumentText },
  { label: 'Schemes',          to: '/schemes',           icon: HiAcademicCap },
  { label: 'Notifications',    to: '/notifications',     icon: HiBell, showBadge: true },
  { label: 'Profile',          to: '/profile',           icon: HiUserCircle },
  { label: 'Help Center',      to: '/profile',           icon: HiQuestionMarkCircle },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: notificationsData } = useUnreadNotifications();
  const unreadCount = notificationsData?.results?.length || 2;

  function handleLogout() {
    logout();
    navigate('/login');
  }

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

      {/* ── Sidebar panel matching reference screenshot ────────────────── */}
      <motion.aside
        className={`
          fixed top-16 left-0 z-40 flex h-[calc(100vh-4rem)] flex-col justify-between
          bg-[#fff8eb] border-r border-amber-200/60 shadow-sm
          lg:sticky lg:top-16 lg:z-30
          ${isOpen ? 'w-64' : 'w-16'}
          overflow-hidden transition-[width] duration-300 ease-in-out select-none
        `}
      >
        {/* Inner wrapper */}
        <div className={`flex h-full flex-col justify-between ${isOpen ? 'w-64 p-3' : 'w-16 py-3 px-1'}`}>
          {/* Top Close / Toggle Button */}
          <div className={`flex items-center ${isOpen ? 'justify-end px-2 pt-1 pb-1' : 'justify-center pt-1 pb-1'}`}>
            <button
              onClick={onToggle}
              className="rounded-lg p-1 text-slate-400 hover:bg-amber-100/60 hover:text-slate-700 transition-colors"
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isOpen ? 'Minimize Menu' : 'Expand Menu'}
            >
              {isOpen ? (
                <HiXMark className="h-5 w-5" />
              ) : (
                <HiChevronRight className="h-5 w-5 text-[#0052cc]" />
              )}
            </button>
          </div>

          {/* Menu items list (Fixed list matching screenshot) */}
          <nav className="flex-1 space-y-1 py-1">
            {navItems.map(({ label, to, icon: Icon, showBadge }) => (
              <NavLink
                key={label}
                to={to}
                end
                className={({ isActive }) => {
                  if (!isOpen) {
                    // Collapsed mode: Centered icon button
                    return isActive
                      ? 'flex items-center justify-center w-10 h-10 mx-auto bg-[#0052cc] text-white shadow-md shadow-blue-600/30 rounded-r-2xl rounded-l-xl transition-all duration-200'
                      : 'flex items-center justify-center w-10 h-10 mx-auto text-[#2d3748] hover:bg-amber-100/60 hover:text-black rounded-xl transition-all duration-200';
                  }
                  // Expanded mode
                  return isActive
                    ? 'flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold bg-[#0052cc] text-white shadow-md shadow-blue-600/20 transition-all duration-200'
                    : 'flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-[#2d3748] hover:bg-amber-100/50 hover:text-black transition-all duration-200';
                }}
                title={!isOpen ? label : ''}
              >
                <div className={`flex items-center gap-3.5 ${!isOpen ? 'justify-center' : 'min-w-0'}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="truncate">{label}</span>}
                </div>
                {isOpen && showBadge && unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0052cc] text-[11px] font-extrabold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}

            {/* Logout item */}
            <button
              onClick={handleLogout}
              className={
                !isOpen
                  ? 'flex items-center justify-center w-10 h-10 mx-auto text-[#2d3748] hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors mt-1'
                  : 'flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-bold text-[#2d3748] hover:bg-red-50 hover:text-red-600 transition-colors mt-1'
              }
              title={!isOpen ? 'Logout' : ''}
            >
              <HiArrowRightOnRectangle className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span>Logout</span>}
            </button>
          </nav>
        </div>
      </motion.aside>
    </>
  );
}
