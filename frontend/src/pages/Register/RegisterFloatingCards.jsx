import aadhaar from "../../assets/aadhaar-card.png";
import ration from "../../assets/ration-card.png";
import ayushman from "../../assets/ayushman-card.png";

export default function RegisterFloatingCards() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Aadhaar Card */}
      <img
        src={aadhaar}
        alt="Aadhaar"
        className="
          absolute
          w-[150px]
          rounded-xl
          shadow-xl
          top-[90px]
          left-[430px]
          animate-float1
        "
      />

      {/* Ration Card */}
      <img
        src={ration}
        alt="Ration"
        className="
          absolute
          w-[150px]
          rounded-xl
          shadow-xl
          top-[170px]
          left-[640px]
          animate-float2
        "
      />

      {/* Ayushman Card */}
      <img
        src={ayushman}
        alt="Ayushman"
        className="
          absolute
          w-[150px]
          rounded-xl
          shadow-xl
          top-[340px]
          left-[450px]
          animate-float3
        "
      />
    </div>
  );
}
