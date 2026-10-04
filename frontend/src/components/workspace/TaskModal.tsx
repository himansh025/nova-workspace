"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Task, TaskPriority, TaskStatus, TeamMember } from "@/types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved: () => void;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onTaskSaved,
  taskToEdit
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("backlog");
  const [assigneeId, setAssigneeId] = useState("usr-1");
  const [branch, setBranch] = useState("");
  const [estimate, setEstimate] = useState("3 pts");
  const [tagsInput, setTagsInput] = useState("Core, Feature");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => data.team && setTeam(data.team))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setAssigneeId(taskToEdit.assignee.id);
      setBranch(taskToEdit.branch || "");
      setEstimate(taskToEdit.estimate || "3 pts");
      setTagsInput(taskToEdit.tags.join(", "));
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("backlog");
      setAssigneeId("usr-1");
      setBranch("");
      setEstimate("3 pts");
      setTagsInput("Feature");
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (taskToEdit) {
        // Update
        const selectedMember = team.find((m) => m.id === assigneeId);
        await fetch(`/api/tasks/${taskToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            priority,
            status,
            branch: branch || undefined,
            estimate,
            tags,
            ...(selectedMember
              ? {
                  assignee: {
                    id: selectedMember.id,
                    name: selectedMember.name,
                    avatar: selectedMember.avatar,
                    initials: selectedMember.initials
                  }
                }
              : {})
          })
        });
      } else {
        // Create
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            priority,
            status,
            assigneeId,
            branch: branch || undefined,
            estimate,
            tags
          })
        });
      }

      onTaskSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save task", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.4)] backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-[0_20px_40px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-10 text-[var(--nova-text-primary)] text-xs">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--nova-text-primary)]">
              {taskToEdit ? `Edit Issue ${taskToEdit.key}` : "Create New Engineering Issue"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] rounded hover:bg-[var(--nova-deep)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement WebAssembly zero-copy memory bridge"
              className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical context, repro steps, or implementation notes..."
              className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)] resize-none"
            />
          </div>

          {/* Two column grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)]"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                Priority SLA
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)]"
              >
                <option value="urgent">P0 Urgent</option>
                <option value="high">P1 High</option>
                <option value="medium">P2 Medium</option>
                <option value="low">P3 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Assignee */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)]"
              >
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.split(" ")[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Story Points / Estimate */}
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                Estimate
              </label>
              <input
                type="text"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="e.g. 3 pts"
                className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)]"
              />
            </div>
          </div>

          {/* Git Branch & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                Git Branch (Optional)
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="feat/my-branch"
                className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] font-mono text-[11px] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Core, Infra, Bug"
                className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] text-[11px] rounded-md focus:outline-hidden focus:border-[var(--nova-accent)]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--nova-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-1.5 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white font-medium shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : taskToEdit ? "Save Changes" : "Create Issue"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
