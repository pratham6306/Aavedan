/**
 * @fileoverview Complaint React Query Hooks
 *
 * Custom hooks that wrap every complaint API call with TanStack React
 * Query for automatic caching, deduplication, background refetching,
 * and optimistic UI support.
 *
 * ## Query Key Conventions
 * | Hook               | Key                               |
 * |--------------------|-----------------------------------|
 * | useComplaints      | `['complaints', params]`          |
 * | useMyComplaints    | `['complaints', 'my', params]`    |
 * | useComplaint       | `['complaints', id]`              |
 *
 * Mutations automatically invalidate related queries on success so the
 * UI stays in sync with the server.
 *
 * @module hooks/useComplaints
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as complaintService from '../services/complaintService';

// ═══════════════════════════════════════════════════════════════════════════
// Query Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch a paginated, filterable list of all complaints.
 *
 * @param {Object}  [params]           - Query parameters forwarded to the API.
 * @param {string}  [params.search]    - Free-text search.
 * @param {string}  [params.status]    - Status filter.
 * @param {string}  [params.priority]  - Priority filter.
 * @param {number}  [params.page]      - Page number.
 * @param {string}  [params.ordering]  - Ordering field.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useComplaints = (params = {}) => {
  return useQuery({
    queryKey: ['complaints', params],
    queryFn: () => complaintService.getComplaints(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Fetch the authenticated user's own complaints.
 *
 * @param {Object} [params] - Same filter params as `useComplaints`.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useMyComplaints = (params = {}) => {
  return useQuery({
    queryKey: ['complaints', 'my', params],
    queryFn: () => complaintService.getMyComplaints(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60,
  });
};

/**
 * Fetch a single complaint by ID.
 *
 * The query is disabled when `id` is falsy, allowing conditional
 * fetching (e.g. wait for route params to resolve).
 *
 * @param {number|string|null} id - Complaint primary key.
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useComplaint = (id) => {
  return useQuery({
    queryKey: ['complaints', id],
    queryFn: () => complaintService.getComplaint(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// Mutation Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mutation hook for creating a new complaint.
 *
 * Invalidates all complaint list queries on success and shows a toast.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 *
 * @example
 * const { mutate: createComplaint, isPending } = useCreateComplaint();
 * createComplaint(formData, { onSuccess: (data) => navigate(`/complaints/${data.id}`) });
 */
export const useCreateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => complaintService.createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('Complaint submitted successfully!');
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to submit complaint. Please try again.';
      toast.error(message);
    },
  });
};

/**
 * Mutation hook for updating an existing complaint.
 *
 * Expects the mutate call to receive `{ id, data }`.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 *
 * @example
 * const { mutate: updateComplaint } = useUpdateComplaint();
 * updateComplaint({ id: 42, data: { status: 'resolved' } });
 */
export const useUpdateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => complaintService.updateComplaint(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({
        queryKey: ['complaints', variables.id],
      });
      toast.success('Complaint updated successfully!');
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to update complaint.';
      toast.error(message);
    },
  });
};

/**
 * Mutation hook for deleting a complaint.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 *
 * @example
 * const { mutate: deleteComplaint } = useDeleteComplaint();
 * deleteComplaint(42);
 */
export const useDeleteComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => complaintService.deleteComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('Complaint deleted successfully.');
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to delete complaint.';
      toast.error(message);
    },
  });
};

/**
 * Mutation hook for uploading images to a complaint.
 *
 * Expects the mutate call to receive `{ id, formData }` where
 * `formData` is a `FormData` instance containing the image files.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 *
 * @example
 * const { mutate: uploadImages } = useUploadImages();
 * const fd = new FormData();
 * fd.append('images', file);
 * uploadImages({ id: 42, formData: fd });
 */
export const useUploadImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }) =>
      complaintService.uploadImages(id, formData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['complaints', variables.id],
      });
      toast.success('Images uploaded successfully!');
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to upload images.';
      toast.error(message);
    },
  });
};

/**
 * Mutation hook for supporting/upvoting a complaint.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useSupportComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => complaintService.supportComplaint(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', id] });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        'Failed to support complaint.';
      toast.error(message);
    },
  });
};
