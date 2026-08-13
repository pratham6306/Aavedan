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
  HiMapPin,
  HiInboxStack,
} from 'react-icons/hi2';

import { useMyComplaints, useDeleteComplaint } from '../../hooks/useComplaints';
import * as locationService from '../../services/locationService';
import * as complaintService from '../../services/complaintService';
import { complaintStatuses, formatDate, formatRelativeTime } from '../../utils/helpers';


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

  const initialSearch   = searchParams.get('search')     || '';
  const initialStatus   = searchParams.get('status')     || '';
  const initialPriority = searchParams.get('priority')   || '';
  const initialDept     = searchParams.get('department') || '';
  const initialCategory = searchParams.get('category')   || '';
  const initialState    = searchParams.get('state')      || '';
  const initialDistrict = searchParams.get('district')   || '';
  const initialSort     = searchParams.get('ordering')   || '-created_at';

  const [search, setSearch]             = useState(initialSearch);
  const [debouncedSearch, setDebounced] = useState(initialSearch);
  const [status, setStatus]             = useState(initialStatus);
  const [priority, setPriority]         = useState(initialPriority);
  const [department, setDepartment]     = useState(initialDept);
  const [category, setCategory]         = useState(initialCategory);
  const [stateName, setStateName]       = useState(initialState);
  const [districtName, setDistrictName] = useState(initialDistrict);
  const [ordering, setOrdering]         = useState(initialSort);
  
  const [showFilters, setShowFilters]   = useState(
    !!(initialStatus || initialPriority || initialDept || initialCategory || initialState || initialDistrict)
  );
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── dynamic metadata states ── */
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  /* Load States, Categories, Departments */
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [statesData, cats, depts] = await Promise.all([
          locationService.getStates(),
          complaintService.getCategories(),
          complaintService.getDepartments(),
        ]);
        setDbStates(statesData);
        setDbCategories(cats);
        setDbDepartments(depts);
      } catch (err) {
        console.error('Failed to load list metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  /* Load Districts based on State Selection */
  useEffect(() => {
    if (!stateName) {
      setDbDistricts([]);
      return;
    }
    const matchedState = dbStates.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    if (!matchedState) return;

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const districtsData = await locationService.getDistricts(matchedState.id);
        setDbDistricts(districtsData);
      } catch (err) {
        console.error('Failed to fetch districts for filter:', err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [stateName, dbStates]);

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
    if (priority) p.priority = priority;
    if (department) p.department = department;
    if (category) p.category = category;
    if (stateName) p.state = stateName;
    if (districtName) p.district = districtName;
    if (ordering && ordering !== '-created_at') p.ordering = ordering;
    setSearchParams(p, { replace: true });
  }, [debouncedSearch, status, priority, department, category, stateName, districtName, ordering, setSearchParams]);

  /* Query Complaints */
  const queryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    department: department || undefined,
    category: category || undefined,
    state: stateName || undefined,
    district: districtName || undefined,
    ordering,
  }), [debouncedSearch, status, priority, department, category, stateName, districtName, ordering]);

  const { data, isLoading, error } = useMyComplaints(queryParams);
  const { mutateAsync: deleteComplaint, isPending: isDeleting } = useDeleteComplaint();

  const complaints = data?.results ?? (Array.isArray(data) ? data : []);
  const totalCount = data?.count ?? complaints.length;

  const activeFilterCount = [status, priority, department, category, stateName, districtName].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setSearch('');
    setDebounced('');
    setStatus('');
    setPriority('');
    setDepartment('');
    setCategory('');
    setStateName('');
    setDistrictName('');
    setOrdering('-created_at');
  }, []);

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
        className="rounded-2xl bg-white/95 backdrop-blur-md p-4 border-2 border-amber-300/80 shadow-md mb-6 flex flex-col gap-3"
      >
        {/* top row: search, filter toggle, sort */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full">
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
            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-extrabold flex items-center gap-2 transition-all shadow-2xs whitespace-nowrap ${
              showFilters
                ? 'bg-[#0052cc] text-white border-[#0052cc]'
                : 'bg-blue-50 text-[#0052cc] border-blue-200 hover:bg-[#0052cc] hover:text-white'
            }`}
          >
            <HiFunnel className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-extrabold text-xs">
                {activeFilterCount}
              </span>
            )}
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
        </div>

        {/* filter row (collapsible) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden w-full"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                {/* status filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0052cc]"
                  >
                    <option value="">All Statuses</option>
                    {complaintStatuses.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* priority filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0052cc]"
                  >
                    <option value="">All Priorities</option>
                    {['low', 'medium', 'high'].map((p) => (
                      <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* category filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0052cc]"
                  >
                    <option value="">All Categories</option>
                    {dbCategories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* department filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0052cc]"
                  >
                    <option value="">All Departments</option>
                    {dbDepartments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* state filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State</label>
                  <select
                    value={stateName}
                    onChange={(e) => { setStateName(e.target.value); setDistrictName(''); }}
                    className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0052cc]"
                  >
                    <option value="">All States</option>
                    {dbStates.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* district filter */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">District</label>
                  <select
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    disabled={!stateName || loadingDistricts}
                    className="w-full px-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-[#0052cc]"
                  >
                    <option value="">
                      {!stateName ? 'Select state first' : loadingDistricts ? 'Loading districts…' : 'All Districts'}
                    </option>
                    {dbDistricts.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* clear button */}
              {activeFilterCount > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-50 text-right">
                  <button onClick={clearFilters} className="text-[#ea580c] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
        {complaints.map((c) => {
          const refNumber = c.reference_number || (c.complaint_number ? `#GOV-${String(c.complaint_number).padStart(3, '0')}` : `#GC-${String(c.id).padStart(4, '0')}`);
          const statusStr = (typeof c.status === 'object' ? c.status?.name : c.status) || 'PENDING';
          const priorityStr = (typeof c.priority === 'object' ? c.priority?.name : c.priority) || 'MEDIUM';
          const categoryStr = (typeof c.category === 'object' ? c.category?.name : c.category) || '';
          const departmentStr = (typeof c.department === 'object' ? c.department?.name : c.department) || '';
          const districtStr = (typeof c.district === 'object' ? c.district?.name : c.district) || '';
          const stateStr = (typeof c.state === 'object' ? c.state?.name : c.state) || '';
          const locationStr = [districtStr, stateStr].filter(Boolean).join(', ');

          return (
            <motion.div
              key={c.id}
              variants={cardVariants}
              className="rounded-2xl bg-white/95 backdrop-blur-md p-6 border-2 border-amber-200/80 shadow-md hover:shadow-lg hover:border-amber-400 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Top row: ID Badge & Status Pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#0052cc] border border-blue-200 shadow-2xs">
                  {refNumber}
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                  {statusStr}
                </span>
              </div>

              {/* Middle row: Title, Priority, Department & Category */}
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                  {c.title}
                </h3>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 inline-block">
                    {priorityStr}
                  </span>
                  {categoryStr && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                      {categoryStr}
                    </span>
                  )}
                  {departmentStr && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                      {departmentStr}
                    </span>
                  )}
                </div>

                {/* location */}
                {locationStr && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-2.5">
                    <HiMapPin className="h-4 w-4 shrink-0 text-[#ea580c]" />
                    <span>{locationStr}</span>
                  </div>
                )}

                {/* Date timestamp with Amber Clock */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-2">
                  <HiClock className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{c.created_at ? `${formatDate(c.created_at)} · ${formatRelativeTime(c.created_at)}` : 'Recently'}</span>
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
          );
        })}
      </motion.div>

      {/* ── empty state ── */}
      {complaints.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center bg-white border-2 border-amber-200/50 rounded-2xl shadow-md mt-4"
        >
          <HiInboxStack className="mx-auto w-16 h-16 text-slate-350 mb-4" />
          <h3 className="text-xl font-black text-slate-800 mb-2">
            No complaints found
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto font-semibold leading-relaxed">
            {debouncedSearch || activeFilterCount > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'You have not submitted any complaints yet. Your submitted grievances will appear here.'}
          </p>
          {(debouncedSearch || activeFilterCount > 0) && (
            <button onClick={clearFilters} className="text-[#ea580c] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-4 py-2 rounded-xl text-xs font-bold transition">
              Clear Filters
            </button>
          )}
        </motion.div>
      )}

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
