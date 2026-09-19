"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Authentication failed. Please check your credentials.");
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0A0E13] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-indigo-400/20 font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,138,249,0.10),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.04),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.025)_1px,transparent_1px)] [background-size:28px_28px] opacity-25" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#7C8AF9] flex items-center justify-center text-white shadow-[0_10px_25px_rgba(124,138,249,0.25)] group-hover:scale-105 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 19.5H22L12 2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="12" cy="14" r="2.5" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-mono">
            NOVA
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-white mt-4 tracking-tight">
          Welcome back to Nova Workspace
        </h1>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm">
          Enter your engineering credentials.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0F1720] border border-[#1D2A35] rounded-2xl shadow-[0_22px_60px_rgba(2,6,23,0.52)] p-6 sm:p-8 relative z-10 backdrop-blur-xl">
        {error && (
          <div className="p-3 mb-5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="name@nova.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1117] border border-[#243243] text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#7C8AF9]/70 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#0B1117] border border-[#243243] text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-[#7C8AF9]/70 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7C8AF9] hover:bg-[#697BE8] text-white text-xs font-semibold shadow-[0_12px_25px_rgba(124,138,249,0.18)] transition-all disabled:opacity-50 mt-2"
          >
            <span>{isSubmitting ? "Authenticating..." : "Sign In to Workspace"}</span>
          </button>
        </form>



        {/* Footer */}
        <div className="mt-6 text-center text-xs text-neutral-400">
          Don't have a workspace?{" "}
          <Link href="/signup" className="text-indigo-300 hover:text-indigo-200 font-medium underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>

     
    </div>
  );
}
