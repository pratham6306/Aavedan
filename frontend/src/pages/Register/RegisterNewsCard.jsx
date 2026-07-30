import { Link } from "react-router-dom";

export default function RegisterNewsCard({
  id,
  image,
  title,
  date,
  description,
}) {
  return (
    <div className="w-[180px] bg-white/50 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-5 flex flex-col justify-between h-[230px]">
      <div>
        <div className="flex items-center gap-2">
          <img
            src={image}
            alt={title}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <h3 className="font-semibold text-[12px] text-[#1c2957] truncate w-[90px]" title={title}>
              {title}
            </h3>
            <p className="text-[10px] text-gray-500">
              {date}
            </p>
          </div>
        </div>

        <p className="mt-3 text-[13px] text-[#334155] leading-relaxed line-clamp-4">
          {description}
        </p>
      </div>

      <Link
        to={`/news/${id}`}
        className="mt-3 text-purple-600 font-bold text-[13px] hover:text-purple-800 transition flex items-center gap-1.5 self-start cursor-pointer"
      >
        Read More →
      </Link>
    </div>
  );
}
