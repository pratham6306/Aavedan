/**
 * Navbar.jsx
 * -----------
 * Sticky top navigation bar for the government complaint platform.
 *
 * Layout:
 *   Left   → Logo (shield + "GovConnect" gradient)
 *   Center → Dashboard / Complaints / Schemes (auth-only)
 *   Right  → NotificationBell, Profile dropdown  OR  Login / Register
 *   Mobile → Hamburger + animated slide-out drawer
 *
 * Dependencies:
 *   react-router-dom, framer-motion, react-icons/hi2, AuthContext, NotificationBell
 */
import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiShieldCheck,
  HiBars3,
  HiXMark,
  HiChevronDown,
  HiUserCircle,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import logo from '../../assets/logo.png';

/* ── Desktop nav links (shown only when authenticated) ───── */
const navLinks = [
  { label: 'Dashboard',  to: '/dashboard' },
  { label: 'Complaints', to: '/complaints' },
  { label: 'Schemes',    to: '/schemes' },
];

/* NavLink active / inactive style builder (Desktop dark header) */
function navLinkClass({ isActive }) {
  const base =
    'px-6 py-1.5 text-sm font-extrabold rounded-full transition-all duration-200';
  return isActive
    ? `${base} text-[#fef08a] bg-[#4f3313] border border-amber-600/50 shadow-inner`
    : `${base} text-amber-100/80 hover:text-white hover:bg-white/5`;
}

/* NavLink active / inactive style builder (Mobile light drawer) */
function mobileNavLinkClass({ isActive }) {
  const base =
    'relative block px-3 py-2.5 text-base font-semibold rounded-lg transition-colors';
  return isActive
    ? `${base} text-amber-700 bg-amber-50`
    : `${base} text-gray-700 hover:text-amber-700 hover:bg-amber-50`;
}

/* ── Helper – user initials from name string ─────────────── */
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ================================================================== */
export default function Navbar({ onMenuToggle }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Logout handler */
  function handleLogout() {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
    navigate('/login');
  }

  /* ────────────────────────────────────────────────────────── */
  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-amber-900/40 bg-[#160d07] bg-gradient-to-r from-[#1c1109] via-[#150d07] to-[#1c1109] backdrop-blur-md shadow-md select-none">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* ── Left: Logo ─────────────────────────────────── */}
          <div className="flex items-center gap-2 py-1">
            {isAuthenticated && onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="hidden lg:flex items-center justify-center p-2 rounded-xl text-amber-200/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Toggle Menu"
              >
                <HiBars3 className="h-5 w-5" />
              </button>
            )}
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 object-contain bg-white p-1 rounded-xl shadow border border-amber-300/30" />
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white leading-tight tracking-tight">
                  Aavedan Setu
                </span>
                <span className="text-[11px] font-semibold text-[#f59e0b] leading-none tracking-wide">
                  India's Citizen Services Portal
                </span>
              </div>
            </Link>
          </div>

          {/* ── Center: Desktop nav links ──────────────────── */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-3">
              {navLinks.map(({ label, to }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* ── Right section ──────────────────────────────── */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notification bell */}
                <NotificationBell />

                {/* Profile dropdown (desktop) */}
                <div className="relative hidden md:block" ref={profileRef}>
                  {(() => {
                    const displayName = user?.full_name || user?.first_name || user?.name || user?.username || user?.email || 'User';
                    return (
                      <>
                        <button
                          onClick={() => setProfileOpen((p) => !p)}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                        >
                          {/* Avatar circle with initials */}
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white shadow-xs">
                            {getInitials(displayName)}
                          </span>
                          <HiChevronDown
                            className={`h-4 w-4 text-amber-200/50 transition-transform ${
                              profileOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Dropdown menu */}
                        <AnimatePresence>
                          {profileOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 6, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-xl z-50"
                            >
                              {/* User info header */}
                              <div className="border-b border-gray-100 px-4 py-3">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {displayName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {user?.email || 'user@aavedansetu.gov.in'}
                                </p>
                              </div>

                              <Link
                                to="/profile"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gov-50 hover:text-gov-700 transition-colors"
                              >
                                <HiUserCircle className="h-4 w-4" />
                                Profile
                              </Link>

                              <div className="border-t border-gray-100 mt-1" />

                              <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger-light transition-colors"
                              >
                                <HiArrowRightOnRectangle className="h-4 w-4" />
                                Logout
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              /* Guest buttons */
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-md hover:scale-[1.02] transition-all">
                  Login
                </Link>
                <Link to="/register" className="btn bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-md hover:scale-[1.02] transition-all">
                  Register
                </Link>
              </div>
            )}

            {/* ── Mobile hamburger ──────────────────────────── */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="rounded-lg p-2 text-amber-200/60 hover:bg-white/5 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <HiXMark className="h-6 w-6" />
              ) : (
                <HiBars3 className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer overlay ───────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="nav-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                <span className="text-lg font-bold text-amber-950">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {isAuthenticated &&
                  navLinks.map(({ label, to }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={mobileNavLinkClass}
                    >
                      {label}
                    </NavLink>
                  ))}

                {isAuthenticated && (
                  <>
                    <NavLink
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className={mobileNavLinkClass}
                    >
                      Profile
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={() => setMobileOpen(false)}
                      className={mobileNavLinkClass}
                    >
                      Settings
                    </NavLink>
                  </>
                )}
              </nav>

              {/* Drawer footer */}
              <div className="border-t border-gray-100 px-4 py-4">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="btn btn-danger w-full"
                  >
                    <HiArrowRightOnRectangle className="h-4 w-4" />
                    Logout
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn btn-secondary w-full justify-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn btn-primary w-full justify-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
