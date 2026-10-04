"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X, ArrowUpRight, LayoutGrid, List } from "lucide-react";
import { TeamMember } from "@/types";
import { TeamSkeleton } from "@/components/workspace/Skeletons";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selectedRows.size === team.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(team.map(m => m.id)));
    }
  };

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.team) setTeam(data.team);
    } catch (err) {
      console.error("Failed to load team", err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <TeamSkeleton />;
  }

  return (
    <div className="min-h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] p-4 rounded-lg shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--nova-text-primary)]">
              Engineering Squad
            </h1>
            <span className="text-xs font-mono text-[var(--nova-text-secondary)] bg-[var(--nova-deep)] px-2 py-0.5 rounded border border-[var(--nova-border)]">
              {team.length} Engineers
            </span>
          </div>
          <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
            Core contributors, distributed architects, and active workload distribution
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View mode toggle */}
          <div className="flex items-center bg-[var(--nova-deep)] p-0.5 rounded border border-[var(--nova-border)]">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1 rounded transition-colors ${viewMode === "card" ? "bg-[var(--nova-surface)] shadow-xs text-[var(--nova-text-primary)]" : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-secondary)]"}`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1 rounded transition-colors ${viewMode === "table" ? "bg-[var(--nova-surface)] shadow-xs text-[var(--nova-text-primary)]" : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-secondary)]"}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-xs font-medium shadow-xs transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contributor</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 flex flex-col justify-between space-y-4 hover:border-[var(--nova-border-strong)] transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--nova-accent-subtle)] text-[var(--nova-accent)] font-bold border border-[var(--nova-accent-border)] flex items-center justify-center text-xs">
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">{member.name}</h3>
                    <p className="text-xs text-[var(--nova-text-secondary)]">{member.role}</p>
                  </div>
                </div>

                <span
                  className={`w-2 h-2 rounded-full ${
                    member.status === "online"
                      ? "bg-[var(--nova-success)] animate-pulse"
                      : member.status === "away"
                      ? "bg-[var(--nova-warning)]"
                      : "bg-[var(--nova-text-muted)]"
                  }`}
                  title={`Status: ${member.status}`}
                />
              </div>

              <div className="p-3 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[var(--nova-text-secondary)]">
                  <span>Active Assigned Issues</span>
                  <span className="font-mono text-[var(--nova-text-primary)] font-medium">
                    {member.activeTasksCount} tasks
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--nova-text-secondary)]">
                  <span>Direct Contact</span>
                  <span className="font-mono text-[var(--nova-text-muted)] text-[11px] truncate max-w-[140px]">
                    {member.email}
                  </span>
                </div>
              </div>

              <Link
                href={`/app/tasks`}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-medium transition-colors duration-150"
              >
                <span>View Assigned Issues</span>
                <ArrowUpRight className="w-3 h-3 text-[var(--nova-text-secondary)]" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--nova-border)] bg-[var(--nova-deep)] text-[11px] uppercase tracking-wider text-[var(--nova-text-muted)]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.size > 0 && selectedRows.size === team.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedRows.size > 0 && selectedRows.size < team.length;
                      }
                    }}
                    onChange={toggleAll}
                    className="rounded border-[var(--nova-border)] bg-[var(--nova-surface)] checked:bg-[var(--nova-accent)] focus:ring-[var(--nova-accent)]"
                  />
                </th>
                <th className="py-3 px-4 font-medium">Engineer</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Contact</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Active Tasks</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[var(--nova-border)]">
              {team.map((member) => {
                const isSelected = selectedRows.has(member.id);
                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-[var(--nova-deep)] transition-colors ${isSelected ? "bg-[var(--nova-accent-subtle)]/50" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(member.id)}
                        className="rounded border-[var(--nova-border)] bg-[var(--nova-surface)] checked:bg-[var(--nova-accent)] focus:ring-[var(--nova-accent)]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-[var(--nova-accent-subtle)] text-[var(--nova-accent)] font-bold border border-[var(--nova-accent-border)] flex items-center justify-center text-[9px] shrink-0">
                          {member.initials}
                        </div>
                        <span className="font-semibold text-[var(--nova-text-primary)]">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--nova-text-secondary)]">{member.role}</td>
                    <td className="py-3 px-4 text-[var(--nova-text-muted)] font-mono text-[11px]">{member.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.status === "online"
                              ? "bg-[var(--nova-success)] animate-pulse"
                              : member.status === "away"
                              ? "bg-[var(--nova-warning)]"
                              : "bg-[var(--nova-text-muted)]"
                          }`}
                        />
                        <span className="capitalize text-[var(--nova-text-secondary)]">{member.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--nova-text-primary)]">
                      {member.activeTasksCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Contributor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--nova-surface)] border border-[var(--nova-border-strong)] rounded-xl shadow-2xl p-5 z-10 text-xs text-[var(--nova-text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--nova-border)] mb-4">
              <span className="text-sm font-semibold text-[var(--nova-text-primary)]">Add Team Contributor</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Engineering Role</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Distributed Systems Engineer"
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@nova.dev"
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--nova-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white font-medium text-xs transition-colors"
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
