import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Mail, Phone, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  emailRules,
  phoneRules,
  passwordRules,
  nameRules,
} from "../../utils/validators";

export default function RegisterCard() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const hasMinLength = passwordValue ? passwordValue.length >= 8 : false;
  const hasUppercase = passwordValue ? /[A-Z]/.test(passwordValue) : false;
  const hasLowercase = passwordValue ? /[a-z]/.test(passwordValue) : false;
  const hasNumber = passwordValue ? /\d/.test(passwordValue) : false;
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast.success("Account created successfully! Welcome aboard.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[380px] h-full max-h-[650px] rounded-[34px] bg-white/70 backdrop-blur-3xl border border-white/70 shadow-[0_40px_80px_rgba(0,0,0,.12)] overflow-hidden">
      <div className="h-full overflow-y-auto custom-scrollbar px-8 py-8 flex flex-col gap-5">
        {/* Heading */}
        <div className="flex flex-col select-none">
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            Welcome! 👋
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1.5">
            Create your Aavedan-Setu account to access all government services.
          </p>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-100 text-sm font-extrabold select-none">
          <span className="pb-2.5 px-4 text-violet-600 border-b-2 border-violet-600 cursor-default text-[15px]">
            Register
          </span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="pb-2.5 px-4 text-slate-400 hover:text-violet-600 transition text-[15px] cursor-pointer"
          >
            Login
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {/* Full Name */}
          <div className="flex flex-col">
            <label htmlFor="fullName" className="text-xs font-bold text-slate-600 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                className={`w-full py-4 pl-10 pr-4 text-[15px] bg-white border ${
                  errors.fullName ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                } rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                {...register("fullName", nameRules)}
              />
            </div>
            {errors.fullName && (
              <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label htmlFor="email" className="text-xs font-bold text-slate-600 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="example@abc.com"
                autoComplete="email"
                className={`w-full py-4 pl-10 pr-4 text-[15px] bg-white border ${
                  errors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                } rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                {...register("email", emailRules)}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col">
            <label htmlFor="phone" className="text-xs font-bold text-slate-600 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="phone"
                type="tel"
                placeholder="Enter your 10 digit phone number"
                autoComplete="tel"
                className={`w-full py-4 pl-10 pr-4 text-[15px] bg-white border ${
                  errors.phone ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                } rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                {...register("phone", phoneRules)}
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-bold text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={`w-full py-4 pl-10 pr-10 text-[15px] bg-white border ${
                  errors.password ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                } rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                {...register("password", passwordRules)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">{errors.password.message}</p>
            )}

            {passwordValue && (
              <div className="mt-2 p-3 bg-white/50 rounded-2xl border border-slate-100 text-[12px] space-y-2">
                <p className="font-bold text-slate-700">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={hasMinLength ? "text-emerald-500 font-bold" : "text-slate-300"}>{hasMinLength ? "✓" : "○"}</span>
                    <span className={hasMinLength ? "text-emerald-700 font-medium" : "text-slate-400"}>Min 8 chars</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasUppercase ? "text-emerald-500 font-bold" : "text-slate-300"}>{hasUppercase ? "✓" : "○"}</span>
                    <span className={hasUppercase ? "text-emerald-700 font-medium" : "text-slate-400"}>One uppercase</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasLowercase ? "text-emerald-500 font-bold" : "text-slate-300"}>{hasLowercase ? "✓" : "○"}</span>
                    <span className={hasLowercase ? "text-emerald-700 font-medium" : "text-slate-400"}>One lowercase</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={hasNumber ? "text-emerald-500 font-bold" : "text-slate-300"}>{hasNumber ? "✓" : "○"}</span>
                    <span className={hasNumber ? "text-emerald-700 font-medium" : "text-slate-400"}>One number</span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 font-medium">Strength:</span>
                    <span className={`font-semibold ${
                      strengthScore <= 1 ? "text-red-500" : strengthScore <= 3 ? "text-amber-500" : "text-emerald-600"
                    }`}>{strengthScore <= 1 ? "Weak" : strengthScore <= 3 ? "Medium" : "Strong"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${
                      strengthScore <= 1 ? "bg-red-500 w-[25%]" : strengthScore === 2 ? "bg-amber-400 w-[50%]" : strengthScore === 3 ? "bg-amber-500 w-[75%]" : "bg-emerald-500 w-[100%]"
                    }`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={`w-full py-4 pl-10 pr-10 text-[15px] bg-white border ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                } rounded-2xl outline-none focus:ring-4 transition-all text-slate-800 font-medium`}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === passwordValue || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-red-500 font-bold mt-1 pl-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ background: "linear-gradient(135deg,#6D28D9,#9333EA,#7C3AED)" }}
            className="w-full py-3.5 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 text-[15px] select-none mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Account…</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Already have an account */}
        <div className="text-center select-none">
          <span className="text-xs font-bold text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-extrabold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
            >
              Login Now
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
