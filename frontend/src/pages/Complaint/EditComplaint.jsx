/**
 * EditComplaint.jsx — Edit Complaint Form
 * =============================================
 * Form for updating an existing government complaint.
 * Pre-populates all existing complaint metadata (Title, Description, Address,
 * Landmark, Category, Department, State, District, Map Coordinates) and submits
 * the updated values.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  HiMapPin,
  HiChevronLeft,
  HiExclamationTriangle,
  HiDocumentText,
  HiCog6Tooth,
} from 'react-icons/hi2';

import { useComplaint, useUpdateComplaint } from '../../hooks/useComplaints';
import { requiredRule } from '../../utils/validators';
import locationService from '../../services/locationService';
import complaintService from '../../services/complaintService';
import MapPicker from '../../components/MapPicker';
import LoadingSpinner from '../../components/layout/LoadingSpinner';

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function EditComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: complaint, isLoading: isComplaintLoading, error: loadError } = useComplaint(id);
  const { mutateAsync: updateComplaint, isPending: isUpdating } = useUpdateComplaint();

  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbDepartments, setDbDepartments] = useState([]);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 20.2961, lng: 85.8245 }); // Default Bhubaneswar

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      address: '',
      landmark: '',
      state: '',
      district: '',
      category: '',
      department: '',
      latitude: '',
      longitude: '',
    },
  });

  const selectedState = watch('state');
  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');

  // Load States list
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const data = await locationService.getStates();
        setDbStates(data);
      } catch (err) {
        console.error('Failed to fetch states', err);
      }
    };
    fetchStates();
  }, []);

  // Load categories & departments metadata list
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, depts] = await Promise.all([
          complaintService.getCategories(),
          complaintService.getDepartments(),
        ]);
        setDbCategories(cats);
        setDbDepartments(depts);
      } catch (err) {
        console.error('Failed to fetch categories/departments', err);
      }
    };
    fetchMetadata();
  }, []);

  // Sync state selection changes with district choices fetching
  useEffect(() => {
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
  }, [selectedState]);

  // Once complaint is fetched and metadata lists are available, resolve IDs and populate form
  useEffect(() => {
    if (!complaint || dbStates.length === 0 || dbCategories.length === 0 || dbDepartments.length === 0) {
      return;
    }

    const matchedState = dbStates.find((s) => s.name === complaint.state);
    const matchedCategory = dbCategories.find((c) => c.name === complaint.category);
    const matchedDepartment = dbDepartments.find((d) => d.name === complaint.department);

    const initialValues = {
      title: complaint.title || '',
      description: complaint.description || '',
      address: complaint.address || '',
      landmark: complaint.landmark || '',
      state: matchedState ? matchedState.id.toString() : '',
      category: matchedCategory ? matchedCategory.id.toString() : '',
      department: matchedDepartment ? matchedDepartment.id.toString() : '',
      latitude: complaint.latitude || '',
      longitude: complaint.longitude || '',
    };

    reset(initialValues);

    if (complaint.latitude && complaint.longitude) {
      setMapCenter({
        lat: parseFloat(complaint.latitude),
        lng: parseFloat(complaint.longitude),
      });
    }

    // If state resolved, load and match district
    if (matchedState) {
      locationService.getDistricts(matchedState.id)
        .then((districtsData) => {
          setDbDistricts(districtsData);
          const matchedDistrict = districtsData.find((d) => d.name === complaint.district);
          if (matchedDistrict) {
            setValue('district', matchedDistrict.id.toString());
          }
        })
        .catch((err) => console.error('Failed to fetch initial districts', err));
    }
  }, [complaint, dbStates, dbCategories, dbDepartments, reset, setValue]);

  const handleMapLocationSelect = useCallback((loc) => {
    setValue('address', loc.address || '');
    setValue('latitude', loc.latitude || '');
    setValue('longitude', loc.longitude || '');

    if (loc.state && dbStates.length > 0) {
      const matchedState = dbStates.find((s) => s.name.toLowerCase() === loc.state.toLowerCase());
      if (matchedState) {
        setValue('state', matchedState.id.toString());
        setLoadingLocations(true);
        locationService.getDistricts(matchedState.id)
          .then((districtsData) => {
            setDbDistricts(districtsData);
            if (loc.district) {
              const matchedDistrict = districtsData.find(
                (d) => d.name.toLowerCase() === loc.district.toLowerCase()
              );
              if (matchedDistrict) {
                setValue('district', matchedDistrict.id.toString());
              }
            }
          })
          .catch((err) => console.error(err))
          .finally(() => setLoadingLocations(false));
      }
    }
  }, [dbStates, setValue]);

  const onSubmit = async (formData) => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        landmark: formData.landmark,
        state: parseInt(formData.state),
        district: parseInt(formData.district),
        category: parseInt(formData.category),
        department: formData.department ? parseInt(formData.department) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      await updateComplaint({ id, data: payload });
      navigate(`/complaints/${id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save complaint changes.');
    }
  };

  if (isComplaintLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (loadError) {
    return (
      <div className="page-container max-w-4xl">
        <div className="card p-12 text-center">
          <HiExclamationTriangle className="mx-auto w-14 h-14 text-danger mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Complaint Load Failed</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {loadError?.message || "Could not retrieve the complaint details to edit."}
          </p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            <HiChevronLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2"
          >
            <HiChevronLeft className="w-4 h-4" />
            Back to Details
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Edit Complaint
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Update description, department choice, or location coordinates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column - Main Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Basic Info */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={0}
            className="card p-6 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
              <HiDocumentText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-800">Basic Information</h2>
            </div>

            <div className="space-y-1">
              <label htmlFor="title" className="form-label font-semibold text-gray-700">
                Complaint Title <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`input-field ${errors.title ? 'border-danger focus:ring-danger/20' : ''}`}
                placeholder="Give a brief summary of the issue (e.g. Broken Water Pipe)"
                {...register('title', requiredRule('Title'))}
              />
              {errors.title && <span className="text-xs text-danger font-medium mt-1 block">{errors.title.message}</span>}
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="form-label font-semibold text-gray-700">
                Detailed Description <span className="text-danger">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                className={`input-field min-h-[120px] ${errors.description ? 'border-danger focus:ring-danger/20' : ''}`}
                placeholder="Describe the complaint in detail so officials can understand..."
                {...register('description', requiredRule('Description'))}
              />
              {errors.description && <span className="text-xs text-danger font-medium mt-1 block">{errors.description.message}</span>}
            </div>
          </motion.div>

          {/* Section 2: Location Details */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={1}
            className="card p-6 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
              <HiMapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-800">Location Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="state" className="form-label font-semibold text-gray-700">
                  State <span className="text-danger">*</span>
                </label>
                <select
                  id="state"
                  className={`input-field ${errors.state ? 'border-danger' : ''}`}
                  {...register('state', requiredRule('State'))}
                >
                  <option value="">Select State</option>
                  {dbStates.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.state && <span className="text-xs text-danger font-medium mt-1 block">{errors.state.message}</span>}
              </div>

              <div className="space-y-1">
                <label htmlFor="district" className="form-label font-semibold text-gray-700">
                  District <span className="text-danger">*</span>
                </label>
                <select
                  id="district"
                  className={`input-field ${errors.district ? 'border-danger' : ''}`}
                  disabled={!selectedState || loadingLocations}
                  {...register('district', requiredRule('District'))}
                >
                  <option value="">Select District</option>
                  {dbDistricts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.district && <span className="text-xs text-danger font-medium mt-1 block">{errors.district.message}</span>}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="address" className="form-label font-semibold text-gray-700">
                Specific Address <span className="text-danger">*</span>
              </label>
              <input
                id="address"
                type="text"
                className={`input-field ${errors.address ? 'border-danger' : ''}`}
                placeholder="House No, Ward, Street Name..."
                {...register('address', requiredRule('Address'))}
              />
              {errors.address && <span className="text-xs text-danger font-medium mt-1 block">{errors.address.message}</span>}
            </div>

            <div className="space-y-1">
              <label htmlFor="landmark" className="form-label font-semibold text-gray-700">
                Nearby Landmark
              </label>
              <input
                id="landmark"
                type="text"
                className="input-field"
                placeholder="Opposite Central Park, Near Metro Station..."
                {...register('landmark')}
              />
            </div>

            <div className="space-y-2 mt-4">
              <label className="form-label font-semibold text-gray-700">
                Pin Location on Map
              </label>
              <div className="h-72 rounded-lg border border-gray-200 overflow-hidden relative">
                <MapPicker
                  center={mapCenter}
                  zoom={13}
                  onLocationSelect={handleMapLocationSelect}
                  initialMarker={{
                    lat: parseFloat(watchedLat) || null,
                    lng: parseFloat(watchedLng) || null,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>Latitude: {watchedLat || '—'}</div>
                <div>Longitude: {watchedLng || '—'}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Options & Actions */}
        <div className="space-y-6">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={2}
            className="card p-6 space-y-4 sticky top-6"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
              <HiCog6Tooth className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-800">Classification</h2>
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label htmlFor="category" className="form-label font-semibold text-gray-700">
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="category"
                className={`input-field ${errors.category ? 'border-danger' : ''}`}
                {...register('category', requiredRule('Category'))}
              >
                <option value="">Select Category</option>
                {dbCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category && <span className="text-xs text-danger font-medium mt-1 block">{errors.category.message}</span>}
            </div>

            {/* Department selection */}
            <div className="space-y-1">
              <label htmlFor="department" className="form-label font-semibold text-gray-700">
                Department
              </label>
              <select
                id="department"
                className="input-field"
                {...register('department')}
              >
                <option value="">Select Department (Optional)</option>
                {dbDepartments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <hr className="border-gray-100 my-4" />

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="btn btn-primary w-full justify-center"
              >
                {isUpdating ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost w-full justify-center"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
