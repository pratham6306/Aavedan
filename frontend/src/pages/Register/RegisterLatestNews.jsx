import { useState } from "react";
import { motion } from "framer-motion";
import RegisterNewsCard from "./RegisterNewsCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { newsArticles } from "../../utils/newsData";

export default function RegisterLatestNews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = 3;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < newsArticles.length - visibleCount) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const stepSize = 188; // 180px card width + 8px gap-2

  return (
    <section className="absolute left-[35px] top-[530px] z-30 flex gap-10">
      {/* Left Column (Title and Slider Buttons) */}
      <div className="w-[120px] flex-shrink-0">
        <h2 className="text-[#8c2323] text-3xl font-bold">
          Latest
        </h2>
        <h2 className="text-[#14295d] text-3xl font-black leading-none">
          Schemes
        </h2>
        <div className="flex gap-2.5 mt-5">
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all ${
              currentIndex === 0
                ? "bg-white text-gray-300 cursor-not-allowed opacity-50"
                : "bg-white text-[#14295d] hover:bg-gray-50 hover:scale-110 active:scale-95 cursor-pointer"
            }`}
            aria-label="Previous schemes"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= newsArticles.length - visibleCount}
            className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all ${
              currentIndex >= newsArticles.length - visibleCount
                ? "bg-purple-300 text-white cursor-not-allowed opacity-50"
                : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-110 active:scale-95 cursor-pointer"
            }`}
            aria-label="Next schemes"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Cards Slider Wrapper */}
      <div className="w-[560px] overflow-hidden">
        <motion.div
          className="flex gap-2"
          animate={{ x: -currentIndex * stepSize }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        >
          {newsArticles.map((item) => (
            <RegisterNewsCard
              key={item.id}
              {...item}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
