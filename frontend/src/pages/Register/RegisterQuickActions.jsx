import { HiDocumentText, HiChartBar } from 'react-icons/hi2';

/**
 * RegisterQuickActions
 *
 * 4-icon row matching the Login page's quick-action section exactly:
 * circular icons, same colours, same borders, same text style, same hover.
 * AI Assistant card opens the AI chat drawer via onAIChatToggle prop.
 */
export default function RegisterQuickActions({ onAIChatToggle }) {
  return (
    <section className="absolute left-[40px] top-[410px] z-50">
      <div className="grid grid-cols-4 gap-4 max-w-[390px] select-none">

        {/* Submit Complaint */}
        <div className="flex flex-col items-center gap-2 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-indigo-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <HiDocumentText className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-slate-700 leading-none">Submit</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Complaint</span>
          </div>
        </div>

        {/* Track Status */}
        <div className="flex flex-col items-center gap-2 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-emerald-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <HiChartBar className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-slate-700 leading-none">Track</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Status</span>
          </div>
        </div>

        {/* Find Schemes */}
        <div className="flex flex-col items-center gap-2 cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-[#FFFBEB] border border-amber-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-slate-700 leading-none">Find</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Schemes</span>
          </div>
        </div>

        {/* AI Assistant */}
        <div
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => onAIChatToggle && onAIChatToggle()}
        >
          <div className="w-12 h-12 rounded-full bg-[#FDF4FF] border border-fuchsia-100 flex items-center justify-center shadow-xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
            <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-slate-700 leading-none">AI</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Assistant</span>
          </div>
        </div>

      </div>
    </section>
  );
}
