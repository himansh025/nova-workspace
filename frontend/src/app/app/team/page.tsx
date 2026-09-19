"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X, ArrowUpRight } from "lucide-react";
import { TeamMember } from "@/server/types";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.team) setTeam(data.team);
    } catch (err) {
      console.error("Failed to load team", err);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, email })
      });
      const data = await res.json();
      if (data.member) {
        setTeam([...team, data.member]);
        setIsModalOpen(false);
        setName("");
        setRole("");
        setEmail("");
      }
    } catch (err) {
      console.error("Failed to add member", err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-neutral-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Engineering Squad</h1>
            <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {team.length} Engineers
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Core contributors, distributed architects, and active workload distribution
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Contributor</span>
        </button>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="p-5 rounded-xl bg-[#14161D] border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center font-bold text-white text-xs">
                  {member.initials}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{member.name}</h3>
                  <p className="text-xs text-neutral-400">{member.role}</p>
                </div>
              </div>

              <span
                className={`w-2 h-2 rounded-full ${
                  member.status === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : member.status === "away"
                    ? "bg-amber-400"
                    : "bg-neutral-500"
                }`}
                title={`Status: ${member.status}`}
              />
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Active Assigned Issues</span>
                <span className="font-mono text-white font-medium">
                  {member.activeTasksCount} tasks
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Direct Contact</span>
                <span className="font-mono text-neutral-400 text-[11px] truncate max-w-[140px]">
                  {member.email}
                </span>
              </div>
            </div>

            <Link
              href={`/app/tasks`}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
            >
              <span>View Assigned Issues</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>

      {/* Add Contributor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#14161D] border border-white/15 rounded-xl shadow-2xl p-5 z-10 text-xs text-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-sm font-semibold text-white">Add Team Contributor</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Engineering Role</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Distributed Systems Engineer"
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@nova.dev"
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium"
                >
                  Add Engineer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
