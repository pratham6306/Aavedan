/**
 * ComplaintList.jsx — All Complaints Page
 * ========================================
 * Public-facing complaint listing with search, multi-filter toolbar,
 * sort options, responsive card grid, and paginated navigation.
 *
 * Design tokens used:
 *   .page-container, .page-title, .page-subtitle, .card, .card-hover,
 *   .glass-card, .badge, .badge-*, .btn, .btn-primary, .btn-ghost,
 *   .form-input, .skeleton
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiMagnifyingGlass,
  HiFunnel,
  HiArrowsUpDown,
  HiChevronLeft,
  HiChevronRight,
  HiMapPin,
  HiClock,
  HiEye,
  HiExclamationTriangle,
  HiInboxStack,
} from 'react-icons/hi2';

import { useComplaints } from '../../hooks/useComplaints';
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
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ─── priority list (static) ─── */
const PRIORITIES = ['low', 'medium', 'high'];

/* ─── sort presets ─── */
const SORT_OPTIONS = [
  { label: 'Newest First', value: '-created_at' },
  { label: 'Oldest First', value: 'created_at' },
  { label: 'Priority', value: '-priority' },
];

/* ─── page size ─── */
const PAGE_SIZE = 9;

/* ====================================================================
   Component
   ==================================================================== */
export default function ComplaintList() {
  /* ── URL search-params (persist filters across navigation) ── */
  const [searchParams, setSearchParams] = useSearchParams();

  /* read initial values from URL */
  const initialSearch   = searchParams.get('search')     || '';
  const initialStatus   = searchParams.get('status')     || '';
  const initialPriority = searchParams.get('priority')   || '';
  const initialDept     = searchParams.get('department') || '';
  const initialSort     = searchParams.get('ordering')   || '-created_at';
  const initialPage     = parseInt(searchParams.get('page') || '1', 10);

  /* ── local state ── */
  const [search, setSearch]       = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [status, setStatus]       = useState(initialStatus);
  const [priority, setPriority]   = useState(initialPriority);
  const [department, setDepartment] = useState(initialDept);
  const [ordering, setOrdering]   = useState(initialSort);
  const [page, setPage]           = useState(initialPage);
  const [showFilters, setShowFilters] = useState(
    !!(initialStatus || initialPriority || initialDept)
  );

  /* ── debounce search input (400ms) ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  /* ── sync state → URL ── */
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search     = debouncedSearch;
    if (status)          params.status     = status;
    if (priority)        params.priority   = priority;
    if (department)      params.department = department;
    if (ordering && ordering !== '-created_at') params.ordering = ordering;
    if (page > 1)        params.page       = String(page);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, status, priority, department, ordering, page, setSearchParams]);

  /* ── build query params for API ── */
  const queryParams = useMemo(
    () => ({
      search:     debouncedSearch || undefined,
      status:     status          || undefined,
      priority:   priority        || undefined,
      department: department      || undefined,
      ordering:   ordering,
      page,
      page_size:  PAGE_SIZE,
    }),
    [debouncedSearch, status, priority, department, ordering, page]
  );

  /* ── fetch complaints ── */
  const { data, isLoading, error } = useComplaints(queryParams);

  const complaints = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /* ── active filter count (for badge) ── */
  const activeFilterCount = [status, priority, department].filter(Boolean).length;

  /* ── clear all filters ── */
  const clearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setPriority('');
    setDepartment('');
    setOrdering('-created_at');
    setPage(1);
  }, []);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="page-title">All Complaints</h1>
            <p className="page-subtitle">
              {isLoading
                ? 'Loading complaints…'
                : `${totalCount} complaint${totalCount !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── search + toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="glass-card p-4 mb-6"
      >
        {/* search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* search input */}
          <div className="relative flex-1">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description…"
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

          {/* sort dropdown */}
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

        {/* filter row (collapsible) */}
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
                {/* status filter */}
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="form-input"
                >
                  <option value="">All Statuses</option>
                  {complaintStatuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                {/* priority filter */}
                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                  className="form-input"
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>

                {/* department filter */}
                <select
                  value={department}
                  onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                  className="form-input"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* clear button */}
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center mb-6"
        >
          <HiExclamationTriangle className="mx-auto w-12 h-12 text-danger mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error?.message || 'Unable to load complaints. Please try again.'}
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Retry
          </button>
        </motion.div>
      )}

      {/* ── loading skeleton grid ── */}
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

      {/* ── empty state ── */}
      {!isLoading && !error && complaints.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <HiInboxStack className="mx-auto w-16 h-16 text-gov-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No complaints found
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {debouncedSearch || activeFilterCount > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'There are no complaints submitted yet.'}
          </p>
          {(debouncedSearch || activeFilterCount > 0) && (
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          )}
        </motion.div>
      )}

      {/* ── complaint cards grid ── */}
      {!isLoading && !error && complaints.length > 0 && (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </motion.div>

          {/* ── pagination ── */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ====================================================================
   Complaint Card Sub-component
   ==================================================================== */
function ComplaintCard({ complaint }) {
  const {
    id,
    complaint_number,
    title,
    status,
    priority,
    department,
    created_at,
    location,
  } = complaint;

  /* derive badge class from helpers */
  const statusBadge   = getStatusColor(status);
  const priorityBadge = getPriorityColor(priority);

  return (
    <motion.div variants={cardVariants} className="card card-hover p-5 flex flex-col">
      {/* top row: complaint number + status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold text-gov-500">
          #GOV-{String(complaint_number ?? id).padStart(3, '0')}
        </span>
        <span className={`badge ${statusBadge}`}>
          {status}
        </span>
      </div>

      {/* title */}
      <h3 className="text-base font-semibold text-gray-800 mb-2 leading-snug">
        {truncateText(title, 60)}
      </h3>

      {/* meta row */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`badge ${priorityBadge}`}>{priority}</span>
        {department && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {department}
          </span>
        )}
      </div>

      {/* location */}
      {(location?.district || location?.state) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
          <HiMapPin className="w-3.5 h-3.5 text-gov-400 shrink-0" />
          <span>
            {[location.district, location.state].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      {/* date */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <HiClock className="w-3.5 h-3.5 shrink-0" />
        <span>{formatDate(created_at)}</span>
        <span className="text-gray-300">·</span>
        <span>{formatRelativeTime(created_at)}</span>
      </div>

      {/* spacer pushes button to bottom */}
      <div className="mt-auto">
        <Link to={`/complaints/${id}`} className="btn btn-secondary w-full text-sm">
          <HiEye className="w-4 h-4" />
          View Details
        </Link>
      </div>
    </motion.div>
  );
}

/* ====================================================================
   Pagination Sub-component
   ==================================================================== */
function Pagination({ page, totalPages, onPageChange }) {
  /* Build array of page numbers to display (max 5 visible) */
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('…');
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [page, totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center justify-center gap-2 mt-8"
    >
      {/* previous */}
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="btn btn-ghost p-2"
        aria-label="Previous page"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>

      {/* page numbers */}
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`dot-${idx}`} className="px-1 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
              p === page
                ? 'bg-gov-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gov-50'
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* next */}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="btn btn-ghost p-2"
        aria-label="Next page"
      >
        <HiChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
