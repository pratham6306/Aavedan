import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import logo from "../../assets/logo.png";

export default function RegisterNavbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 h-16 flex items-center justify-between border-b border-amber-950/20 bg-gradient-to-r from-[#2d1b0d] via-[#1c0f05] to-[#2d1b0d] px-8 select-none">
      {/* Left (Logo and Brand Title Side-by-Side matching global Navbar.jsx exactly) */}
      <Link to="/" className="flex items-center gap-3 py-1.5 cursor-pointer">
        <img
          src={logo}
          alt="Logo"
          className="h-14 w-14 object-contain bg-white p-1.5 rounded-xl shadow-md border border-white/20"
        />
        <div className="flex flex-col">
          <span className="text-[19px] font-black text-white tracking-wider leading-tight">
            AAVEDAN-SETU
          </span>
          <span className="text-[9px] font-bold text-amber-200/70 leading-none mt-0.5">
            Your Gateway to Smart Governance
          </span>
        </div>
      </Link>

      {/* Right (Login / Register buttons matching global Navbar guest buttons exactly) */}
      <div className="flex items-center gap-2">
        <Link 
          to="/login" 
          className="px-5 py-2 text-[15px] bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-md hover:scale-[1.02] transition-all cursor-pointer"
        >
          Login
        </Link>
        <Link 
          to="/register" 
          className="px-5 py-2 text-[15px] bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-md hover:scale-[1.02] transition-all cursor-pointer"
        >
          Register
        </Link>
      </div>
    </nav>
  );
}
