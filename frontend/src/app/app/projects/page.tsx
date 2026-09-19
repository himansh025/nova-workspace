"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderKanban, Plus, GitBranch, ArrowUpRight, X, Layers, Clock } from "lucide-react";
import { Project } from "@/server/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sprint, setSprint] = useState("Sprint 1");
  const [repository, setRepository] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, sprint, repository })
      });
      const data = await res.json();
      if (data.project) {
        setProjects([...projects, data.project]);
        setIsModalOpen(false);
        setName("");
        setDescription("");
        setSprint("Sprint 1");
        setRepository("");
      }
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-neutral-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Project Workspaces</h1>
            <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {projects.length} Active
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Independent product repositories, git branch configurations, and sprint milestones
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-xl bg-[#14161D] border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[var(--color-accent)] uppercase px-2 py-0.5 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                  {p.sprint}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {p.velocity}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">{p.name}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                {p.description}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                    <span>{p.activeBranch}</span>
                  </span>
                  <span className="font-mono text-neutral-300 text-[11px]">{p.cycleTime} cycle</span>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                    <span>Progress</span>
                    <span>{p.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--color-accent)] h-full rounded-full"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <Link
                href={`/app/tasks?projectId=${p.id}`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
              >
                <span>Enter Project Workspace</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#14161D] border border-white/15 rounded-xl shadow-2xl p-5 z-10 text-xs text-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-sm font-semibold text-white">Create Project Workspace</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Distributed Vector Store"
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Architecture goals and engineering scope..."
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 text-[11px] mb-1">Sprint Milestone</label>
                  <input
                    type="text"
                    value={sprint}
                    onChange={(e) => setSprint(e.target.value)}
                    placeholder="Sprint 1"
                    className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 text-[11px] mb-1">Repository URL</label>
                  <input
                    type="text"
                    value={repository}
                    onChange={(e) => setRepository(e.target.value)}
                    placeholder="github.com/org/repo"
                    className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)]"
                  />
                </div>
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
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
