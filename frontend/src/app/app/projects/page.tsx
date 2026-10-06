"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderKanban, Plus, GitBranch, ArrowUpRight, X, Layers, Clock, LayoutGrid, List, Trash2, Edit2 } from "lucide-react";
import { Project } from "@/types";
import { ProjectsSkeleton } from "@/components/workspace/Skeletons";

interface TeamGroup {
  id: string;
  name: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [squads, setSquads] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sprint, setSprint] = useState("Sprint 1");
  const [repository, setRepository] = useState("");
  const [teamGroupId, setTeamGroupId] = useState("");
  const [isDefaultForTasks, setIsDefaultForTasks] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const squadNameById = (id?: string | null) =>
    id ? squads.find((s) => s.id === id)?.name || "Unknown squad" : "Unassigned";
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selectedRows.size === projects.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(projects.map(p => p.id)));
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

  const buildHeaders = () => {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const orgId = localStorage.getItem("nova_active_org_id");
      if (orgId) headers["x-organization-id"] = orgId;
      const token = localStorage.getItem("nova_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchProjects = async () => {
    try {
      const headers = buildHeaders();
      const [projRes, squadRes] = await Promise.all([
        fetch("/api/projects", { headers, credentials: "include" }),
        fetch("/api/team/groups", { headers, credentials: "include" }),
      ]);
      const data = await projRes.json();
      const squadData = await squadRes.json();
      if (data.projects) setProjects(data.projects);
      if (squadData.groups) setSquads(squadData.groups);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setProjectToEdit(null);
    setName("");
    setDescription("");
    setSprint("Sprint 1");
    setRepository("");
    setTeamGroupId("");
    setIsDefaultForTasks(false);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setProjectToEdit(p);
    setName(p.name);
    setDescription(p.description);
    setSprint(p.sprint);
    setRepository(p.repository);
    setTeamGroupId(p.teamGroupId || "");
    setIsDefaultForTasks(Boolean(p.isDefaultForTasks));
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (projectToEdit) {
        const res = await fetch(`/api/projects/${projectToEdit.id}`, {
          method: "PATCH",
          headers: { ...buildHeaders(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            description,
            sprint,
            repository,
            teamGroupId: teamGroupId || null,
            isDefaultForTasks,
          }),
        });
        const data = await res.json();
        if (data.project) {
          setProjects(
            projects.map((p) => {
              if (p.id === projectToEdit.id) return data.project;
              if (isDefaultForTasks) return { ...p, isDefaultForTasks: false };
              return p;
            })
          );
        }
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { ...buildHeaders(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            description,
            sprint,
            repository,
            teamGroupId: teamGroupId || null,
            isDefaultForTasks,
          }),
        });
        const data = await res.json();
        if (data.project) {
          const next = isDefaultForTasks
            ? projects.map((p) => ({ ...p, isDefaultForTasks: false }))
            : projects;
          setProjects([data.project, ...next]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save project", err);
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
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-xs font-medium shadow-xs transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  <span
                    className="text-[10px] font-mono text-[var(--nova-success-text)] font-semibold"
                    title="Story points completed (done tasks)"
                  >
                    {p.velocity}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[var(--nova-text-primary)] mb-1.5">{p.name}</h3>
                <p className="text-xs text-[var(--nova-text-secondary)] leading-relaxed line-clamp-2">
                  {p.description}
                </p>
                <p className="text-[10px] font-mono mt-2 text-[var(--nova-text-muted)]">
                  Assigned squad: <span className="text-[var(--nova-accent)]">{squadNameById(p.teamGroupId)}</span>
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

                <div className="flex items-center gap-2">
                  <Link
                    href={`/app/tasks?projectId=${p.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-medium transition-colors duration-150"
                  >
                    <span>Enter Project Workspace</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--nova-text-secondary)]" />
                  </Link>
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-2 border border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded-md transition-colors"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="p-2 border border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-danger)] hover:bg-[var(--nova-danger-subtle)] rounded-md transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--nova-border)] bg-[var(--nova-deep)] text-[11px] uppercase tracking-wider text-[var(--nova-text-muted)]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.size > 0 && selectedRows.size === projects.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedRows.size > 0 && selectedRows.size < projects.length;
                      }
                    }}
                    onChange={toggleAll}
                    className="rounded border-[var(--nova-border)] bg-[var(--nova-surface)] checked:bg-[var(--nova-accent)] focus:ring-[var(--nova-accent)]"
                  />
                </th>
                <th className="py-3 px-4 font-medium">Project Name</th>
                <th className="py-3 px-4 font-medium">Assigned Squad</th>
                <th className="py-3 px-4 font-medium">Sprint</th>
                <th className="py-3 px-4 font-medium">Progress</th>
                <th className="py-3 px-4 font-medium">Active Branch</th>
                <th className="py-3 px-4 font-medium">Velocity</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[var(--nova-border)]">
              {projects.map((p) => {
                const isSelected = selectedRows.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[var(--nova-deep)] transition-colors ${isSelected ? "bg-[var(--nova-accent-subtle)]/50" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(p.id)}
                        className="rounded border-[var(--nova-border)] bg-[var(--nova-surface)] checked:bg-[var(--nova-accent)] focus:ring-[var(--nova-accent)]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--nova-text-primary)]">{p.name}</span>
                        <span className="text-[10px] text-[var(--nova-text-muted)] truncate max-w-[200px]">{p.description}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[var(--nova-text-muted)]">
                      {squadNameById(p.teamGroupId)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono text-[var(--nova-accent)] px-2 py-0.5 rounded bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)]">
                        {p.sprint}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[var(--nova-surface)] border border-[var(--nova-border-muted)] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[var(--nova-accent)] h-full rounded-full"
                            style={{ width: `${p.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[var(--nova-text-muted)]">{p.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--nova-text-secondary)]">
                        <GitBranch className="w-3.5 h-3.5 text-[var(--nova-info)]" />
                        <span>{p.activeBranch}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-[var(--nova-success-text)] font-semibold">
                        {p.velocity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/app/tasks?projectId=${p.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-medium transition-colors duration-150"
                        >
                          <span>Workspace</span>
                          <ArrowUpRight className="w-3 h-3 text-[var(--nova-text-secondary)]" />
                        </Link>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-1.5 text-[var(--nova-text-muted)] hover:text-[var(--nova-danger)] hover:bg-[var(--nova-danger-subtle)] rounded transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--nova-surface)] border border-[var(--nova-border-strong)] rounded-xl shadow-2xl p-5 z-10 text-xs text-[var(--nova-text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--nova-border)] mb-4">
              <span className="text-sm font-semibold text-[var(--nova-text-primary)]">{projectToEdit ? "Edit Project Workspace" : "Create Project Workspace"}</span>
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

              <div>
                <label className="block text-[var(--nova-text-secondary)] text-[11px] mb-1 font-medium">Assigned engineering squad</label>
                <select
                  value={teamGroupId}
                  onChange={(e) => setTeamGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs"
                >
                  <option value="">No squad (org-wide)</option>
                  {squads.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefaultForTasks}
                  onChange={(e) => setIsDefaultForTasks(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--nova-border)]"
                />
                <span className="text-[11px] text-[var(--nova-text-secondary)]">
                  <span className="font-medium text-[var(--nova-text-primary)]">Default for new tasks</span>
                  <br />
                  Pre-select this project when creating issues and on the tasks board (one default per org).
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  {projectToEdit ? "Save changes" : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
