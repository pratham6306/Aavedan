import { useParams, useNavigate } from "react-router-dom";
import { HiArrowLeft, HiCalendar, HiClock, HiShare } from "react-icons/hi2";
import { newsArticles } from "../../utils/newsData";

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find the matching article
  const article = newsArticles.find((item) => item.id === id);

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-4">Article Not Found</h1>
        <p className="text-slate-600 mb-8 max-w-md">
          The news article you are looking for does not exist or has been archived.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="btn px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          Back to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/10 py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-amber-900 font-semibold text-sm hover:text-amber-700 transition cursor-pointer bg-transparent border-0 outline-none"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back to Portal
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Article link copied to clipboard!");
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200"
          >
            <HiShare className="w-3.5 h-3.5" />
            Share
          </button>
        </div>

        {/* Article Body */}
        <article className="bg-white rounded-3xl border border-amber-200/20 shadow-xl overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden bg-slate-100">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {/* Soft overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
            <div className="absolute bottom-6 left-6 md:left-8">
              <span className="inline-block text-xs font-bold bg-amber-400 text-amber-950 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                Official Update
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                {article.title}
              </h1>
            </div>
          </div>

          {/* Meta Info & Content */}
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-6 border-b border-slate-100 pb-6 mb-8 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <HiCalendar className="w-4 h-4 text-amber-600" />
                {article.date}
              </span>
              <span className="flex items-center gap-1.5">
                <HiClock className="w-4 h-4 text-amber-600" />
                Published recently
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                Verified News
              </span>
            </div>

            {/* Sub-description / Highlights */}
            <p className="text-lg font-bold text-slate-800 leading-relaxed mb-6 border-l-4 border-amber-500 pl-4">
              {article.shortDescription}
            </p>

            {/* Detailed Body paragraphs */}
            <div className="prose max-w-none text-slate-700 text-[15px] leading-relaxed space-y-6">
              <p>{article.description}</p>
              <p>
                As part of the government's digital consolidation project, citizens can access this and other upcoming services directly through the new unified Aavedan-Setu portal. The system has been optimized to handle high volumes of concurrent applications while ensuring strict compliance with local data integrity rules.
              </p>
              <p>
                Interested citizens are advised to check the schemes portal regularly to stay updated on implementation dates, registration fees, and step-by-step verification guidelines. For technical support or inquiries, please contact our dedicated assistance team via the toll-free helpline number listed at the footer of the portal page.
              </p>
            </div>
          </div>
        </article>

        {/* Read More / Next articles */}
        <div className="mt-12 pt-8 border-t border-slate-200/60">
          <h3 className="text-lg font-bold text-[#081F4D] mb-6">More Latest News</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {newsArticles
              .filter((item) => item.id !== id)
              .slice(0, 2)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/news/${item.id}`)}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-300/30 transition duration-300 cursor-pointer flex gap-4 items-center"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#081F4D] line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
