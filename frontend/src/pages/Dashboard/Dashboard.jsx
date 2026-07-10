/**
 * Dashboard.jsx
 * =============
 * Main dashboard page for the Government Complaint Portal.
 *
 * Sections:
 *  1. Welcome Card — personalized greeting with date
 *  2. Statistics Cards — total, pending, under review, resolved
 *  3. Charts — doughnut (status distribution) + bar (monthly trend)
 *  4. Quick Actions — shortcut navigation buttons
 *  5. Recent Complaints — last 5 complaints table/cards
 *  6. Latest Notifications — last 5 unread notifications
 *  7. Recommended Schemes — last 3 government schemes
 *
 * Dependencies:
 *  - react-chartjs-2 / chart.js  — data charts
 *  - framer-motion               — entrance animations
 *  - react-icons/hi2             — heroicons v2
 *  - @tanstack/react-query hooks — server-state management
 */

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

/* ── Icons (Heroicons v2 — hi2) ────────────────────────────── */
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlinePlusCircle,
  HiOutlineBuildingLibrary,
  HiOutlineClipboardDocumentList,
  HiOutlineBellAlert,
  HiOutlineArrowRight,
  HiOutlineExclamationTriangle,
  HiOutlineInboxStack,
  HiOutlineChartBarSquare,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';

/* ── Project Hooks & Helpers ───────────────────────────────── */
import { useAuth } from '../../context/AuthContext';
import { useMyComplaints } from '../../hooks/useComplaints';
import { useUnreadNotifications } from '../../hooks/useNotifications';
import { useSchemes } from '../../hooks/useSchemes';
import {
  formatDate,
  formatRelativeTime,
  getStatusColor,
  truncateText,
} from '../../utils/helpers';

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS — staggered entrance for cards / rows
   ═══════════════════════════════════════════════════════════ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

/* ═══════════════════════════════════════════════════════════
   SKELETON COMPONENTS — loading placeholders
   ═══════════════════════════════════════════════════════════ */

/** Skeleton for a single stat card */
const StatCardSkeleton = () => (
  <div className="card p-5">
    <div className="flex items-center gap-4">
      <div className="skeleton h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-7 w-16 rounded" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
    </div>
  </div>
);

/** Skeleton for a chart card */
const ChartSkeleton = () => (
  <div className="card p-6">
    <div className="skeleton h-5 w-40 rounded mb-6" />
    <div className="skeleton h-56 w-full rounded-lg" />
  </div>
);

/** Skeleton for a complaint row */
const ComplaintRowSkeleton = () => (
  <div className="flex items-center gap-4 py-3 border-b border-gov-100/60 last:border-0">
    <div className="skeleton h-4 w-20 rounded" />
    <div className="skeleton h-4 flex-1 rounded" />
    <div className="skeleton h-6 w-20 rounded-full" />
    <div className="skeleton h-4 w-24 rounded" />
  </div>
);

/** Full-page loading skeleton */
const DashboardSkeleton = () => (
  <div className="page-container space-y-6 animate-pulse">
    {/* Welcome skeleton */}
    <div className="card p-6">
      <div className="skeleton h-7 w-64 rounded mb-2" />
      <div className="skeleton h-4 w-80 rounded" />
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Table skeleton */}
    <div className="card p-6">
      <div className="skeleton h-5 w-44 rounded mb-4" />
      {[...Array(5)].map((_, i) => (
        <ComplaintRowSkeleton key={i} />
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   HELPER: Resolve badge class from status string
   ═══════════════════════════════════════════════════════════ */
const getStatusBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return 'badge badge-pending';
  if (s === 'under_review' || s === 'under review' || s === 'in_progress')
    return 'badge badge-review';
  if (s === 'resolved') return 'badge badge-resolved';
  if (s === 'rejected') return 'badge badge-rejected';
  return 'badge badge-pending';
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  /* ── Auth Context ─────────────────────────────────── */
  const { user } = useAuth();

  /* ── Server State (React Query) ───────────────────── */
  const {
    data: complaintsData,
    isLoading: complaintsLoading,
    isError: complaintsError,
  } = useMyComplaints();

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
  } = useUnreadNotifications();

  const {
    data: schemesData,
    isLoading: schemesLoading,
  } = useSchemes();

  /* ── Derived Data ─────────────────────────────────── */
  const complaints = useMemo(
    () => complaintsData?.results ?? [],
    [complaintsData]
  );
  const notifications = useMemo(
    () => notificationsData?.results ?? [],
    [notificationsData]
  );
  const schemes = useMemo(
    () => schemesData?.results ?? [],
    [schemesData]
  );

  /* ── Statistics Computation ───────────────────────── */
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(
      (c) => (c.status || '').toLowerCase() === 'pending'
    ).length;
    const underReview = complaints.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'under_review' || s === 'under review' || s === 'in_progress';
    }).length;
    const resolved = complaints.filter(
      (c) => (c.status || '').toLowerCase() === 'resolved'
    ).length;
    const rejected = complaints.filter(
      (c) => (c.status || '').toLowerCase() === 'rejected'
    ).length;

    return { total, pending, underReview, resolved, rejected };
  }, [complaints]);

  /* ── Recent Complaints (last 5) ───────────────────── */
  const recentComplaints = useMemo(
    () => complaints.slice(0, 5),
    [complaints]
  );

  /* ── Recent Notifications (last 5) ────────────────── */
  const recentNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications]
  );

  /* ── Recommended Schemes (last 3) ─────────────────── */
  const recommendedSchemes = useMemo(
    () => schemes.slice(0, 3),
    [schemes]
  );

  /* ── Today's Date ─────────────────────────────────── */
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /* ── Greeting Based on Time of Day ────────────────── */
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  /* ═════════════════════════════════════════════════════
     CHART CONFIGURATIONS
     ═════════════════════════════════════════════════════ */

  /** Doughnut — Status Distribution */
  const doughnutData = useMemo(
    () => ({
      labels: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
      datasets: [
        {
          data: [
            stats.pending,
            stats.underReview,
            stats.resolved,
            stats.rejected,
          ],
          backgroundColor: [
            '#f59e0b', // warning / pending
            '#3b82f6', // blue / review
            '#10b981', // green / resolved
            '#ef4444', // red / rejected
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    }),
    [stats]
  );

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: '#1e3a5f',
        titleFont: { family: "'Inter', sans-serif" },
        bodyFont: { family: "'Inter', sans-serif" },
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  /** Bar — Monthly Complaints Trend (real data grouped by month) */
  const barData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const labels = [];
    const counts = [];
    const monthMap = {};

    // Initialize mapping keys for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const mIdx = date.getMonth();
      const yVal = date.getFullYear();
      const key = `${yVal}-${mIdx}`;
      
      labels.push(months[mIdx]);
      monthMap[key] = 0;
    }

    // Accumulate count of real complaints
    complaints.forEach((c) => {
      if (!c.created_at) return;
      const cDate = new Date(c.created_at);
      const key = `${cDate.getFullYear()}-${cDate.getMonth()}`;
      if (monthMap[key] !== undefined) {
        monthMap[key] += 1;
      }
    });

    // Populate counts array
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      counts.push(monthMap[key]);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Complaints Filed',
          data: counts,
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: '#1d4ed8',
        },
      ],
    };
  }, [complaints]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11, family: "'Inter', sans-serif" },
          color: '#64748b',
        },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
          color: '#64748b',
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e3a5f',
        titleFont: { family: "'Inter', sans-serif" },
        bodyFont: { family: "'Inter', sans-serif" },
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  /* ═════════════════════════════════════════════════════
     STAT CARD CONFIGURATION
     ═════════════════════════════════════════════════════ */
  const statCards = [
    {
      label: 'Total Complaints',
      value: stats.total,
      icon: HiOutlineDocumentText,
      iconBg: 'bg-gov-100',
      iconColor: 'text-gov-700',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: HiOutlineClock,
      iconBg: 'bg-warning-light',
      iconColor: 'text-warning',
    },
    {
      label: 'Under Review',
      value: stats.underReview,
      icon: HiOutlineEye,
      iconBg: 'bg-gov-100',
      iconColor: 'text-gov-600',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: HiOutlineCheckCircle,
      iconBg: 'bg-success-light',
      iconColor: 'text-success',
    },
  ];

  /* ═════════════════════════════════════════════════════
     QUICK ACTIONS CONFIG
     ═════════════════════════════════════════════════════ */
  const quickActions = [
    {
      label: 'New Complaint',
      description: 'File a new complaint',
      icon: HiOutlinePlusCircle,
      to: '/complaints/create',
      color: 'text-gov-700',
      bg: 'bg-gov-50',
    },
    {
      label: 'View Schemes',
      description: 'Browse government schemes',
      icon: HiOutlineBuildingLibrary,
      to: '/schemes',
      color: 'text-accent',
      bg: 'bg-accent-light',
    },
    {
      label: 'My Complaints',
      description: 'Track your complaints',
      icon: HiOutlineClipboardDocumentList,
      to: '/my-complaints',
      color: 'text-success',
      bg: 'bg-success-light',
    },
  ];

  /* ═════════════════════════════════════════════════════
     LOADING STATE
     ═════════════════════════════════════════════════════ */
  if (complaintsLoading && notificationsLoading && schemesLoading) {
    return <DashboardSkeleton />;
  }

  /* ═════════════════════════════════════════════════════
     ERROR STATE
     ═════════════════════════════════════════════════════ */
  if (complaintsError) {
    return (
      <div className="page-container">
        <motion.div
          className="card p-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-light">
            <HiOutlineExclamationTriangle className="h-8 w-8 text-danger" />
          </div>
          <h2 className="text-lg font-semibold text-gov-900 mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-sm text-gov-500 mb-6 max-w-md mx-auto">
            We encountered an error while loading your dashboard data. Please
            check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════ */
  return (
    <div className="page-container space-y-6">
      {/* ───────────────────────────────────────────────
          1. WELCOME CARD
          ─────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="glass-card relative overflow-hidden p-6 md:p-8"
      >
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gov-600 via-gov-500 to-accent rounded-t-xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gov-900 mb-1">
              {greeting},{' '}
              <span className="gradient-text">
                {user?.full_name || user?.name || 'Citizen'}
              </span>
              ! 👋
            </h1>
            <p className="text-sm text-gov-500">
              Welcome to your Government Complaint Portal dashboard. Track,
              manage, and stay informed.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gov-500 whitespace-nowrap">
            <HiOutlineCalendarDays className="h-4 w-4" />
            <span>{today}</span>
          </div>
        </div>
      </motion.div>

      {/* ───────────────────────────────────────────────
          2. STATISTICS CARDS
          ─────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card card-hover p-5"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>

              {/* Value & Label */}
              <div>
                <p className="text-2xl font-bold text-gov-900">{card.value}</p>
                <p className="text-xs font-medium text-gov-500 uppercase tracking-wide">
                  {card.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ───────────────────────────────────────────────
          3. CHARTS SECTION
          ─────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Doughnut — Status Distribution */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineChartBarSquare className="h-5 w-5 text-gov-600" />
            <h2 className="text-sm font-semibold text-gov-800 uppercase tracking-wide">
              Status Distribution
            </h2>
          </div>
          {stats.total === 0 ? (
            /* Empty state for chart */
            <div className="flex flex-col items-center justify-center h-56 text-center">
              <HiOutlineInboxStack className="h-10 w-10 text-gov-300 mb-2" />
              <p className="text-sm text-gov-400">
                No complaints yet. File your first complaint to see statistics.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          )}
        </motion.div>

        {/* Bar — Monthly Trend */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineChartBarSquare className="h-5 w-5 text-gov-600" />
            <h2 className="text-sm font-semibold text-gov-800 uppercase tracking-wide">
              Monthly Complaints Trend
            </h2>
          </div>
          {stats.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center">
              <HiOutlineInboxStack className="h-10 w-10 text-gov-300 mb-2" />
              <p className="text-sm text-gov-400">
                Trend data will appear once you start filing complaints.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ───────────────────────────────────────────────
          4. QUICK ACTIONS
          ─────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-sm font-semibold text-gov-800 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="card card-hover p-5 flex items-center gap-4 no-underline group"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.bg}`}
              >
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gov-900 group-hover:text-gov-700 transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-gov-400">{action.description}</p>
              </div>
              <HiOutlineArrowRight className="h-4 w-4 text-gov-300 group-hover:text-gov-600 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ───────────────────────────────────────────────
          5. RECENT COMPLAINTS + 6. NOTIFICATIONS
          Two-column layout on desktop, stacked on mobile
          ─────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Recent Complaints (2/3 width) ──────────── */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiOutlineClipboardDocumentList className="h-5 w-5 text-gov-600" />
              <h2 className="text-sm font-semibold text-gov-800 uppercase tracking-wide">
                Recent Complaints
              </h2>
            </div>
            {complaints.length > 0 && (
              <Link
                to="/my-complaints"
                className="text-xs font-medium text-gov-600 hover:text-gov-800 transition-colors flex items-center gap-1 no-underline"
              >
                View All
                <HiOutlineArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {complaintsLoading ? (
            /* Loading skeleton */
            <div className="space-y-0">
              {[...Array(5)].map((_, i) => (
                <ComplaintRowSkeleton key={i} />
              ))}
            </div>
          ) : recentComplaints.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <HiOutlineInboxStack className="h-12 w-12 text-gov-200 mb-3" />
              <p className="text-sm font-medium text-gov-500 mb-1">
                No Complaints Filed
              </p>
              <p className="text-xs text-gov-400 mb-4 max-w-xs">
                You haven&apos;t filed any complaints yet. Start by submitting
                your first complaint.
              </p>
              <Link to="/complaints/create" className="btn btn-primary text-sm">
                <HiOutlinePlusCircle className="h-4 w-4" />
                File a Complaint
              </Link>
            </div>
          ) : (
            /* Complaints Table / List */
            <div className="overflow-x-auto">
              {/* Table header — hidden on mobile, shown on sm+ */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-gov-400 uppercase tracking-wider border-b border-gov-100">
                <span className="col-span-2">ID</span>
                <span className="col-span-5">Title</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-3 text-right">Date</span>
              </div>

              {recentComplaints.map((complaint, idx) => (
                <Link
                  key={complaint.id || idx}
                  to={`/complaints/${complaint.id}`}
                  className="no-underline"
                >
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center px-3 py-3 border-b border-gov-100/60 last:border-0 hover:bg-gov-50/60 transition-colors rounded-lg cursor-pointer"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Complaint Number */}
                    <span className="sm:col-span-2 text-xs font-mono font-semibold text-gov-600">
                      #{complaint.complaint_number || complaint.id}
                    </span>

                    {/* Title */}
                    <span className="sm:col-span-5 text-sm text-gov-800 font-medium truncate">
                      {truncateText(complaint.title || 'Untitled', 50)}
                    </span>

                    {/* Status Badge */}
                    <span className="sm:col-span-2">
                      <span className={getStatusBadgeClass(complaint.status)}>
                        {(complaint.status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </span>

                    {/* Date */}
                    <span className="sm:col-span-3 text-xs text-gov-400 sm:text-right">
                      {formatDate(complaint.created_at)}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Latest Notifications (1/3 width) ───────── */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiOutlineBellAlert className="h-5 w-5 text-gov-600" />
              <h2 className="text-sm font-semibold text-gov-800 uppercase tracking-wide">
                Notifications
              </h2>
            </div>
            {notifications.length > 0 && (
              <Link
                to="/notifications"
                className="text-xs font-medium text-gov-600 hover:text-gov-800 transition-colors flex items-center gap-1 no-underline"
              >
                See All
                <HiOutlineArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {notificationsLoading ? (
            /* Loading skeleton */
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <HiOutlineBellAlert className="h-10 w-10 text-gov-200 mb-2" />
              <p className="text-sm text-gov-400">No new notifications</p>
            </div>
          ) : (
            /* Notification list */
            <div className="space-y-1">
              {recentNotifications.map((notif, idx) => (
                <Link
                  key={notif.id || idx}
                  to="/notifications"
                  className="no-underline"
                >
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-gov-50/70 ${
                      !notif.is_read
                        ? 'bg-gov-50/50 border-l-2 border-gov-500'
                        : ''
                    }`}
                  >
                    {/* Unread indicator dot */}
                    <div className="mt-1.5 shrink-0">
                      {!notif.is_read ? (
                        <span className="block h-2 w-2 rounded-full bg-gov-600" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-gov-200" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-relaxed ${
                          !notif.is_read
                            ? 'text-gov-800 font-medium'
                            : 'text-gov-500'
                        }`}
                      >
                        {truncateText(notif.message || notif.text || '', 80)}
                      </p>
                      <p className="text-[11px] text-gov-400 mt-0.5">
                        {formatRelativeTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ───────────────────────────────────────────────
          7. RECOMMENDED SCHEMES
          ─────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HiOutlineSparkles className="h-5 w-5 text-gov-600" />
            <h2 className="text-sm font-semibold text-gov-800 uppercase tracking-wide">
              Recommended Schemes
            </h2>
          </div>
          {schemes.length > 0 && (
            <Link
              to="/schemes"
              className="text-xs font-medium text-gov-600 hover:text-gov-800 transition-colors flex items-center gap-1 no-underline"
            >
              Browse All
              <HiOutlineArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {schemesLoading ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-12 w-full rounded" />
              </div>
            ))}
          </div>
        ) : recommendedSchemes.length === 0 ? (
          /* Empty state */
          <div className="card p-8 text-center">
            <HiOutlineBuildingLibrary className="h-10 w-10 text-gov-200 mx-auto mb-2" />
            <p className="text-sm text-gov-400">
              No schemes available at the moment.
            </p>
          </div>
        ) : (
          /* Schemes cards grid */
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {recommendedSchemes.map((scheme, idx) => (
              <motion.div key={scheme.id || idx} variants={itemVariants}>
                <Link
                  to={`/schemes/${scheme.id}`}
                  className="no-underline block"
                >
                  <div className="card card-hover p-5 h-full flex flex-col">
                    {/* Department tag */}
                    {scheme.department && (
                      <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-gov-500 bg-gov-50 px-2 py-0.5 rounded mb-2 self-start">
                        {scheme.department?.name || scheme.department}
                      </span>
                    )}

                    {/* Scheme name */}
                    <h3 className="text-sm font-semibold text-gov-900 mb-1.5 line-clamp-2">
                      {scheme.scheme_name || scheme.name || scheme.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gov-400 leading-relaxed flex-1 line-clamp-3">
                      {truncateText(
                        scheme.description || 'No description available.',
                        120
                      )}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-gov-600 group-hover:text-gov-800">
                      Learn More
                      <HiOutlineArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
