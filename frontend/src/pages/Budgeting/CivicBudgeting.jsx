import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiOutlineBanknotes,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineTag,
  HiOutlineXMark,
  HiOutlineChevronRight,
  HiOutlineChartPie,
} from 'react-icons/hi2';

import api from '../../services/api';

export default function CivicBudgeting() {
  /* ── Filter state ── */
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  /* ── Options for dropdowns ── */
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  /* ── Data state ── */
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Fetch filter options ── */
  useEffect(() => {
    api.get('/locations/states/').then((res) => setStatesList(res.data.results || res.data || [])).catch(() => {});
    api.get('/complaints/departments/').then((res) => setDepartmentsList(res.data.results || res.data || [])).catch(() => {});
    api.get('/complaints/categories/').then((res) => setCategoriesList(res.data.results || res.data || [])).catch(() => {});
  }, []);

  /* ── Fetch districts when state changes ── */
  useEffect(() => {
    if (selectedState) {
      api.get(`/locations/districts/?state=${selectedState}`)
        .then((res) => setDistrictsList(res.data.results || res.data || []))
        .catch(() => setDistrictsList([]));
    } else {
      setDistrictsList([]);
    }
  }, [selectedState]);

  /* ── Fetch budget analytics & projects ── */
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedDistrict) params.append('district_id', selectedDistrict);
    if (selectedState) params.append('state_id', selectedState);

    Promise.all([
      api.get(`/complaints/budget-analytics/?${params.toString()}`),
      api.get(`/complaints/projects/?${params.toString()}`),
    ])
      .then(([budgetRes, projectsRes]) => {
        setBudgetInfo(budgetRes.data);
        setProjects(projectsRes.data.results || projectsRes.data || []);
      })
      .catch((err) => console.error('Failed to load civic budgeting data:', err))
      .finally(() => setIsLoading(false));
  }, [selectedState, selectedDistrict]);

  /* ── Local filtering by search, category & department ── */
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const matchSearch =
        !search ||
        proj.title.toLowerCase().includes(search.toLowerCase()) ||
        (proj.ward_name && proj.ward_name.toLowerCase().includes(search.toLowerCase())) ||
        (proj.district && proj.district.toLowerCase().includes(search.toLowerCase()));

      const matchDept = !selectedDepartment || String(proj.department) === String(selectedDepartment);
      const matchCat = !selectedCategory || String(proj.category) === String(selectedCategory);

      return matchSearch && matchDept && matchCat;
    });
  }, [projects, search, selectedDepartment, selectedCategory]);

  /* ── Vote handler ── */
  const handleVote = async (projectId) => {
    try {
      const res = await api.post(`/complaints/projects/${projectId}/vote/`);
      if (res.status === 200) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  votes_count: res.data.votes_count,
                  voted_by_user: res.data.voted,
                }
              : p
          )
        );
        toast.success(res.data.voted ? 'Voted for Ward Project funding!' : 'Removed vote from Ward Project.');
      }
    } catch {
      toast.error('Failed to register vote.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedDepartment('');
    setSelectedCategory('');
  };

  const activeFiltersCount = [selectedState, selectedDistrict, selectedDepartment, selectedCategory, search].filter(Boolean).length;

  return (
    <div className="page-container space-y-6">
      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title text-2xl font-black text-slate-900">Participatory Budgeting & Ward Projects</h1>
          </div>
          <p className="page-subtitle text-xs text-slate-500 mt-1">
            Transforming aggregated ward complaints into funded municipal micro-projects with citizen budget voting
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
          <HiOutlineBanknotes className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">District Repair Pool</p>
            <p className="text-lg font-black text-emerald-700 font-mono">
              ₹{(budgetInfo?.total_allocated_budget || 50000000).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Budget Analytics Cards ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#eef6ff] p-4 rounded-2xl border border-[#bcdcff]">
          <span className="text-[10px] text-[#0052cc] font-bold uppercase block mb-1">Total Spent Budget</span>
          <span className="text-lg font-black text-[#0052cc] font-mono">
            ₹{(budgetInfo?.total_spent_budget || 14500000).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-[#ecfdf5] p-4 rounded-2xl border border-[#a7f3d0]">
          <span className="text-[10px] text-[#047857] font-bold uppercase block mb-1">Unallocated Remaining</span>
          <span className="text-lg font-black text-[#047857] font-mono">
            ₹{(budgetInfo?.remaining_budget || 35500000).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-[#fffbeb] p-4 rounded-2xl border border-[#fde68a]">
          <span className="text-[10px] text-[#854d0e] font-bold uppercase block mb-1">Est. Backlog Repair Cost</span>
          <span className="text-lg font-black text-[#854d0e] font-mono">
            ₹{(budgetInfo?.total_backlog_cost || 650000).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-[#f0f3ff] p-4 rounded-2xl border border-[#c7d2fe]">
          <span className="text-[10px] text-[#4338ca] font-bold uppercase block mb-1">Verified Resolutions</span>
          <span className="text-lg font-black text-[#4338ca] font-mono">
            {budgetInfo?.verified_complaints || 0} / {budgetInfo?.resolved_complaints || 0} Tickets
          </span>
        </div>
      </motion.div>

      {/* ── Search & Filter Bar ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineFunnel className="w-5 h-5 text-gov-600" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Filter Civic Projects
            </h2>
            {activeFiltersCount > 0 && (
              <span className="badge bg-gov-100 text-gov-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1">
              <HiOutlineXMark className="w-4 h-4" /> Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ward/project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500"
            />
          </div>

          {/* State */}
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500"
          >
            <option value="">All States</option>
            {statesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* District */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedState && districtsList.length === 0}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500 disabled:opacity-50"
          >
            <option value="">All Districts</option>
            {districtsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Department */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500"
          >
            <option value="">All Departments</option>
            {departmentsList.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500"
          >
            <option value="">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* ── Projects Grid ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Auto-Clustered Ward Projects ({filteredProjects.length})
          </h2>
          <p className="text-xs text-slate-500">Vote for your ward to allocate municipal funds</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6 space-y-4">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-6 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="card card-hover p-6 flex flex-col justify-between space-y-4 border-2 border-slate-200/80">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200">
                      {proj.ward_name || 'Ward Central'} • {proj.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      Est. Repair Cost: ₹{Number(proj.estimated_cost).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{proj.title}</h3>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <HiOutlineMapPin className="w-4 h-4 text-gov-600" />
                      {proj.district}, {proj.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineBuildingOffice2 className="w-4 h-4 text-gov-600" />
                      {proj.department}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    🔗 Aggregated from <strong>{proj.complaints_count || 1}</strong> individual citizen grievances in {proj.district}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-700 font-mono font-bold">
                    🗳️ <strong>{proj.votes_count || 0}</strong> Ward Citizen Votes
                  </span>

                  <button
                    onClick={() => handleVote(proj.id)}
                    className={`btn text-xs py-1.5 px-3.5 rounded-xl font-bold transition shadow-2xs ${
                      proj.voted_by_user
                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                        : 'bg-gov-600 text-white hover:bg-gov-700'
                    }`}
                  >
                    {proj.voted_by_user ? '✓ Voted for Funding' : '🗳️ Vote to Fund'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-slate-500">
            <HiOutlineBanknotes className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-slate-700">No Ward Projects Found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your state, district, or category search filters above.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
