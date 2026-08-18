import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
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
  HiOutlineEye,
  HiOutlinePhoto,
  HiOutlineCloudArrowUp,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineHandThumbUp,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineArrowPath,
  HiCheck,
  HiXMark,
} from 'react-icons/hi2';

import api from '../../services/api';
import { getStatusColor, resolveImageUrl } from '../../utils/helpers';

export default function CivicBudgeting() {
  /* ── Filter state ── */
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  /* ── Options for dropdowns ── */
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  /* ── Data state ── */
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Modal / Group Complaint Detail State ── */
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  /* ── Group Officer Resolution State ── */
  const [showOfficerPanel, setShowOfficerPanel] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofRemarks, setProofRemarks] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  /* ── Fetch filter options ── */
  useEffect(() => {
    api.get('/locations/states/').then((res) => setStatesList(res.data.results || res.data || [])).catch(() => {});
    api.get('/complaints/departments/').then((res) => setDepartmentsList(res.data.results || res.data || [])).catch(() => {});
    api.get('/complaints/categories/').then((res) => setCategoriesList(res.data.results || res.data || [])).catch(() => {});
  }, []);

  /* ── Fetch districts when state changes ── */
  useEffect(() => {
    setSelectedDistrict('');
    if (selectedState) {
      api.get(`/locations/districts/?state_id=${selectedState}`)
        .then((res) => setDistrictsList(res.data.results || res.data || []))
        .catch(() => setDistrictsList([]));
    } else {
      setDistrictsList([]);
    }
  }, [selectedState]);

  /* ── Fetch budget analytics & projects ── */
  const fetchProjects = () => {
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
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedState, selectedDistrict]);

  /* ── Local filtering ── */
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const matchSearch =
        !search ||
        proj.title.toLowerCase().includes(search.toLowerCase()) ||
        (proj.ward_name && proj.ward_name.toLowerCase().includes(search.toLowerCase())) ||
        (proj.district && proj.district.toLowerCase().includes(search.toLowerCase()));

      const matchDept = !selectedDepartment || String(proj.department) === String(selectedDepartment);
      const matchCat = !selectedCategory || String(proj.category) === String(selectedCategory);
      const matchStatus = !selectedStatus || proj.status === selectedStatus;

      return matchSearch && matchDept && matchCat && matchStatus;
    });
  }, [projects, search, selectedDepartment, selectedCategory, selectedStatus]);

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
        toast.success(res.data.voted ? 'Voted for Ward Project funding.' : 'Removed vote from Ward Project.');
      }
    } catch {
      toast.error('Failed to register vote.');
    }
  };

  /* ── Open Group Detail Modal ── */
  const handleOpenDetailModal = async (projectId) => {
    setIsLoadingDetail(true);
    setIsModalOpen(true);
    setShowOfficerPanel(false);
    try {
      const res = await api.get(`/complaints/projects/${projectId}/`);
      setSelectedProject(res.data);
    } catch {
      toast.error('Failed to load group project details.');
      setIsModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  /* ── Group Officer Resolution Submit ── */
  const handleGroupOfficerResolve = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsSubmittingProof(true);
    try {
      const formData = new FormData();
      if (proofFile) {
        formData.append('after_image', proofFile);
      }
      formData.append('remarks', proofRemarks || 'Group infrastructure repair completed by department.');
      formData.append('demo_mode', 'true');

      const res = await api.post(`/complaints/projects/${selectedProject.id}/resolve/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 200) {
        toast.success(`Group resolution proof submitted. Associated complaints updated to Under Review.`);
        setSelectedProject(res.data.data);
        setShowOfficerPanel(false);
        setProofFile(null);
        setProofRemarks('');
        fetchProjects();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit group resolution proof.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  /* ── Group Citizen Verification Handler ── */
  const handleGroupCitizenVerify = async (action) => {
    if (!selectedProject) return;
    setIsVerifying(true);
    try {
      const res = await api.post(`/complaints/projects/${selectedProject.id}/verify/`, { action });
      if (res.status === 200) {
        if (action === 'approve') {
          toast.success(res.data.message || 'Group resolution approved.');
        } else {
          toast.warn(res.data.message || 'Group resolution rejected.');
        }
        setSelectedProject(res.data.data);
        fetchProjects();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify group project.');
    } finally {
      setIsVerifying(false);
    }
  };

  /* ── Individual Photo Proof Verification Handler ── */
  const handleProofVerify = async (proofId, action, reason = '') => {
    setIsVerifying(true);
    try {
      const res = await api.post(`/complaints/projects/proofs/${proofId}/verify/`, { action, reason });
      if (res.status === 200) {
        toast.success(res.data.message);
        if (selectedProject) {
          handleOpenDetailModal(selectedProject.id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify photo proof.');
    } finally {
      setIsVerifying(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedDepartment('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  const activeFiltersCount = [selectedState, selectedDistrict, selectedDepartment, selectedCategory, selectedStatus, search].filter(Boolean).length;

  return (
    <div className="page-container space-y-6">
      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title text-2xl font-black text-slate-900">Participatory Budgeting & Ward Projects</h1>
          </div>
          <p className="page-subtitle text-xs text-slate-500 mt-1">
            Aggregating high-density ward complaints (3+ tickets) into municipal micro-projects with democratic budget allocation
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
          <HiOutlineBanknotes className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">District Repair Pool</p>
            <p className="text-lg font-black text-emerald-700 font-mono">
              ₹{(budgetInfo?.total_allocated_budget ?? 50000000).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Budget Analytics Cards ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#eef6ff] p-4 rounded-2xl border border-[#bcdcff]">
          <span className="text-[10px] text-[#0052cc] font-bold uppercase block mb-1">Total Spent Budget</span>
          <span className="text-lg font-black text-[#0052cc] font-mono">
            ₹{(budgetInfo?.total_spent_budget ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-[#ecfdf5] p-4 rounded-2xl border border-[#a7f3d0]">
          <span className="text-[10px] text-[#047857] font-bold uppercase block mb-1">Unallocated Remaining</span>
          <span className="text-lg font-black text-[#047857] font-mono">
            ₹{(budgetInfo?.remaining_budget ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-[#fffbeb] p-4 rounded-2xl border border-[#fde68a]">
          <span className="text-[10px] text-[#854d0e] font-bold uppercase block mb-1">Est. Backlog Repair Cost</span>
          <span className="text-lg font-black text-[#854d0e] font-mono">
            ₹{(budgetInfo?.total_backlog_cost ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-[#f0f3ff] p-4 rounded-2xl border border-[#c7d2fe]">
          <span className="text-[10px] text-[#4338ca] font-bold uppercase block mb-1">Verified Group Projects</span>
          <span className="text-lg font-black text-[#4338ca] font-mono">
            {budgetInfo?.completed_projects || 0} / {budgetInfo?.total_projects || 0} Projects
          </span>
        </div>
      </motion.div>

      {/* ── Search & Filter Bar ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineFunnel className="w-5 h-5 text-gov-600" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Filter Ward Projects
            </h2>
            {activeFiltersCount > 0 && (
              <span className="badge bg-gov-100 text-gov-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1">
              <HiOutlineXMark className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ward/project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500 font-medium"
            />
          </div>

          {/* State */}
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
            }}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500 font-medium"
          >
            <option value="">All States</option>
            {statesList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          {/* District */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedState && districtsList.length === 0}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500 disabled:opacity-50 font-medium"
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
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500 font-medium"
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
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500 font-medium"
          >
            <option value="">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-gov-500 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="PROPOSED">Proposed (Pending Work)</option>
            <option value="IN_EXECUTION">In Execution (Proof Uploaded)</option>
            <option value="COMPLETED">Completed & Verified</option>
          </select>
        </div>
      </motion.div>

      {/* ── Projects Grid ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Auto-Clustered Ward Projects ({filteredProjects.length})
            </h2>
            <span className="text-[10px] text-gov-700 font-bold bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
              Minimum 3+ complaints threshold
            </span>
          </div>
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
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200">
                      {proj.ward_name || 'Ward Central'} • {proj.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {proj.is_rejected && (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          Proof Rejected (Re-opened)
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        proj.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        proj.status === 'IN_EXECUTION' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {proj.status === 'COMPLETED' ? (
                          <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Completed & Verified</>
                        ) : proj.status === 'IN_EXECUTION' ? (
                          <><HiOutlineArrowPath className="w-3.5 h-3.5 text-blue-600" /> In Execution (Proof Uploaded)</>
                        ) : (
                          <><HiOutlineTag className="w-3.5 h-3.5 text-amber-600" /> Proposed</>
                        )}
                      </span>
                    </div>
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

                  <div className="flex items-center justify-between mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-700 font-medium">
                      Aggregated from <strong className="text-gov-700">{proj.complaints_count || 3}</strong> citizen grievances
                    </p>
                    <span className="text-xs font-mono font-black text-emerald-700">
                      Cost: ₹{Number(proj.estimated_cost).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
                  <button
                    onClick={() => handleOpenDetailModal(proj.id)}
                    className="text-xs font-bold text-gov-600 hover:text-gov-800 bg-gov-50 hover:bg-gov-100 px-3 py-1.5 rounded-xl border border-gov-200 transition flex items-center gap-1.5"
                  >
                    <HiOutlineEye className="w-4 h-4" /> View Group Complaints ({proj.complaints_count})
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 font-mono font-bold hidden sm:inline">
                      {proj.votes_count || 0} Votes
                    </span>
                    <button
                      onClick={() => handleVote(proj.id)}
                      className={`btn text-xs py-1.5 px-3 rounded-xl font-bold transition shadow-2xs flex items-center gap-1 ${
                        proj.voted_by_user
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'bg-gov-600 text-white hover:bg-gov-700'
                      }`}
                    >
                      <HiOutlineHandThumbUp className="w-3.5 h-3.5" />
                      {proj.voted_by_user ? 'Voted' : 'Vote to Fund'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-slate-500">
            <HiOutlineBanknotes className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-slate-700">No Ward Projects Found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your state, district, department, or status search filters above.</p>
          </div>
        )}
      </motion.div>

      {/* ── Group Project Details & Resolution Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-gov-800 to-gov-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-amber-300">
                    Group Infrastructure Project • {selectedProject?.ward_name}
                  </span>
                  <h3 className="text-lg font-black text-white leading-snug">{selectedProject?.title}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white p-1 rounded-lg">
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {isLoadingDetail ? (
                  <div className="p-12 text-center">
                    <div className="spinner mx-auto mb-3" />
                    <p className="text-xs text-slate-500">Loading associated citizen complaints...</p>
                  </div>
                ) : selectedProject ? (
                  <>
                    {/* Project Metadata Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Associated Complaints</span>
                        <span className="font-black text-slate-900 text-sm">{selectedProject.complaints_count || 0} Tickets</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Repair Budget</span>
                        <span className="font-black text-emerald-700 text-sm">₹{Number(selectedProject.estimated_cost).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Citizen Votes</span>
                        <span className="font-black text-amber-700 text-sm">{selectedProject.votes_count || 0} Votes</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Citizen Approvals</span>
                        <span className="font-black text-indigo-700 text-sm">{selectedProject.verifications_count || 0} / 3 Approvals</span>
                      </div>
                    </div>

                    {/* Officer Mode Action Toggle Banner */}
                    <div className="flex items-center justify-between bg-gov-50 p-4 rounded-2xl border border-gov-200">
                      <div>
                        <p className="text-xs font-bold text-gov-900">Department Officer Group Resolution Portal</p>
                        <p className="text-[11px] text-gov-600 mt-0.5">
                          Upload 1 geotagged proof photo here to update all {selectedProject.complaints_count || 0} associated complaints to Under Review.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowOfficerPanel(!showOfficerPanel)}
                        className="btn-primary text-xs py-1.5 px-3 rounded-xl font-bold whitespace-nowrap flex items-center gap-1"
                      >
                        <HiOutlineUser className="w-4 h-4" />
                        {showOfficerPanel ? 'Cancel Panel' : 'Officer Resolution Panel'}
                      </button>
                    </div>

                    {/* Officer Resolution Upload Panel */}
                    {showOfficerPanel && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onSubmit={handleGroupOfficerResolve}
                        className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-4"
                      >
                        <h4 className="text-xs font-black text-amber-900 uppercase">
                          Upload Group Repair Proof Photo & Remarks
                        </h4>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Select "After Repair" Geotagged Image File</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile(e.target.files[0])}
                            className="w-full text-xs p-2 bg-white border border-amber-300 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Officer Resolution Remarks</label>
                          <textarea
                            rows="2"
                            placeholder="Enter official group repair completion notes..."
                            value={proofRemarks}
                            onChange={(e) => setProofRemarks(e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-amber-300 rounded-xl"
                          />
                        </div>
                          <button
                            type="submit"
                            disabled={isSubmittingProof}
                            className="btn bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs py-2 px-4 rounded-xl font-black w-full flex items-center justify-center gap-2"
                          >
                            <HiOutlineCloudArrowUp className="w-4 h-4" />
                            {isSubmittingProof ? 'Uploading Group Proof...' : 'Submit Group Resolution Proof'}
                          </button>
                        </motion.form>
                      )}

                    {/* Previous Rejected Proof Inspection Card (For Officials & Citizens) */}
                    {selectedProject.rejected_image && (
                      <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-rose-900 uppercase">
                          <HiXMark className="w-5 h-5 text-rose-600 bg-rose-200 rounded-full p-0.5" />
                          Previous Rejected Resolution Proof (Inspected by Officials & Citizens)
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <img
                            src={resolveImageUrl(selectedProject.rejected_image)}
                            alt="Rejected Resolution Proof"
                            className="w-full sm:w-48 h-32 object-cover rounded-xl border border-rose-300 shadow-sm opacity-90 filter grayscale-25"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400'; }}
                          />
                          <div className="space-y-1.5 text-xs text-rose-950 flex-1">
                            <p><strong>Previous Upload Remarks:</strong> {selectedProject.rejected_remarks || 'Uploaded resolution proof was rejected by 3 citizens.'}</p>
                            <p className="text-[11px] text-rose-700 font-medium">
                              ⚠️ This photo was rejected by 3 citizens. Officials can inspect this photo to understand citizen feedback before submitting a new geotagged proof.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Multi-Photo Resolution Proof Ledger (Separate Photos per Issue) */}
                    {selectedProject.resolution_proofs && selectedProject.resolution_proofs.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600" />
                          Issue Resolution Proof Photos ({selectedProject.resolution_proofs.length} Photos Uploaded)
                        </h4>
                        <div className="space-y-3">
                          {selectedProject.resolution_proofs.map((proof, idx) => (
                            <div key={proof.id || idx} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs font-bold text-emerald-900 font-mono">
                                  Photo #{idx + 1} {proof.complaint_title ? `• ${proof.complaint_title}` : ''}
                                </span>
                                <div className="flex items-center gap-2 text-xs font-bold font-mono">
                                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                    <HiCheck className="w-3.5 h-3.5" /> {proof.verified_count || 0} Approvals
                                  </span>
                                  <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                    <HiXMark className="w-3.5 h-3.5" /> {proof.rejected_count || 0} Rejections
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <img
                                  src={resolveImageUrl(proof.image)}
                                  alt={`Proof ${idx + 1}`}
                                  className="w-full sm:w-44 h-32 object-cover rounded-xl border border-emerald-300 shadow-sm"
                                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400'; }}
                                />
                                <div className="space-y-1.5 text-xs text-emerald-950 flex-1">
                                  <p><strong>Photo Description / Remarks:</strong> {proof.remarks || 'Geotagged site completion proof.'}</p>
                                  {proof.is_rejected && (
                                    <p className="text-rose-700 font-bold bg-rose-100 p-1.5 rounded border border-rose-200">
                                      ⚠️ Rejected: {proof.rejection_reason || 'Citizen requested re-inspection.'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Per-Photo Action Buttons */}
                              <div className="flex items-center gap-3 pt-1">
                                <button
                                  onClick={() => handleProofVerify(proof.id, 'approve')}
                                  disabled={isVerifying || proof.verified_by_user}
                                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 rounded-xl font-bold flex-1 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                  <HiCheck className="w-4 h-4" />
                                  {proof.verified_by_user ? 'Approved Photo' : `Approve Photo (${proof.verified_count || 0})`}
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason for this specific photo:');
                                    if (reason) handleProofVerify(proof.id, 'reject', reason);
                                  }}
                                  disabled={isVerifying || proof.rejected_by_user}
                                  className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs py-1.5 px-3 rounded-xl font-bold flex-1 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                  <HiXMark className="w-4 h-4" />
                                  {proof.rejected_by_user ? 'Rejected Photo' : `Reject Photo (${proof.rejected_count || 0})`}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : selectedProject.after_image && (
                      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-xs font-black text-emerald-900 uppercase flex items-center gap-1.5">
                            <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600" />
                            Group Resolution Proof (Submitted by Department)
                          </h4>
                          <div className="flex items-center gap-3 text-xs font-bold font-mono">
                            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <HiCheck className="w-3.5 h-3.5" /> {selectedProject.verifications_count || 0} / 3 Approvals
                            </span>
                            <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                              <HiXMark className="w-3.5 h-3.5" /> {selectedProject.rejections_count || 0} / 3 Rejections
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <img
                            src={resolveImageUrl(selectedProject.after_image)}
                            alt="Group Resolution Proof"
                            className="w-full sm:w-48 h-32 object-cover rounded-xl border border-emerald-300 shadow-sm"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400'; }}
                          />
                          <div className="space-y-2 text-xs text-emerald-950 flex-1">
                            <p><strong>Official Remarks:</strong> {selectedProject.resolution_remarks || 'Group infrastructure repair completed.'}</p>
                            <p className="text-[11px] text-emerald-700">
                              Requires <strong>3 citizen approvals</strong> to auto-resolve all {selectedProject.complaints_count || 0} complaints, or <strong>3 citizen rejections</strong> to reset ticket to Pending.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleGroupCitizenVerify('approve')}
                            disabled={isVerifying || selectedProject.verified_by_user}
                            className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 rounded-xl font-bold flex-1 disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <HiCheck className="w-4 h-4" />
                            {selectedProject.verified_by_user ? 'Approved (1 Vote)' : `Approve Work (${selectedProject.verifications_count || 0}/3)`}
                          </button>
                          <button
                            onClick={() => handleGroupCitizenVerify('reject')}
                            disabled={isVerifying || selectedProject.rejected_by_user}
                            className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs py-2 px-4 rounded-xl font-bold flex-1 disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <HiXMark className="w-4 h-4" />
                            {selectedProject.rejected_by_user ? 'Rejected (1 Vote)' : `Reject Proof (${selectedProject.rejections_count || 0}/3)`}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Associated Citizen Complaints List Table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Associated Citizen Grievances ({selectedProject.complaints?.length || 0})
                      </h4>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {selectedProject.complaints && selectedProject.complaints.length > 0 ? (
                          selectedProject.complaints.map((c) => {
                            const badge = getStatusColor(c.status?.name || c.status);
                            return (
                              <div key={c.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-gov-700">{c.reference_number}</span>
                                    <span className={badge.className}>{badge.label}</span>
                                  </div>
                                  <p className="font-bold text-slate-900 mt-0.5 line-clamp-1">{c.title}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">By {c.complainant_name || 'Citizen'} • {c.district}, {c.state}</p>
                                </div>

                                <Link
                                  to={`/complaints/${c.id}`}
                                  target="_blank"
                                  className="text-gov-600 hover:text-gov-800 font-bold hover:underline whitespace-nowrap text-[11px]"
                                >
                                  View Ticket ↗
                                </Link>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-500 italic">No associated complaints loaded.</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
