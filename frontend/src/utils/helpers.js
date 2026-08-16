/**
 * @fileoverview Shared Utility Helpers
 *
 * A collection of pure utility functions and static reference data used
 * throughout the Government Complaint Platform frontend.
 *
 * Includes:
 *  - Date / time formatting
 *  - Status & priority → CSS class mapping
 *  - Text helpers (truncation, initials, className merge)
 *  - Reference arrays (Indian states, departments, complaint statuses)
 *
 * @module utils/helpers
 */

// ═══════════════════════════════════════════════════════════════════════════
// Image URL Resolution
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolves media image path to relative Vite proxy URL.
 * @param {string} imgSrc
 * @returns {string}
 */
export const resolveImageUrl = (imgSrc) => {
  if (!imgSrc) return '';
  if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://') || imgSrc.startsWith('data:')) {
    return imgSrc;
  }
  if (imgSrc.startsWith('/media/')) {
    return imgSrc;
  }
  if (imgSrc.startsWith('media/')) {
    return `/${imgSrc}`;
  }
  return `/media/${imgSrc}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// Date & Time
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format an ISO date string into a human-readable format.
 *
 * @param {string} dateString - ISO 8601 date string.
 * @returns {string} Formatted date, e.g. "09 Jul 2026, 11:30 PM".
 *
 * @example
 * formatDate('2026-07-09T18:00:00Z'); // → "09 Jul 2026, 11:30 PM"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Convert an ISO date string into a relative time description.
 *
 * Uses the `Intl.RelativeTimeFormat` API for locale-aware output such as
 * "2 hours ago", "3 days ago", etc. Falls back to the absolute date for
 * anything older than 30 days.
 *
 * @param {string} dateString - ISO 8601 date string.
 * @returns {string} Relative time string.
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600_000).toISOString());
 * // → "1 hour ago"
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffSeconds < 60) return rtf.format(-diffSeconds, 'second');
  if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  if (diffDays < 30) return rtf.format(-diffDays, 'day');

  // Fallback to absolute date for older items.
  return formatDate(dateString);
};

// ═══════════════════════════════════════════════════════════════════════════
// Status & Priority → CSS Classes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map a complaint status to the appropriate CSS badge class and label.
 *
 * Uses the custom utility classes defined in index.css:
 * `.badge-pending`, `.badge-resolved`, `.badge-review`, `.badge-rejected`.
 *
 * @param {string} status - Status key from the backend.
 * @returns {{ className: string, label: string }} Badge CSS class and display label.
 *
 * @example
 * getStatusColor('pending'); // → { className: 'badge badge-pending', label: 'Pending' }
 */
export const getStatusColor = (status) => {
  const normalized = (status || '').toLowerCase().trim();
  const map = {
    pending:      { className: 'badge badge-pending',  label: 'Pending' },
    review:       { className: 'badge badge-review',   label: 'Under Review' },
    under_review: { className: 'badge badge-review',   label: 'Under Review' },
    in_progress:  { className: 'badge badge-review',   label: 'In Progress' },
    resolved:     { className: 'badge badge-resolved', label: 'Resolved' },
    rejected:     { className: 'badge badge-rejected', label: 'Rejected' },
    closed:       { className: 'badge badge-resolved', label: 'Closed' },
  };

  return map[normalized] || { className: 'badge badge-pending', label: status || 'Unknown' };
};

/**
 * Map a complaint priority to the appropriate CSS badge class and label.
 *
 * Uses `.badge-high`, `.badge-medium`, `.badge-low` from index.css.
 *
 * @param {string} priority - Priority key from the backend.
 * @returns {{ className: string, label: string }} Badge CSS class and display label.
 *
 * @example
 * getPriorityColor('high'); // → { className: 'badge badge-high', label: 'High' }
 */
export const getPriorityColor = (priority) => {
  const map = {
    high:   { className: 'badge badge-high',   label: 'High' },
    medium: { className: 'badge badge-medium', label: 'Medium' },
    low:    { className: 'badge badge-low',    label: 'Low' },
  };

  return map[priority] || { className: 'badge badge-medium', label: priority || 'Normal' };
};

// ═══════════════════════════════════════════════════════════════════════════
// Text Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 *
 * @param {string} text      - Source text.
 * @param {number} maxLength - Maximum character count (default 100).
 * @returns {string} Truncated text.
 *
 * @example
 * truncateText('Hello World', 5); // → "Hello…"
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength)}…`;
};

/**
 * Extract up to two initials from a full name.
 *
 * @param {string} name - Full name string.
 * @returns {string} Uppercase initials (e.g. "JS" for "John Smith").
 *
 * @example
 * getInitials('Rahul Kumar'); // → "RK"
 */
export const getInitials = (name) => {
  if (!name) return '';

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

/**
 * Conditionally join CSS class names, filtering out falsy values.
 *
 * A lightweight alternative to the `classnames` / `clsx` packages.
 *
 * @param {...(string|boolean|null|undefined)} classes - Class names or falsy values.
 * @returns {string} Space-separated class string.
 *
 * @example
 * classNames('btn', isActive && 'btn-primary', null); // → "btn btn-primary"
 */
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// ═══════════════════════════════════════════════════════════════════════════
// Reference Data
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List of all Indian states and union territories.
 * Used for dropdown / select inputs throughout the platform.
 *
 * @type {string[]}
 */
export const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

/**
 * List of major Indian government departments commonly associated
 * with public complaints and welfare schemes.
 *
 * @type {string[]}
 */
export const departments = [
  'Agriculture & Farmers Welfare',
  'Commerce & Industry',
  'Consumer Affairs',
  'Defence',
  'Education',
  'Electronics & IT',
  'Environment & Forests',
  'Finance',
  'Food & Public Distribution',
  'Health & Family Welfare',
  'Home Affairs',
  'Housing & Urban Affairs',
  'Information & Broadcasting',
  'Jal Shakti (Water Resources)',
  'Labour & Employment',
  'Law & Justice',
  'Micro, Small & Medium Enterprises',
  'Panchayati Raj',
  'Petroleum & Natural Gas',
  'Power & Energy',
  'Railways',
  'Road Transport & Highways',
  'Rural Development',
  'Science & Technology',
  'Skill Development & Entrepreneurship',
  'Social Justice & Empowerment',
  'Telecommunications',
  'Tribal Affairs',
  'Urban Development',
  'Women & Child Development',
  'Youth Affairs & Sports',
];

/**
 * Canonical list of complaint statuses with their display labels and
 * descriptions. Useful for populating filter dropdowns.
 *
 * @type {Array<{ value: string, label: string, description: string }>}
 */
export const complaintStatuses = [
  {
    value: 'pending',
    label: 'Pending',
    description: 'Complaint has been submitted and is awaiting department action.',
  },
  {
    value: 'under_review',
    label: 'Under Review',
    description: 'Resolution proof submitted; pending citizen verification.',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    description: 'Complaint has been resolved and verified successfully.',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    description: 'Complaint or resolution proof has been rejected.',
  },
];
