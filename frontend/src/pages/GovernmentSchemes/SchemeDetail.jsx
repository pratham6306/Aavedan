/**
 * SchemeDetail.jsx
 * ================
 * Full detail view for a single government scheme.
 *
 * Sections:
 *  – Header (name, department badge)
 *  – Description
 *  – Benefits (check-icon list)
 *  – Eligibility (list)
 *  – Required Documents (document-icon list)
 *  – Metadata (department, state, website)
 *  – "Apply Now" CTA
 *  – Share button
 *  – Related schemes (if any)
 *
 * States: loading skeleton, error, and fully rendered detail.
 */

import React, { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiArrowLeft,
  HiCheckCircle,
  HiDocumentText,
  HiBuildingOffice2,
  HiMapPin,
  HiArrowTopRightOnSquare,
  HiShare,
  HiGlobeAlt,
  HiClipboardDocumentList,
  HiShieldCheck,
  HiListBullet,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { toast } from 'react-toastify';

import { useScheme, useSchemes } from '../../hooks/useSchemes';
import { truncateText } from '../../utils/helpers';

/* ──────────────── Animation Variants ──────────────── */
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

/* ──────────────── Skeleton Loader ──────────────── */
const DetailSkeleton = () => (
  <div className="page-container animate-pulse">
    {/* Back button placeholder */}
    <div className="skeleton h-4 w-28 rounded mb-8" />

    {/* Header */}
    <div className="card p-8 mb-6">
      <div className="skeleton h-7 w-3/5 rounded mb-4" />
      <div className="skeleton h-5 w-1/4 rounded-full mb-6" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-4/6 rounded" />
      </div>
    </div>

    {/* Sections */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="card p-6">
          <div className="skeleton h-5 w-1/3 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((l) => (
              <div key={l} className="skeleton h-4 w-full rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ──────────────── Error State ──────────────── */
const ErrorState = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="page-container"
  >
    <Link to="/schemes" className="btn btn-ghost mb-6 inline-flex items-center gap-1.5 text-sm">
      <HiArrowLeft className="w-4 h-4" /> Back to Schemes
    </Link>

    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-danger-light flex items-center justify-center mb-5">
        <HiExclamationTriangle className="w-10 h-10 text-danger" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Scheme not found</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {message || 'The scheme you are looking for does not exist or has been removed.'}
      </p>
      <Link to="/schemes" className="btn btn-primary">
        Browse All Schemes
      </Link>
    </div>
  </motion.div>
);

/* ──────────────── Section Card ──────────────── */
/**
 * Reusable wrapper for each detail section — adds consistent
 * styling, icon, and staggered animation.
 */
const SectionCard = ({ icon: Icon, title, index, children, className = '' }) => (
  <motion.section
    custom={index}
    variants={sectionVariants}
    initial="hidden"
    animate="visible"
    className={`card p-6 ${className}`}
  >
    <h2 className="flex items-center gap-2 text-base font-bold text-gov-800 mb-4">
      <Icon className="w-5 h-5 text-gov-500" />
      {title}
    </h2>
    {children}
  </motion.section>
);

/* ──────────────── Related Scheme Card ──────────────── */
const RelatedSchemeCard = ({ scheme }) => (
  <Link
    to={`/schemes/${scheme.id}`}
    className="card card-hover p-4 block"
  >
    <h4 className="text-sm font-semibold text-gov-800 mb-1 line-clamp-2">
      {scheme.scheme_name || scheme.title || scheme.name}
    </h4>
    {scheme.department && (
      <span className="badge badge-review text-[10px]">
        {scheme.department?.name || scheme.department}
      </span>
    )}
    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
      {truncateText(scheme.description, 80)}
    </p>
  </Link>
);

/* ════════════════════════════════════════════════
   ███  SchemeDetail — Main Component            ███
   ════════════════════════════════════════════════ */
const SchemeDetail = () => {
  const { id } = useParams();

  /* Fetch scheme detail */
  const { data: scheme, isLoading, error } = useScheme(id);

  /* Fetch related schemes (same department) — only when scheme is loaded */
  const { data: relatedData } = useSchemes(
    scheme?.department
      ? { department: scheme.department.name || scheme.department, page_size: 4 }
      : undefined,
    { enabled: !!scheme?.department }
  );

  /* Filter out current scheme from related list */
  const relatedSchemes = (relatedData?.results ?? []).filter(
    (s) => String(s.id) !== String(id)
  ).slice(0, 3);

  /* ── Share handler ─── */
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = scheme?.title || scheme?.name || 'Government Scheme';

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch {
      /* User cancelled share dialog — ignore */
    }
  }, [scheme]);

  /* ── Loading / Error states ─── */
  if (isLoading) return <DetailSkeleton />;
  if (error || !scheme) return <ErrorState message={error?.message} />;

  /* ── Helpers to normalise array-or-null fields ─── */
  // Safe helper to parse strings/lists into clean arrays of lines
  const parseToList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^([•\-*\s]+|\d+[\.\)]\s*)/, '').trim())
        .filter((line) => line.length > 0);
    }
    return [];
  };

  const benefits = parseToList(scheme.benefits);
  const eligibility = parseToList(scheme.eligibility);
  const documents = scheme.required_documents ?? scheme.documents ?? [];

  /* Section counter for stagger animation */
  let sectionIdx = 0;

  /* ── Render ─── */
  return (
    <div className="page-container pb-16">
      {/* ── Back link ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/schemes"
          className="btn btn-ghost inline-flex items-center gap-1.5 text-sm mb-6"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back to Schemes
        </Link>
      </motion.div>

      {/* ── Hero / Header ──────────────────────── */}
      <motion.div
        custom={sectionIdx++}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="glass-card p-6 md:p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Title & badge */}
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gov-900 leading-snug mb-3">
              {scheme.scheme_name || scheme.title || scheme.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              {scheme.department && (
                <span className="badge badge-review">
                  <HiBuildingOffice2 className="w-3.5 h-3.5 mr-1" />
                  {scheme.department?.name || scheme.department}
                </span>
              )}
              {scheme.category && (
                <span className="badge bg-gov-100 text-gov-700">
                  {scheme.category?.name || scheme.category}
                </span>
              )}
              {scheme.state && (
                <span className="badge bg-surface-alt text-gray-600">
                  <HiMapPin className="w-3 h-3 mr-1" />
                  {scheme.state}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleShare} className="btn btn-secondary">
              <HiShare className="w-4 h-4" />
              Share
            </button>

            {(scheme.application_link || scheme.official_website) && (
              <a
                href={scheme.application_link || scheme.official_website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Apply Now
                <HiArrowTopRightOnSquare className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Description ────────────────────────── */}
      <motion.section
        custom={sectionIdx++}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="card p-6 md:p-8 mb-8"
      >
        <h2 className="flex items-center gap-2 text-base font-bold text-gov-800 mb-3">
          <HiClipboardDocumentList className="w-5 h-5 text-gov-500" />
          About this Scheme
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {scheme.description}
        </p>
      </motion.section>

      {/* ── Two-column details grid ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Benefits */}
        {benefits.length > 0 && (
          <SectionCard icon={HiCheckCircle} title="Benefits" index={sectionIdx++}>
            <ul className="space-y-2.5">
              {benefits.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <HiCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{typeof item === 'string' ? item : item.description || item.text}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Eligibility */}
        {eligibility.length > 0 && (
          <SectionCard icon={HiShieldCheck} title="Eligibility" index={sectionIdx++}>
            <ul className="space-y-2.5">
              {eligibility.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <HiListBullet className="w-4 h-4 text-gov-500 shrink-0 mt-0.5" />
                  <span>{typeof item === 'string' ? item : item.description || item.text}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Required Documents */}
        {documents.length > 0 && (
          <SectionCard icon={HiDocumentText} title="Required Documents" index={sectionIdx++}>
            <ul className="space-y-2.5">
              {documents.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <HiDocumentText className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>{typeof item === 'string' ? item : item.document_name || item.name || item.text}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Scheme Metadata */}
        <SectionCard icon={HiBuildingOffice2} title="Scheme Information" index={sectionIdx++}>
          <dl className="space-y-3 text-sm">
            {scheme.department && (
              <div className="flex items-start gap-3">
                <dt className="text-gray-400 w-32 shrink-0 font-medium">Department</dt>
                <dd className="text-gray-700">{scheme.department?.name || scheme.department}</dd>
              </div>
            )}
            {scheme.state && (
              <div className="flex items-start gap-3">
                <dt className="text-gray-400 w-32 shrink-0 font-medium">State / Region</dt>
                <dd className="text-gray-700">{scheme.state}</dd>
              </div>
            )}
            {scheme.category && (
              <div className="flex items-start gap-3">
                <dt className="text-gray-400 w-32 shrink-0 font-medium">Category</dt>
                <dd className="text-gray-700">{scheme.category?.name || scheme.category}</dd>
              </div>
            )}
            {scheme.official_website && (
              <div className="flex items-start gap-3">
                <dt className="text-gray-400 w-32 shrink-0 font-medium">Official Site</dt>
                <dd>
                  <a
                    href={scheme.official_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gov-600 hover:text-gov-700 underline underline-offset-2 inline-flex items-center gap-1"
                  >
                    <HiGlobeAlt className="w-4 h-4" />
                    Visit Website
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </SectionCard>
      </div>

      {/* ── Related Schemes ────────────────────── */}
      {relatedSchemes.length > 0 && (
        <motion.section
          custom={sectionIdx++}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-base font-bold text-gov-800 mb-4">Related Schemes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedSchemes.map((s) => (
              <RelatedSchemeCard key={s.id} scheme={s} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default SchemeDetail;
