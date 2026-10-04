"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
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
    <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans tech-grid">
      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <img
            src="/brand/logo-full-light.png"
            alt="Nova Workspace Logo"
            className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
          />
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--landing-text)] mt-4 tracking-tight">
          Welcome back to Nova Workspace
        </h1>
        <p className="text-xs text-[var(--landing-text-muted)] mt-1 max-w-sm">
          Enter your engineering credentials.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[var(--landing-surface)] border border-[var(--landing-border)] shadow-[0_12px_32px_rgba(23,23,23,0.06)] rounded-2xl p-6 sm:p-8 relative z-10">
        {error && (
          <div className="p-3 mb-5 rounded-lg bg-[var(--landing-primary-subtle)] border border-[var(--landing-primary-border)] text-[var(--landing-primary)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--landing-text)] mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--landing-text-muted)] absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="name@nova.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--landing-bg)] border border-[var(--landing-border)] text-[var(--landing-text)] focus:border-[var(--landing-primary)] text-xs placeholder:text-[var(--landing-text-muted)] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[var(--landing-text)]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--landing-text-muted)] absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--landing-bg)] border border-[var(--landing-border)] text-[var(--landing-text)] focus:border-[var(--landing-primary)] text-xs placeholder:text-[var(--landing-text-muted)] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[var(--landing-text-muted)] hover:text-[var(--landing-text)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{isSubmitting ? "Authenticating..." : "Sign In to Workspace"}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[var(--landing-text-muted)]">
          Don't have a workspace?{" "}
          <Link href="/signup" className="text-[var(--landing-primary)] hover:text-[var(--landing-primary-hover)] font-medium underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
