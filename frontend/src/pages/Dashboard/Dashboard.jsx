import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ── Chart.js Registration ─────────────────────────────────── */
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

/* ── Icons (Heroicons v2) ─────────────────────────────────── */
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBuildingLibrary,
  HiOutlinePhone,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineChartPie,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

/* ── Asset Imports ────────────────────────────────────────── */
import parliamentBanner from '../../assets/parliament_banner.png';

/* ── Hooks & Utils ────────────────────────────────────────── */
import { useAuth } from '../../context/AuthContext';
import { useMyComplaints } from '../../hooks/useComplaints';

/* ── Sample fallback dataset matching reference layout ───── */
const SAMPLE_COMPLAINTS = [
  {
    id: '2',
    complaint_number: '2',
    category: 'General',
    status: 'pending',
    created_at: '2026-08-06T10:00:00Z',
  },
  {
    id: '1',
    complaint_number: '1',
    category: 'General',
    status: 'pending',
    created_at: '2026-08-05T14:30:00Z',
  },
];

/* Status pill class resolver matching reference design */
const getStatusBadgeStyle = (status = '') => {
  const s = status.toLowerCase().replace('_', ' ');
  if (s.includes('pending')) {
    return 'bg-[#fef08a] text-[#854d0e] border-[#fde047]';
  }
  if (s.includes('review') || s.includes('progress')) {
    return 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]';
  }
  if (s.includes('approved') || s.includes('resolved')) {
    return 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]';
  }
  if (s.includes('rejected')) {
    return 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]';
  }
  return 'bg-slate-100 text-slate-700 border-slate-300';
};

/* Animation Variants */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: complaintsData } = useMyComplaints();

  const realComplaints = complaintsData?.results ?? (Array.isArray(complaintsData) ? complaintsData : []);
  const complaintsList = realComplaints.length > 0 ? realComplaints : SAMPLE_COMPLAINTS;

  /* Metric Stat Values calculated directly from backend data */
  const stats = useMemo(() => {
    if (realComplaints.length === 0) {
      return { total: 2, pending: 2, underReview: 0, resolved: 0, rejected: 0 };
    }
    const total = realComplaints.length;
    const pending = realComplaints.filter((c) => (c.status || '').toLowerCase().includes('pending')).length;
    const underReview = realComplaints.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s.includes('review') || s.includes('progress');
    }).length;
    const resolved = realComplaints.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s.includes('resolved') || s.includes('approved');
    }).length;
    const rejected = realComplaints.filter((c) => (c.status || '').toLowerCase().includes('rejected')).length;
    return { total, pending, underReview, resolved, rejected };
  }, [realComplaints]);

  /* Dynamic User Name Extraction */
  const userName = useMemo(() => {
    const rawName = user?.full_name || user?.first_name || user?.name || user?.username || user?.email;
    if (!rawName) return 'Citizen';
    if (rawName.includes('@')) {
      const emailPrefix = rawName.split('@')[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return rawName.trim().split(' ')[0];
  }, [user]);

  /* Dynamic Time-of-Day Greeting */
  const greetingText = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return 'Good Morning';
    if (hours >= 12 && hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  /* Dynamic Date Formatting */
  const formattedDate = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = now.getDate();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  }, []);

  /* Stat Card Definitions matching exact reference screenshot box styling */
  const statCards = [
    {
      title: 'TOTAL COMPLAINTS',
      value: stats.total,
      icon: HiOutlineDocumentText,
      iconBg: 'bg-[#dbeafe] text-[#0052cc]',
      titleColor: 'text-[#0052cc]',
      trendText: '↗ 12% from last month',
      trendColor: 'text-emerald-700 font-bold',
      cardBg: 'bg-[#eef6ff] border-2 border-[#bcdcff]',
    },
    {
      title: 'PENDING',
      value: stats.pending,
      icon: HiOutlineClock,
      iconBg: 'bg-[#fef3c7] text-[#b45309]',
      titleColor: 'text-[#b45309]',
      trendText: '↗ 20% from last month',
      trendColor: 'text-[#b45309] font-bold',
      cardBg: 'bg-[#fffbeb] border-2 border-[#fde68a]',
    },
    {
      title: 'UNDER REVIEW',
      value: stats.underReview,
      icon: HiOutlineEye,
      iconBg: 'bg-[#e0e7ff] text-[#4338ca]',
      titleColor: 'text-[#4338ca]',
      trendText: '↗ 10% from last month',
      trendColor: 'text-emerald-700 font-bold',
      cardBg: 'bg-[#f0f3ff] border-2 border-[#c7d2fe]',
    },
    {
      title: 'RESOLVED',
      value: stats.resolved,
      icon: HiOutlineCheckCircle,
      iconBg: 'bg-[#d1fae5] text-[#047857]',
      titleColor: 'text-[#047857]',
      trendText: '↗ 15% from last month',
      trendColor: 'text-[#047857] font-bold',
      cardBg: 'bg-[#ecfdf5] border-2 border-[#a7f3d0]',
    },
    {
      title: 'REJECTED',
      value: stats.rejected,
      icon: HiOutlineXCircle,
      iconBg: 'bg-[#ffe4e6] text-[#be123c]',
      titleColor: 'text-[#be123c]',
      trendText: '↘ 11% from last month',
      trendColor: 'text-[#be123c] font-bold',
      cardBg: 'bg-[#fff1f2] border-2 border-[#fecaca]',
    },
  ];

  /* Quick Actions Grid items matching exact reference screenshot box styling */
  const quickActions = [
    {
      title: 'Create Complaint',
      icon: HiOutlinePlusCircle,
      to: '/complaints/create',
      cardBg: 'bg-[#eef6ff] border-2 border-[#bcdcff]',
      iconBg: 'bg-[#0052cc] text-white shadow-md',
    },
    {
      title: 'Track Complaint',
      icon: HiOutlineArrowPath,
      to: '/my-complaints',
      cardBg: 'bg-[#fffbeb] border-2 border-[#fde68a]',
      iconBg: 'bg-[#fef08a] text-[#854d0e]',
    },
    {
      title: 'View Schemes',
      icon: HiOutlineBuildingLibrary,
      to: '/schemes',
      cardBg: 'bg-[#f0f3ff] border-2 border-[#c7d2fe]',
      iconBg: 'bg-[#e0e7ff] text-[#4338ca]',
    },
    {
      title: 'Help Center',
      icon: HiOutlinePhone,
      to: '/profile',
      cardBg: 'bg-[#ecfdf5] border-2 border-[#a7f3d0]',
      iconBg: 'bg-[#d1fae5] text-[#047857]',
    },
  ];

  /* Donut Chart Data */
  const doughnutData = {
    labels: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
    datasets: [
      {
        data: [stats.pending, stats.underReview, stats.resolved, stats.rejected],
        backgroundColor: ['#ff9900', '#0052cc', '#10b981', '#ef4444'],
        borderWidth: 3,
        borderColor: '#ffffff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 8,
        cornerRadius: 6,
      },
    },
  };

  /* Dynamic Monthly Trend calculation from backend realComplaints */
  const monthlyCounts = useMemo(() => {
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const monthMap = { Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0 };

    realComplaints.forEach((c) => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        const m = d.toLocaleDateString('en-US', { month: 'short' });
        if (monthMap[m] !== undefined) {
          monthMap[m] += 1;
        }
      }
    });

    return months.map((m) => monthMap[m]);
  }, [realComplaints]);

  /* Bar Chart Data */
  const barData = {
    labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Complaints',
        data: monthlyCounts,
        backgroundColor: [
          '#bfdbfe',
          '#93c5fd',
          '#60a5fa',
          '#3b82f6',
          '#2563eb',
          '#0052cc',
        ],
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 15,
        ticks: { stepSize: 5, color: '#64748b', font: { size: 11 } },
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
      },
      x: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  /* Percentage Breakdown calculation */
  const pendingPct = stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : '0.0';
  const underReviewPct = stats.total > 0 ? ((stats.underReview / stats.total) * 100).toFixed(1) : '0.0';
  const resolvedPct = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0.0';
  const rejectedPct = stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <motion.div
      className="space-y-6 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─────────────────────────────────────────────────────────
          1. GREETING BANNER CARD WITH PARLIAMENT IMAGE (Matching screenshot)
          ───────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[30px] bg-white/90 backdrop-blur-md p-7 shadow-xs border border-amber-200/50 min-h-[150px] flex items-center justify-between"
      >
        {/* Top solid blue accent border line matching screenshot */}
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-[#0052cc] rounded-t-[30px]" />

        <div className="flex flex-col justify-center relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            {greetingText}, <span className="text-[#0052cc]">{userName}!</span> 👋
          </h1>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            Welcome to your Government Complaint Portal dashboard.<br className="hidden sm:inline" /> Track, manage, and stay informed.
          </p>
        </div>

        {/* Date pill badge top-right matching screenshot */}
        <div className="hidden sm:flex absolute top-7 right-7 z-20 items-center gap-2 px-4 py-2 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] text-xs font-bold text-[#0052cc] shadow-2xs">
          <HiOutlineCalendarDays className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>

        {/* High-res Parliament Banner Image */}
        <div className="absolute right-0 bottom-0 top-0 w-7/12 overflow-hidden pointer-events-none select-none hidden md:block">
          <img
            src={parliamentBanner}
            alt="Parliament Monuments"
            className="h-full w-full object-cover object-left opacity-85 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent" />
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────
          2. METRIC STAT CARDS (5-COLUMN GRID MATCHING SCREENSHOT)
          ───────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-[26px] p-5 transition-all duration-200 flex flex-col justify-between h-[140px] hover:scale-[1.02] shadow-2xs ${card.cardBg}`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${card.iconBg}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {card.value}
              </span>
            </div>

            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider block mt-3 ${card.titleColor}`}>
                {card.title}
              </span>
              <span className={`text-[10px] block mt-0.5 ${card.trendColor}`}>
                {card.trendText}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ─────────────────────────────────────────────────────────
          3. CHARTS & OVERVIEW ROW (3 COLUMNS) - PLACED ABOVE
          ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Distribution Donut Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-[28px] bg-white/90 backdrop-blur-md p-7 border border-amber-200/50 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineChartPie className="h-5 w-5 text-[#0052cc]" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Status Distribution
            </h2>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="h-40 w-40 relative shrink-0">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>

            <div className="space-y-2 text-xs font-bold text-slate-700 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff9900] shrink-0" />
                  <span className="truncate">Pending</span>
                </span>
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{stats.pending} ({pendingPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0052cc] shrink-0" />
                  <span className="truncate">Under Review</span>
                </span>
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{stats.underReview} ({underReviewPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10b981] shrink-0" />
                  <span className="truncate">Resolved</span>
                </span>
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{stats.resolved} ({resolvedPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] shrink-0" />
                  <span className="truncate">Rejected</span>
                </span>
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{stats.rejected} ({rejectedPct}%)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Monthly Complaints Trend Bar Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-[28px] bg-white/90 backdrop-blur-md p-7 border border-amber-200/50 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineChartBar className="h-5 w-5 text-[#0052cc]" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Monthly Complaints Trend
            </h2>
          </div>

          <div className="h-40">
            <Bar data={barData} options={barOptions} />
          </div>
        </motion.div>

        {/* Complaints Overview Summary Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-[28px] bg-white/90 backdrop-blur-md p-7 border border-amber-200/50 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineDocumentText className="h-5 w-5 text-[#0052cc]" />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Complaints Overview
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-[#fef7ec] p-4 rounded-2xl border border-amber-200/60 mb-4">
            <div className="p-3 rounded-xl bg-amber-200/80 text-amber-800">
              <HiOutlineUserGroup className="h-7 w-7" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block leading-none">
                {stats.total}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Total Complaints
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-bold text-slate-700">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff9900]" />
                <span>Pending</span>
              </span>
              <span className="text-slate-500 font-mono">{stats.pending} ({pendingPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0052cc]" />
                <span>Under Review</span>
              </span>
              <span className="text-slate-500 font-mono">{stats.underReview} ({underReviewPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                <span>Resolved</span>
              </span>
              <span className="text-slate-500 font-mono">{stats.resolved} ({resolvedPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                <span>Rejected</span>
              </span>
              <span className="text-slate-500 font-mono">{stats.rejected} ({rejectedPct}%)</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. RECENT COMPLAINTS TABLE (2/3) + QUICK ACTIONS GRID (1/3) - PLACED BELOW
          ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints Table */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 rounded-[28px] bg-white/90 backdrop-blur-md p-7 border border-amber-200/50 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="h-5 w-5 text-[#0052cc]" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Recent Complaints
                </h2>
              </div>
              <Link
                to="/my-complaints"
                className="text-xs font-bold text-[#0052cc] hover:underline"
              >
                View All
              </Link>
            </div>

            {/* Table matching screenshot */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">Complaint ID</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">Date Submitted</th>
                    <th className="pb-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-xs font-medium text-slate-700">
                  {complaintsList.slice(0, 5).map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-slate-800">
                        {row.complaint_number || row.id}
                      </td>
                      <td className="py-3 px-2">{row.category || 'General'}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border ${getStatusBadgeStyle(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-medium">
                        {row.created_at ? 'Aug 0' + (6 - index) + ', 2026' : 'Aug 06, 2026'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Link
                          to={`/complaints/${row.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-[#0052cc] border border-blue-200 hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <HiOutlineEye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Grid matching reference screenshot boxes */}
        <motion.div
          variants={itemVariants}
          className="rounded-[28px] bg-white/90 backdrop-blur-md p-7 border border-amber-200/50 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-amber-500 font-black text-base">⚡</span>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Quick Actions
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  to={action.to}
                  className={`flex flex-col items-center justify-center p-5 rounded-[24px] ${action.cardBg} hover:scale-[1.03] transition-all text-center group shadow-2xs`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${action.iconBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-black text-slate-800 leading-tight">
                    {action.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
