"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
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

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
    setIsSubmitting(true);
    login(demoEmail, "password123").then((res) => {
      if (!res.success) {
        setError(res.error || "Login failed");
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#07080A] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-indigo-500/30 font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1E222D_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 19.5H22L12 2Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="12" cy="14" r="2.5" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-mono">
            NOVA<span className="text-indigo-400">_</span>
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-white mt-4 tracking-tight">
          Welcome back to Nova Workspace
        </h1>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm">
          Enter your engineering credentials or use 1-click demo access to enter your operating environment.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0F1117] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 backdrop-blur-xl">
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
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#161822] border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Password
              </label>
              <span className="text-[11px] text-neutral-500 font-mono">Demo: password123</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#161822] border border-white/10 text-white text-xs placeholder:text-neutral-600 focus:outline-hidden focus:border-indigo-500 transition-colors"
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 mt-2"
          >
            <span>{isSubmitting ? "Authenticating..." : "Sign In to Workspace"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Demo Quick Sign-In Section */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>1-Click Demo Sign-In</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Zero Setup</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("elena@nova.dev")}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors text-xs text-neutral-200 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                  ER
                </div>
                <div>
                  <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                    Elena Rostova
                  </div>
                  <div className="text-[10px] text-neutral-500">Lead Architect • elena@nova.dev</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 group-hover:text-white transition-colors">
                Sign In →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("marcus@nova.dev")}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors text-xs text-neutral-200 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                  MC
                </div>
                <div>
                  <div className="font-medium text-white group-hover:text-emerald-300 transition-colors">
                    Marcus Chen
                  </div>
                  <div className="text-[10px] text-neutral-500">Frontend Lead • marcus@nova.dev</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 group-hover:text-white transition-colors">
                Sign In →
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-neutral-400">
          Don't have a workspace?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>

      {/* Security Tag */}
      <div className="mt-8 flex items-center gap-2 text-[11px] font-mono text-neutral-600 relative z-10">
        <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
        <span>TLS 1.3 Encrypted Session • Zero-Trust Access Mesh</span>
      </div>
    </div>
  );
}
