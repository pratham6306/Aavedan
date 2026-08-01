/**
 * ComplaintDetail.jsx — Complaint Detail Page
 * =============================================
 * Full detail view for a single complaint, including:
 *   • Header with complaint number, title, status & priority badges
 *   • Info grid (department, category, dates)
 *   • Full description
 *   • Location section with map placeholder
 *   • Image gallery
 *   • Status timeline (vertical)
 *   • Owner action buttons (edit / delete)
 *
 * Design tokens: .page-container, .card, .glass-card, .badge-*,
 *   .btn-*, .skeleton
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiChevronLeft,
  HiMapPin,
  HiClock,
  HiEye,
  HiPencilSquare,
  HiTrash,
  HiCamera,
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowPath,
  HiXCircle,
  HiInformationCircle,
  HiBuildingOffice2,
  HiCalendarDays,
  HiTag,
  HiDocumentText,
} from 'react-icons/hi2';

import { useComplaint, useDeleteComplaint } from '../../hooks/useComplaints';
import { useAuth } from '../../context/AuthContext';
import {
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getPriorityColor,
} from '../../utils/helpers';

/* ─── section fade preset ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ─── status icon map ─── */
const STATUS_ICONS = {
  pending:     HiClock,
  review:      HiArrowPath,
  in_progress: HiArrowPath,
  resolved:    HiCheckCircle,
  rejected:    HiXCircle,
  closed:      HiCheckCircle,
};

/* ====================================================================
   Component
   ==================================================================== */
export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── fetch complaint ── */
  const { data: complaint, isLoading, error } = useComplaint(id);

  /* ── delete mutation ── */
  const { mutateAsync: deleteComplaint, isPending: isDeleting } = useDeleteComplaint();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ── image lightbox ── */
  const [lightboxIdx, setLightboxIdx] = useState(null);

  /* ── ownership check ── */
  const isOwner = user && complaint && (
    user.id === complaint.user?.id || user.id === complaint.user
  );

  /* ── delete handler ── */
  const handleDelete = useCallback(async () => {
    try {
      await deleteComplaint(id);
      toast.success('Complaint deleted successfully');
      navigate('/my-complaints');
    } catch {
      toast.error('Failed to delete complaint.');
    }
  }, [id, deleteComplaint, navigate]);

  /* ── derived data ── */
  const images   = complaint?.images ?? [];
  const timeline = complaint?.status_history ?? complaint?.timeline ?? [];
  const location = {
    address: complaint?.address,
    district: complaint?.district,
    state: complaint?.state,
    landmark: complaint?.landmark,
    latitude: complaint?.latitude,
    longitude: complaint?.longitude,
  };

  const handleTriggerAIEmail = useCallback(() => {
    if (!complaint) return;
    const event = new CustomEvent('open_ai_assistant_with_data', {
      detail: {
        complaint_id: complaint.id,
        complaint_type: complaint.title || 'Grievance Report',
        category: complaint.category?.name || complaint.category || '',
        department: complaint.department?.name || complaint.department || '',
        description: complaint.description || '',
        address: complaint.address || '',
        state: complaint.state?.name || complaint.state || '',
        district: complaint.district?.name || complaint.district || '',
        landmark: complaint.landmark || ''
      }
    });
    window.dispatchEvent(event);
  }, [complaint]);

  // Auto trigger AI assistant if redirected after manual submission
  useEffect(() => {
    if (complaint) {
      const triggerId = sessionStorage.getItem('trigger_ai_assistance_for_complaint_id');
      if (triggerId && triggerId === id) {
        sessionStorage.removeItem('trigger_ai_assistance_for_complaint_id');
        handleTriggerAIEmail();
      }
    }
  }, [id, complaint, handleTriggerAIEmail]);

  /* ================================================================
     Loading State
     ================================================================ */
  if (isLoading) {
    return (
      <div className="page-container max-w-4xl">
        <div className="skeleton h-8 w-20 rounded mb-6" />
        <div className="card p-6 mb-5 space-y-4">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-5 w-24 rounded" />
            </div>
          ))}
        </div>
        <div className="card p-6 mb-5 space-y-3">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
        <div className="card p-6 space-y-3">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      </div>
    );
  }

  /* ================================================================
     Error State
     ================================================================ */
  if (error) {
    return (
      <div className="page-container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-12 text-center"
        >
          <HiExclamationTriangle className="mx-auto w-14 h-14 text-danger mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Complaint Not Found</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {error?.message || "The complaint you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <button onClick={() => navigate('/complaints')} className="btn btn-primary">
            <HiChevronLeft className="w-4 h-4" />
            Back to Complaints
          </button>
        </motion.div>
      </div>
    );
  }

  if (!complaint) return null;

  /* ── extracted fields ── */
  const {
    complaint_number, title, status, priority, department,
    category, description, created_at, updated_at,
  } = complaint;

  const statusBadge   = getStatusColor(status?.name || status);
  const priorityBadge = getPriorityColor(priority);

  /* ================================================================
     Render
     ================================================================ */
  return (
    <div className="page-container max-w-4xl">
      {/* ── back button ── */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost mb-5 -ml-2 text-sm">
          <HiChevronLeft className="w-5 h-5" />
          Back
        </button>
      </motion.div>

      {/* ── header ── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="card p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-mono font-bold text-gov-500 mb-1">
              #GOV-{String(complaint_number ?? id).padStart(3, '0')}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
              {title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${statusBadge}`}>{status?.name || status}</span>
              <span className={`badge ${priorityBadge}`}>{priority} priority</span>
            </div>
          </div>

          {/* AI email dispatch integration & owner actions */}
          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            <button
              onClick={handleTriggerAIEmail}
              className="btn btn-primary text-sm flex items-center gap-1.5"
            >
              <span className="text-base">📧</span>
              Dispatch Grievance Email via AI
            </button>
            {isOwner && (
              <>
                <Link
                  to={`/complaints/${id}/edit`}
                  className="btn btn-secondary text-sm"
                >
                  <HiPencilSquare className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn btn-danger text-sm"
                >
                  <HiTrash className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── info grid ── */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5"
      >
        <InfoCard icon={HiBuildingOffice2} label="Department" value={department || '—'} />
        <InfoCard icon={HiTag} label="Category" value={category || '—'} />
        <InfoCard icon={HiCalendarDays} label="Submitted" value={formatDate(created_at)} />
        <InfoCard icon={HiClock} label="Last Updated" value={formatRelativeTime(updated_at || created_at)} />
      </motion.div>

      {/* ── description ── */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="card p-6 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <HiDocumentText className="w-5 h-5 text-gov-600" />
          <h2 className="text-base font-semibold text-gray-800">Description</h2>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      </motion.div>

      {/* ── location ── */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="card p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <HiMapPin className="w-5 h-5 text-gov-600" />
          <h2 className="text-base font-semibold text-gray-800">Location</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {location.address  && <LocationField label="Address"  value={location.address} />}
          {location.district && <LocationField label="District" value={location.district} />}
          {location.state    && <LocationField label="State"    value={location.state} />}
          {location.landmark && <LocationField label="Landmark" value={location.landmark} />}
          {location.latitude  && <LocationField label="Latitude"  value={String(location.latitude)} />}
          {location.longitude && <LocationField label="Longitude" value={String(location.longitude)} />}
        </div>

        {/* map placeholder */}
        <div className="w-full h-48 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
          <HiMapPin className="w-8 h-8 mb-2" />
          <p className="text-sm font-medium">Map View</p>
          <p className="text-xs">
            {location.latitude && location.longitude
              ? `${location.latitude}, ${location.longitude}`
              : 'Coordinates not available'}
          </p>
        </div>
      </motion.div>

      {/* ── images ── */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="card p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <HiCamera className="w-5 h-5 text-gov-600" />
          <h2 className="text-base font-semibold text-gray-800">
            Images {images.length > 0 && <span className="text-gray-400 font-normal">({images.length})</span>}
          </h2>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <motion.div
                key={img.id ?? idx}
                whileHover={{ scale: 1.03 }}
                className="relative cursor-pointer group"
                onClick={() => setLightboxIdx(idx)}
              >
                <img
                  src={img.image ?? img.url ?? img}
                  alt={`Complaint image ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                  <HiEye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            <HiCamera className="mx-auto w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No images attached to this complaint</p>
          </div>
        )}
      </motion.div>

      {/* ── timeline ── */}
      {timeline.length > 0 && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="card p-6 mb-5">
          <div className="flex items-center gap-2 mb-5">
            <HiClock className="w-5 h-5 text-gov-600" />
            <h2 className="text-base font-semibold text-gray-800">Status Timeline</h2>
          </div>

          <div className="relative pl-6">
            {/* vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

            {timeline.map((entry, idx) => {
              const statusName = entry.new_status || entry.status || 'pending';
              const IconComponent = STATUS_ICONS[statusName.toLowerCase()] || HiInformationCircle;
              const isLast = idx === timeline.length - 1;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex gap-4 ${!isLast ? 'pb-6' : ''}`}
                >
                  {/* dot */}
                  <div className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                    isLast
                      ? 'bg-gov-600 border-gov-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <IconComponent className="w-3 h-3" />
                  </div>

                  {/* content */}
                  <div className="ml-4 flex-1">
                    <p className={`text-sm font-semibold ${isLast ? 'text-gov-700' : 'text-gray-700'}`}>
                      {statusName.replace(/_/g, ' ')}
                    </p>
                    {(entry.remarks || entry.comment) && (
                      <p className="text-xs text-gray-500 mt-0.5">{entry.remarks || entry.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(entry.created_at ?? entry.date)}
                      {' · '}
                      {formatRelativeTime(entry.created_at ?? entry.date)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── image lightbox ── */}
      <AnimatePresence>
        {lightboxIdx !== null && images[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              src={images[lightboxIdx].image ?? images[lightboxIdx].url ?? images[lightboxIdx]}
              alt="Enlarged view"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── delete confirmation modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
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
                  This action is permanent and cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
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
   Info Card — small stat card used in the info grid
   ==================================================================== */
function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-gov-500" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 capitalize">{value}</p>
    </div>
  );
}

/* ====================================================================
   Location Field — label + value pair
   ==================================================================== */
function LocationField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}
