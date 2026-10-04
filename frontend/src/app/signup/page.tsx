"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Staff Backend Engineer");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const res = await signup({
      name,
      email,
      password,
      role,
      organization: organization || `${name.split(" ")[0]}'s Workspace`,
    });
    if (!res.success) {
      setError(res.error || "Registration failed. Please check your inputs.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans tech-grid">
      {/* Brand Header */}
      <div className="text-center mb-6 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <img
            src="/brand/logo-full-light.png"
            alt="Nova Workspace Logo"
            className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
          />
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--landing-text)] mt-4 tracking-tight">
          Create Your Engineering Workspace
        </h1>
        <p className="text-xs text-[var(--landing-text-muted)] mt-1 max-w-sm">
          Launch a collaborative operating system with Kanban boards, AI spec generators, and service topologies.
        </p>
      </div>

      {/* Main Signup Card */}
      <div className="w-full max-w-md bg-[var(--landing-surface)] border border-[var(--landing-border)] shadow-[0_12px_32px_rgba(23,23,23,0.06)] rounded-2xl p-6 sm:p-8 relative z-10">
        {error && (
          <div className="p-3 mb-5 rounded-lg bg-[var(--landing-primary-subtle)] border border-[var(--landing-primary-border)] text-[var(--landing-primary)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[var(--landing-text)] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[var(--landing-text-muted)] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--landing-bg)] border border-[var(--landing-border)] text-[var(--landing-text)] focus:border-[var(--landing-primary)] text-xs placeholder:text-[var(--landing-text-muted)] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--landing-text)] mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--landing-text-muted)] absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="alex@acme.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--landing-bg)] border border-[var(--landing-border)] text-[var(--landing-text)] focus:border-[var(--landing-primary)] text-xs placeholder:text-[var(--landing-text-muted)] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--landing-text)] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--landing-text-muted)] absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Minimum 8 characters"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--landing-text)] mb-1">
                Engineering Role
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--landing-bg)] border border-[var(--landing-border)] text-[var(--landing-text)] focus:border-[var(--landing-primary)] text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Lead Architect">Lead Architect</option>
                  <option value="Staff Backend Engineer">Backend Engineer</option>
                  <option value="Staff Frontend Engineer">Frontend Engineer</option>
                  <option value="DevOps & SRE">DevOps & SRE</option>
                  <option value="Security Lead">Security Lead</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--landing-text)] mb-1">
                Organization Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[var(--landing-text-muted)] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Acme Labs"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--landing-bg)] border border-[var(--landing-border)] text-[var(--landing-text)] focus:border-[var(--landing-primary)] text-xs placeholder:text-[var(--landing-text-muted)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? "Creating Workspace..." : "Create Engineering Account"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-5 text-center text-xs text-[var(--landing-text-muted)]">
          Already have an engineering workspace?{" "}
          <Link href="/login" className="text-[var(--landing-primary)] hover:text-[var(--landing-primary-hover)] font-medium underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
