"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderKanban, Plus, GitBranch, ArrowUpRight, X, Layers, Clock } from "lucide-react";
import { Project } from "@/types";
import { ProjectsSkeleton } from "@/components/workspace/Skeletons";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
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

  if (loading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="min-h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] p-4 rounded-lg shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--nova-text-primary)]">
              Project Workspaces
            </h1>
            <span className="text-xs font-mono text-[var(--nova-text-secondary)] bg-[var(--nova-deep)] px-2 py-0.5 rounded border border-[var(--nova-border)]">
              {projects.length} Active
            </span>
          </div>
          <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
            Independent product repositories, git branch configurations, and sprint milestones
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-xs font-medium shadow-xs transition-colors duration-150 self-start sm:self-auto"
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
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 flex flex-col justify-between space-y-4 hover:border-[var(--nova-border-strong)] transition-all shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[var(--nova-accent)] uppercase px-2 py-0.5 rounded bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] font-medium">
                  {p.sprint}
                </span>
                <span className="text-[10px] font-mono text-[var(--nova-success-text)] font-semibold">
                  {p.velocity}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--nova-text-primary)] mb-1.5">{p.name}</h3>
              <p className="text-xs text-[var(--nova-text-secondary)] leading-relaxed line-clamp-2">
                {p.description}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[var(--nova-text-secondary)]">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <GitBranch className="w-3.5 h-3.5 text-[var(--nova-info)]" />
                    <span>{p.activeBranch}</span>
                  </span>
                  <span className="font-mono text-[var(--nova-text-secondary)] text-[11px]">{p.cycleTime} cycle</span>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-[var(--nova-text-muted)]">
                    <span>Progress</span>
                    <span>{p.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[var(--nova-surface)] border border-[var(--nova-border-muted)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--nova-accent)] h-full rounded-full"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <Link
                href={`/app/tasks?projectId=${p.id}`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-medium transition-colors duration-150"
              >
                <span>Enter Project Workspace</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--nova-text-secondary)]" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--nova-surface)] border border-[var(--nova-border-strong)] rounded-xl shadow-2xl p-5 z-10 text-xs text-[var(--nova-text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--nova-border)] mb-4">
              <span className="text-sm font-semibold text-[var(--nova-text-primary)]">Create Project Workspace</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Distributed Vector Store"
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Architecture goals and engineering scope..."
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] resize-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Sprint Milestone</label>
                  <input
                    type="text"
                    value={sprint}
                    onChange={(e) => setSprint(e.target.value)}
                    placeholder="Sprint 1"
                    className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Repository URL</label>
                  <input
                    type="text"
                    value={repository}
                    onChange={(e) => setRepository(e.target.value)}
                    placeholder="github.com/org/repo"
                    className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] text-xs"
                  />
                </div>
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
