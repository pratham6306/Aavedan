/**
 * CreateComplaint.jsx — Create Complaint Form
 * =============================================
 * Multi-section form for submitting a new government complaint.
 *
 * Sections:
 *   1. Basic Info          — Title, Description
 *   2. Location Details    — Address, Landmark, State, District, Lat/Lng
 *   3. Options             — Anonymous toggle, Department
 *   4. Attachments         — Drag-and-drop multi-image upload (max 5)
 *
 * Uses React Hook Form for validation, Framer Motion for section
 * animations, and react-toastify for success/error feedback.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiPlusCircle,
  HiMapPin,
  HiCamera,
  HiTrash,
  HiChevronLeft,
  HiExclamationTriangle,
  HiDocumentText,
  HiCog6Tooth,
  HiPhoto,
} from 'react-icons/hi2';

import { useCreateComplaint, useUploadImages } from '../../hooks/useComplaints';
import { requiredRule } from '../../utils/validators';
import { departments } from '../../utils/helpers';
import locationService from '../../services/locationService';

/* ─── max images allowed ─── */
const MAX_IMAGES = 5;

/* ─── section animation ─── */
const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ====================================================================
   Component
   ==================================================================== */
export default function CreateComplaint() {
  const navigate = useNavigate();

  /* ── mutations ── */
  const { mutateAsync: createComplaint, isPending: isCreating } = useCreateComplaint();
  const { mutateAsync: uploadImages,   isPending: isUploading } = useUploadImages();

  /* ── form setup ── */
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      address: '',
      landmark: '',
      state: '',
      district: '',
      latitude: '',
      longitude: '',
      is_anonymous: false,
      department: '',
    },
  });

  /* ── image state ── */
  const [images, setImages]         = useState([]);   // File[]
  const [previews, setPreviews]     = useState([]);   // data-url strings
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  /* watched values */
  const selectedState = watch('state');
  const isAnonymous   = watch('is_anonymous');

  /* ── dynamic locations state ── */
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const statesData = await locationService.getStates();
        setDbStates(statesData);
      } catch (err) {
        console.error('Failed to fetch states', err);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    setValue('district', ''); // Clear stale district selection when state changes
    if (!selectedState) {
      setDbDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingLocations(true);
      try {
        const districtsData = await locationService.getDistricts(selectedState);
        setDbDistricts(districtsData);
      } catch (err) {
        console.error('Failed to fetch districts', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchDistricts();
  }, [selectedState, setValue]);

  /* ── image helpers ── */
  const addImages = useCallback((files) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.warning(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const toAdd = incoming.slice(0, remaining);
    if (incoming.length > toAdd.length) {
      toast.warning(`Only ${remaining} more image${remaining > 1 ? 's' : ''} can be added.`);
    }

    setImages((prev) => [...prev, ...toAdd]);

    /* generate previews */
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── drag-and-drop handlers ── */
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = ()  => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  };

  /* ── form submit ── */
  const onSubmit = async (formData) => {
    try {
      /* 1. Build flat complaint payload matching backend Serializer schema */
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        landmark: formData.landmark.trim() || undefined,
        state: parseInt(formData.state, 10),
        district: parseInt(formData.district, 10),
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        is_anonymous: formData.is_anonymous,
      };

      /* 2. Create complaint */
      const result = await createComplaint(payload);

      /* 3. Upload images if any */
      if (images.length > 0 && result?.id) {
        const fd = new FormData();
        images.forEach((img) => fd.append('images', img));
        await uploadImages({ id: result.id, data: fd });
      }

      toast.success('Complaint submitted successfully!');
      navigate('/my-complaints');
    } catch (err) {
      const errorData = err?.response?.data;
      let errMsg = 'Failed to submit complaint. Please try again.';
      if (typeof errorData === 'string') {
        errMsg = errorData;
      } else if (errorData?.detail) {
        errMsg = errorData.detail;
      } else if (errorData) {
        const fieldErrors = Object.entries(errorData)
          .map(([field, errors]) => {
            const msgs = Array.isArray(errors) ? errors.join(', ') : errors;
            return `${field}: ${msgs}`;
          })
          .join('; ');
        if (fieldErrors) errMsg = fieldErrors;
      }
      toast.error(errMsg);
    }
  };

  const isBusy = isCreating || isUploading;

  /* ================================================================
     Render
     ================================================================ */
  return (
    <div className="page-container max-w-3xl">
      {/* ── back + header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost mb-4 -ml-2 text-sm"
        >
          <HiChevronLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="page-title">Create New Complaint</h1>
        <p className="page-subtitle">
          Fill in the details below to submit your complaint to the appropriate department.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ────────────────────────────────────────────────────────
           Section 1 — Basic Information
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-5"
        >
          <SectionHeader icon={HiDocumentText} title="Basic Information" number={1} />

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="form-label">
              Complaint Title <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Brief summary of your complaint"
              className={`form-input ${errors.title ? 'form-input-error' : ''}`}
              {...register('title', {
                ...requiredRule('Title is required'),
                minLength: { value: 5, message: 'Title must be at least 5 characters' },
                maxLength: { value: 200, message: 'Title cannot exceed 200 characters' },
              })}
            />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="form-label">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Provide a detailed description of the issue…"
              className={`form-input resize-y min-h-[120px] ${errors.description ? 'form-input-error' : ''}`}
              {...register('description', {
                ...requiredRule('Description is required'),
                minLength: { value: 20, message: 'Description must be at least 20 characters' },
              })}
            />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>
        </motion.section>

        {/* ────────────────────────────────────────────────────────
           Section 2 — Location Details
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-5"
        >
          <SectionHeader icon={HiMapPin} title="Location Details" number={2} />

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address" className="form-label">Address</label>
            <input
              id="address"
              type="text"
              placeholder="Street address or area"
              className="form-input"
              {...register('address')}
            />
          </div>

          {/* Landmark */}
          <div className="mb-4">
            <label htmlFor="landmark" className="form-label">Landmark</label>
            <input
              id="landmark"
              type="text"
              placeholder="Nearby landmark"
              className="form-input"
              {...register('landmark')}
            />
          </div>

          {/* State + District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="state" className="form-label">State <span className="text-danger">*</span></label>
              <select
                id="state"
                className={`form-input ${errors.state ? 'form-input-error' : ''}`}
                {...register('state', requiredRule('State is required'))}
              >
                <option value="">Select State</option>
                {dbStates.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.state && <p className="form-error">{errors.state.message}</p>}
            </div>
            <div>
              <label htmlFor="district" className="form-label">District <span className="text-danger">*</span></label>
              <select
                id="district"
                className={`form-input ${errors.district ? 'form-input-error' : ''}`}
                disabled={!selectedState || loadingLocations}
                {...register('district', requiredRule('District is required'))}
              >
                <option value="">{loadingLocations ? 'Loading districts...' : 'Select District'}</option>
                {dbDistricts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.district && <p className="form-error">{errors.district.message}</p>}
            </div>
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="form-label">Latitude</label>
              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g. 28.6139"
                className={`form-input ${errors.latitude ? 'form-input-error' : ''}`}
                {...register('latitude', {
                  validate: (v) =>
                    !v || (parseFloat(v) >= -90 && parseFloat(v) <= 90) || 'Latitude must be between -90 and 90',
                })}
              />
              {errors.latitude && <p className="form-error">{errors.latitude.message}</p>}
            </div>
            <div>
              <label htmlFor="longitude" className="form-label">Longitude</label>
              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g. 77.2090"
                className={`form-input ${errors.longitude ? 'form-input-error' : ''}`}
                {...register('longitude', {
                  validate: (v) =>
                    !v || (parseFloat(v) >= -180 && parseFloat(v) <= 180) || 'Longitude must be between -180 and 180',
                })}
              />
              {errors.longitude && <p className="form-error">{errors.longitude.message}</p>}
            </div>
          </div>
        </motion.section>

        {/* ────────────────────────────────────────────────────────
           Section 3 — Options
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-5"
        >
          <SectionHeader icon={HiCog6Tooth} title="Options" number={3} />

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gov-50/50 border border-gov-100 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Submit Anonymously</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your identity will be hidden from public view
              </p>
            </div>
            <Controller
              name="is_anonymous"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-600 ${
                    field.value ? 'bg-gov-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-1 ${
                      field.value ? 'translate-x-6 ml-0' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="form-label">Department</label>
            <select
              id="department"
              className={`form-input ${errors.department ? 'form-input-error' : ''}`}
              {...register('department')}
            >
              <option value="">Select Department (optional)</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </motion.section>

        {/* ────────────────────────────────────────────────────────
           Section 4 — Images
           ──────────────────────────────────────────────────────── */}
        <motion.section
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="card p-6 mb-6"
        >
          <SectionHeader icon={HiPhoto} title="Attachments" number={4} />
          <p className="text-xs text-gray-500 mb-4">
            Upload up to {MAX_IMAGES} images to support your complaint (optional).
          </p>

          {/* drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-gov-500 bg-gov-50'
                : 'border-gray-300 hover:border-gov-400 hover:bg-gov-50/30'
            } ${images.length >= MAX_IMAGES ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => addImages(e.target.files)}
              className="hidden"
            />
            <HiCamera className="mx-auto w-10 h-10 text-gov-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop images here' : 'Drag & drop images or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP — max {MAX_IMAGES} images
            </p>
          </div>

          {/* image previews */}
          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4"
              >
                {previews.map((src, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <img
                      src={src}
                      alt={`Upload preview ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      <HiTrash className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── submit ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-end"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={isBusy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary min-w-[160px]"
            disabled={isBusy}
          >
            {isBusy ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isUploading ? 'Uploading Images…' : 'Submitting…'}
              </>
            ) : (
              <>
                <HiPlusCircle className="w-5 h-5" />
                Submit Complaint
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}

/* ====================================================================
   Section Header  — reusable mini-component
   ==================================================================== */
function SectionHeader({ icon: Icon, title, number }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-gov-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gov-700" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gov-500 uppercase tracking-wide">
          Step {number}
        </p>
        <h2 className="text-lg font-semibold text-gray-800 leading-tight">{title}</h2>
      </div>
    </div>
  );
}
