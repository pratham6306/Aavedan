import { motion } from "framer-motion";
import aadhaarImg from "../../assets/aadhaar.jpg";
import rationImg from "../../assets/ration.jpg";
import ayushmanImg from "../../assets/ayushman.jpg";

export default function RegisterFloatingCards() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Aadhaar Card (Top Left) */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: [0, 2, -2, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[90px] left-[430px] w-[150px] shadow-2xl pointer-events-none z-10"
      >
        <img
          src={aadhaarImg}
          className="w-full h-auto rounded-xl border border-white/50"
          alt="Aadhaar Card"
        />
      </motion.div>

      {/* Ration Card (Middle Right) */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: [0, 2, -2, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[170px] left-[675px] w-[150px] shadow-2xl pointer-events-none z-10"
      >
        <img
          src={rationImg}
          className="w-full h-auto rounded-xl border border-white/50"
          alt="Ration Card"
        />
      </motion.div>

      {/* Ayushman Card (Bottom Left) */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: [0, 2, -2, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[340px] left-[450px] w-[150px] shadow-2xl pointer-events-none z-10"
      >
        <img
          src={ayushmanImg}
          className="w-full h-auto rounded-xl border border-white/50"
          alt="Ayushman Card"
        />
      </motion.div>
    </div>
  );
}
