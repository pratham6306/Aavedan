/**
 * MyComplaints.jsx — My Complaints Page
 * ======================================
 * Authenticated user's personal complaint dashboard.
 * Mirrors ComplaintList but:
 *   • Uses useMyComplaints instead of useComplaints
 *   • Adds "Create New" CTA in the header
 *   • Shows edit / delete actions on each card
 *
 * Design tokens: .page-container, .card, .card-hover, .badge-*,
 *   .btn-*, .form-input, .skeleton, .glass-card
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiMagnifyingGlass,
  HiFunnel,
  HiArrowsUpDown,
  HiChevronLeft,
  HiChevronRight,
  HiPlusCircle,
  HiMapPin,
  HiClock,
  HiEye,
  HiPencilSquare,
  HiTrash,
  HiExclamationTriangle,
  HiInboxStack,
} from 'react-icons/hi2';

import { useMyComplaints, useDeleteComplaint } from '../../hooks/useComplaints';
import {
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getPriorityColor,
  truncateText,
  departments,
  complaintStatuses,
} from '../../utils/helpers';

/* ─── animation presets ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ─── constants ─── */
const PRIORITIES   = ['low', 'medium', 'high'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: '-created_at' },
  { label: 'Oldest First', value: 'created_at' },
  { label: 'Priority',     value: '-priority' },
];
const PAGE_SIZE = 9;

/* ====================================================================
   Component
   ==================================================================== */
export default function MyComplaints() {
  const navigate = useNavigate();

  /* ── URL search-params ── */
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch   = searchParams.get('search')     || '';
  const initialStatus   = searchParams.get('status')     || '';
  const initialPriority = searchParams.get('priority')   || '';
  const initialDept     = searchParams.get('department') || '';
  const initialSort     = searchParams.get('ordering')   || '-created_at';
  const initialPage     = parseInt(searchParams.get('page') || '1', 10);

  /* ── local state ── */
  const [search, setSearch]               = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [status, setStatus]               = useState(initialStatus);
  const [priority, setPriority]           = useState(initialPriority);
  const [department, setDepartment]       = useState(initialDept);
  const [ordering, setOrdering]           = useState(initialSort);
  const [page, setPage]                   = useState(initialPage);
  const [showFilters, setShowFilters]     = useState(
    !!(initialStatus || initialPriority || initialDept)
  );

  /* ── delete confirmation dialog state ── */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── debounce search (400ms) ── */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ── sync state → URL ── */
  useEffect(() => {
    const p = {};
    if (debouncedSearch) p.search     = debouncedSearch;
    if (status)          p.status     = status;
    if (priority)        p.priority   = priority;
    if (department)      p.department = department;
    if (ordering && ordering !== '-created_at') p.ordering = ordering;
    if (page > 1)        p.page       = String(page);
    setSearchParams(p, { replace: true });
  }, [debouncedSearch, status, priority, department, ordering, page, setSearchParams]);

  /* ── API query ── */
  const queryParams = useMemo(() => ({
    search:     debouncedSearch || undefined,
    status:     status          || undefined,
    priority:   priority        || undefined,
    department: department      || undefined,
    ordering,
    page,
    page_size:  PAGE_SIZE,
  }), [debouncedSearch, status, priority, department, ordering, page]);

  const { data, isLoading, error } = useMyComplaints(queryParams);
  const { mutateAsync: deleteComplaint, isPending: isDeleting } = useDeleteComplaint();

  const complaints = data?.results ?? [];
  const totalCount = data?.count   ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const activeFilterCount = [status, priority, department].filter(Boolean).length;

  /* ── helpers ── */
  const clearFilters = useCallback(() => {
    setSearch(''); setDebouncedSearch('');
    setStatus(''); setPriority(''); setDepartment('');
    setOrdering('-created_at'); setPage(1);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteComplaint(deleteTarget);
      toast.success('Complaint deleted successfully');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete complaint. Please try again.');
    }
  }, [deleteTarget, deleteComplaint]);

  /* ================================================================
     Render
     ================================================================ */
  return (
    <div className="page-container">
      {/* ── page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title">My Complaints</h1>
            <p className="page-subtitle">
              {isLoading
                ? 'Loading your complaints…'
                : `${totalCount} complaint${totalCount !== 1 ? 's' : ''} submitted`}
            </p>
          </div>

          {/* create new CTA */}
          <Link to="/complaints/create" className="btn btn-primary">
            <HiPlusCircle className="w-5 h-5" />
            Create New
          </Link>
        </div>
      </motion.div>

      {/* ── search + toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* search */}
          <div className="relative flex-1">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your complaints…"
              className="form-input pl-10"
            />
          </div>

          {/* filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap`}
          >
            <HiFunnel className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/25 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* sort */}
          <div className="relative">
            <HiArrowsUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={ordering}
              onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
              className="form-input pl-9 pr-8 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* collapsible filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-input">
                  <option value="">All Statuses</option>
                  {complaintStatuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="form-input">
                  <option value="">All Priorities</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>

                <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} className="form-input">
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-3 text-right">
                  <button onClick={clearFilters} className="btn btn-ghost text-sm">
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── error state ── */}
      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center mb-6">
          <HiExclamationTriangle className="mx-auto w-12 h-12 text-danger mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Something went wrong</h3>
          <p className="text-sm text-gray-500 mb-4">
            {error?.message || 'Unable to load your complaints. Please try again.'}
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Retry</button>
        </motion.div>
      )}

      {/* ── loading ── */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="flex justify-between">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="flex justify-between pt-2">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── empty ── */}
      {!isLoading && !error && complaints.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-12 text-center">
          <HiInboxStack className="mx-auto w-16 h-16 text-gov-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {debouncedSearch || activeFilterCount > 0
              ? 'No matching complaints'
              : 'You haven\'t submitted any complaints yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {debouncedSearch || activeFilterCount > 0
              ? 'Try adjusting your search or filters.'
              : 'File your first complaint and track its progress here.'}
          </p>
          {debouncedSearch || activeFilterCount > 0 ? (
            <button onClick={clearFilters} className="btn btn-secondary">Clear Filters</button>
          ) : (
            <Link to="/complaints/create" className="btn btn-primary">
              <HiPlusCircle className="w-5 h-5" />
              Create Complaint
            </Link>
          )}
        </motion.div>
      )}

      {/* ── cards grid ── */}
      {!isLoading && !error && complaints.length > 0 && (
        <>
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {complaints.map((c) => (
              <MyComplaintCard
                key={c.id}
                complaint={c}
                onDelete={() => setDeleteTarget(c.id)}
              />
            ))}
          </motion.div>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {/* ── delete confirmation modal ── */}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card p-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center mx-auto mb-4">
                  <HiTrash className="w-6 h-6 text-danger" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Complaint?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. The complaint and all associated data will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="btn btn-secondary flex-1"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger flex-1"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
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

/* ====================================================================
   My Complaint Card  (with edit / delete actions)
   ==================================================================== */
function MyComplaintCard({ complaint, onDelete }) {
  const {
    id, complaint_number, title, status, priority,
    department, created_at, location,
  } = complaint;

  const statusBadge   = getStatusColor(status);
  const priorityBadge = getPriorityColor(priority);

  return (
    <motion.div variants={cardVariants} className="card card-hover p-5 flex flex-col">
      {/* top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold text-gov-500">
          #GOV-{String(complaint_number ?? id).padStart(3, '0')}
        </span>
        <span className={`badge ${statusBadge}`}>{status}</span>
      </div>

      {/* title */}
      <h3 className="text-base font-semibold text-gray-800 mb-2 leading-snug">
        {truncateText(title, 60)}
      </h3>

      {/* meta */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`badge ${priorityBadge}`}>{priority}</span>
        {department && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{department}</span>
        )}
      </div>

      {/* location */}
      {(location?.district || location?.state) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <HiMapPin className="w-3.5 h-3.5 text-gov-400 shrink-0" />
          <span>{[location.district, location.state].filter(Boolean).join(', ')}</span>
        </div>
      )}

      {/* date */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <HiClock className="w-3.5 h-3.5 shrink-0" />
        <span>{formatDate(created_at)}</span>
        <span className="text-gray-300">·</span>
        <span>{formatRelativeTime(created_at)}</span>
      </div>

      {/* actions (pushed to bottom) */}
      <div className="mt-auto flex gap-2">
        <Link to={`/complaints/${id}`} className="btn btn-secondary flex-1 text-sm">
          <HiEye className="w-4 h-4" />
          View
        </Link>
        <Link to={`/complaints/${id}/edit`} className="btn btn-ghost p-2" aria-label="Edit complaint">
          <HiPencilSquare className="w-4 h-4 text-gov-600" />
        </Link>
        <button onClick={onDelete} className="btn btn-ghost p-2" aria-label="Delete complaint">
          <HiTrash className="w-4 h-4 text-danger" />
        </button>
      </div>
    </motion.div>
  );
}

/* ====================================================================
   Pagination (shared)
   ==================================================================== */
function Pagination({ page, totalPages, onPageChange }) {
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const result = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) range.push(i);
    }
    for (const i of range) {
      if (l) {
        if (i - l === 2) result.push(l + 1);
        else if (i - l !== 1) result.push('…');
      }
      result.push(i);
      l = i;
    }
    return result;
  }, [page, totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-center gap-2 mt-8"
    >
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="btn btn-ghost p-2" aria-label="Previous page">
        <HiChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`dot-${idx}`} className="px-1 text-gray-400 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
              p === page ? 'bg-gov-600 text-white shadow-md' : 'text-gray-600 hover:bg-gov-50'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="btn btn-ghost p-2" aria-label="Next page">
        <HiChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
