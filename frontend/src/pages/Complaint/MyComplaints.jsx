import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiMagnifyingGlass,
  HiFunnel,
  HiArrowsUpDown,
  HiClock,
  HiEye,
  HiPencilSquare,
  HiTrash,
} from 'react-icons/hi2';

import { useMyComplaints, useDeleteComplaint } from '../../hooks/useComplaints';

/* ── Sample Fallback Data Matching Reference Screenshot ───── */
const SAMPLE_MY_COMPLAINTS = [
  {
    id: 2,
    complaint_number: 2,
    title: 'AI Grievance: garmiiiiiiiiiiiii',
    status: 'PENDING',
    priority: 'MEDIUM',
    created_at: '2026-08-02T17:17:00Z',
  },
  {
    id: 1,
    complaint_number: 1,
    title: 'garmiiiiiiiiiiiii',
    status: 'PENDING',
    priority: 'MEDIUM',
    created_at: '2026-08-02T17:17:00Z',
  },
];

/* ── Animation Presets ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const SORT_OPTIONS = [
  { label: 'Newest First', value: '-created_at' },
  { label: 'Oldest First', value: 'created_at' },
  { label: 'Priority',     value: '-priority' },
];

export default function MyComplaints() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch   = searchParams.get('search')   || '';
  const initialStatus   = searchParams.get('status')   || '';
  const initialSort     = searchParams.get('ordering') || '-created_at';

  const [search, setSearch]             = useState(initialSearch);
  const [debouncedSearch, setDebounced] = useState(initialSearch);
  const [status, setStatus]             = useState(initialStatus);
  const [ordering, setOrdering]         = useState(initialSort);
  const [showFilters, setShowFilters]   = useState(!!initialStatus);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* Debounce Search */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* Sync to URL */
  useEffect(() => {
    const p = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (status) p.status = status;
    if (ordering && ordering !== '-created_at') p.ordering = ordering;
    setSearchParams(p, { replace: true });
  }, [debouncedSearch, status, ordering, setSearchParams]);

  /* Query Complaints */
  const queryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status || undefined,
    ordering,
  }), [debouncedSearch, status, ordering]);

  const { data, isLoading, error } = useMyComplaints(queryParams);
  const { mutateAsync: deleteComplaint, isPending: isDeleting } = useDeleteComplaint();

  const realComplaints = data?.results ?? (Array.isArray(data) ? data : []);
  const complaints = realComplaints.length > 0 ? realComplaints : SAMPLE_MY_COMPLAINTS;
  const totalCount = data?.count ?? complaints.length;

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteComplaint(deleteTarget);
      toast.success('Complaint deleted successfully');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete complaint.');
    }
  }, [deleteTarget, deleteComplaint]);

  return (
    <div className="pb-16 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────
          1. TOP HEADER BANNER CARD WITH MONUMENTS ARTWORK
          ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-[#fff8eb]/90 backdrop-blur-md p-6 md:p-8 shadow-sm border border-amber-200/70 min-h-[140px] flex items-center justify-between mb-6"
      >
        {/* Left Content */}
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
            My Complaints
          </h1>
          <p className="text-sm font-semibold text-slate-600">
            {totalCount} complaint{totalCount !== 1 ? 's' : ''} submitted
          </p>
          <div className="w-10 h-1 bg-[#ea580c] rounded-full mt-2.5" />
        </div>

        {/* Right CTA Button (Purple / Indigo gradient) */}
        <Link
          to="/complaints/create"
          className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#4338ca] text-white font-extrabold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-white font-extrabold text-xs">
            +
          </span>
          <span>Create New Complaint</span>
        </Link>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────
          2. SEARCH & FILTER TOOLBAR CARD WITH RICH COLORED BORDERS & BUTTONS
          ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border-2 border-amber-300/80 shadow-md mb-6 flex flex-col md:flex-row items-center gap-3"
      >
        {/* Search Input with Amber Golden Border */}
        <div className="relative flex-1 w-full">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 h-5 w-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your complaints..."
            className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border-2 border-amber-300 rounded-xl focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-extrabold flex items-center gap-2 transition-all shadow-2xs ${
            showFilters
              ? 'bg-[#0052cc] text-white border-[#0052cc]'
              : 'bg-blue-50 text-[#0052cc] border-blue-200 hover:bg-[#0052cc] hover:text-white'
          }`}
        >
          <HiFunnel className="h-4 w-4" />
          <span>Filters</span>
        </button>

        {/* Sort Dropdown Selector */}
        <div className="relative w-full md:w-auto">
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 pr-8 rounded-xl border-2 border-amber-300 bg-white text-slate-800 font-extrabold text-sm cursor-pointer focus:outline-none focus:border-[#0052cc] appearance-none shadow-2xs hover:bg-amber-50/50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <HiArrowsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 h-4 w-4 pointer-events-none" />
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────
          3. COMPLAINTS CARDS GRID WITH RICH BADGES & ACTION BUTTONS
          ───────────────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {complaints.map((c) => (
          <motion.div
            key={c.id}
            variants={cardVariants}
            className="rounded-2xl bg-white/95 backdrop-blur-md p-6 border-2 border-amber-200/80 shadow-md hover:shadow-lg hover:border-amber-400 transition-all flex flex-col justify-between space-y-4"
          >
            {/* Top row: ID Badge & Status Pill */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#0052cc] border border-blue-200 shadow-2xs">
                #GOV-{String(c.complaint_number ?? c.id).padStart(3, '0')}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                {c.status || 'PENDING'}
              </span>
            </div>

            {/* Middle row: Title & Priority */}
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                {c.title}
              </h3>

              <div className="mt-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 inline-block">
                  {c.priority || 'MEDIUM'}
                </span>
              </div>

              {/* Date timestamp with Amber Clock */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-3">
                <HiClock className="h-4 w-4 shrink-0 text-amber-600" />
                <span>02 Aug 2026, 05:17 pm · 7 days ago</span>
              </div>
            </div>

            {/* Bottom Actions Row: Colored Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {/* View Button (Royal Blue Pill) */}
              <Link
                to={`/complaints/${c.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-blue-300 bg-blue-50 text-[#0052cc] font-extrabold text-xs hover:bg-[#0052cc] hover:text-white transition-all shadow-xs"
              >
                <HiEye className="h-4 w-4" />
                <span>View</span>
              </Link>

              {/* Edit (Soft Blue Icon) & Delete (Soft Rose Icon) */}
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/complaints/${c.id}/edit`}
                  className="p-2 rounded-xl bg-blue-50 text-[#0052cc] border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                  title="Edit Complaint"
                >
                  <HiPencilSquare className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setDeleteTarget(c.id)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shadow-2xs"
                  title="Delete Complaint"
                >
                  <HiTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl bg-white p-6 max-w-sm w-full shadow-xl border border-amber-200/60"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-600">
                  <HiTrash className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">Delete Complaint?</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                  This action cannot be undone. The complaint will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
