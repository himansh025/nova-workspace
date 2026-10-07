"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  FolderGit2,
  GitBranch,
  Loader2,
  Play,
  Square,
  ListChecks,
  Cpu,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { apiFetchInit } from "@/lib/apiHeaders";
import { useToast } from "@/components/workspace/ToastProvider";

interface Repository {
  id: string;
  fullName: string;
  defaultBranch?: string;
  selectedBranch?: string;
}

type PlanStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

interface PlanStep {
  id: string;
  description: string;
  status: PlanStepStatus;
  relevantFiles: string[];
  reason?: string;
  result?: string;
}

interface Proposal {
  id: string;
  tool: string;
  path: string;
  status: string;
  linesAdded: number;
  linesRemoved: number;
  diffPreview: string;
}

interface AgentRun {
  id: string;
  task: string;
  status: string;
  currentStep?: string;
  loopPhase?: string;
  waitingForProposalId?: string;
  diffSummary?: {
    linesAdded: number;
    linesRemoved: number;
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
  };
  plan: PlanStep[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    toolCalls: number;
    iterations: number;
  };
  finalResult?: string;
  error?: string;
  repositoryId: string;
  branch?: string;
}

const TERMINAL = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

export default function CodingAgentPage() {
  const { addToast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [task, setTask] = useState("");
  const [run, setRun] = useState<AgentRun | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRepositories = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/github/repositories", apiFetchInit());
      const data = await res.json();
      if (data.success && Array.isArray(data.repositories)) {
        setRepositories(data.repositories);
        if (data.repositories.length > 0) {
          const first = data.repositories[0];
          setSelectedRepoId(first.id);
          setSelectedBranch(first.selectedBranch || first.defaultBranch || "main");
        }
      }
    } catch {
      addToast({ type: "warning", title: "Repositories", message: "Failed to load repositories." });
    }
  }, [addToast]);

  useEffect(() => {
    loadRepositories();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadRepositories]);

  const fetchRun = async (runId: string) => {
    const res = await fetch(`/api/ai/agent/runs/${runId}`, apiFetchInit());
    const data = await res.json();
    if (data.success && data.run) {
      setRun(data.run);
      if (data.run.status === "WAITING" || data.run.waitingForProposalId) {
        const pRes = await fetch(`/api/ai/agent/runs/${runId}/proposals`, apiFetchInit());
        const pData = await pRes.json();
        if (pData.success && Array.isArray(pData.proposals)) {
          setProposals(pData.proposals);
        }
      }
      if (TERMINAL.has(data.run.status) && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  };

  const startPolling = (runId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchRun(runId), 2000);
  };

  const startAgent = async () => {
    if (!selectedRepoId || !task.trim()) {
      addToast({
        type: "warning",
        title: "Missing input",
        message: "Select a repository and enter a task.",
      });
      return;
    }
    setLoading(true);
    setRun(null);
    try {
      const res = await fetch("/api/ai/agent/runs", {
        ...apiFetchInit({ "Content-Type": "application/json" }),
        method: "POST",
        body: JSON.stringify({
          repositoryId: selectedRepoId,
          branch: selectedBranch,
          task: task.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to start agent");
      }
      setRun(data.run);
      addToast({ type: "success", title: "Agent started", message: "Analyzing the repository." });
      startPolling(data.run.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start agent";
      addToast({ type: "warning", title: "Agent failed", message });
    } finally {
      setLoading(false);
    }
  };

  const cancelRun = async () => {
    if (!run) return;
    try {
      const res = await fetch(`/api/ai/agent/runs/${run.id}/cancel`, {
        ...apiFetchInit(),
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setRun(data.run);
        addToast({ type: "accent", title: "Cancelled", message: "Agent run was cancelled." });
      }
    } catch {
      addToast({ type: "warning", title: "Cancel failed", message: "Could not cancel the run." });
    }
  };

  const approveProposal = async (proposalId: string) => {
    if (!run) return;
    try {
      const res = await fetch(
        `/api/ai/agent/runs/${run.id}/proposals/${proposalId}/approve`,
        { ...apiFetchInit(), method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setRun(data.run);
        addToast({ type: "success", title: "Changes approved", message: "Applied to workspace." });
        startPolling(run.id);
      }
    } catch {
      addToast({ type: "warning", title: "Approval failed", message: "Could not apply changes." });
    }
  };

  const currentStep = run?.plan.find((s) => s.id === run.currentStep);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-2 pb-4 border-b border-[var(--nova-border)]">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--nova-ai)]" />
          <h1 className="text-xl font-bold text-[var(--nova-text-primary)]">Coding Agent</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 border border-violet-500/20">
            WORKSPACE EDITS · PHASE 5
          </span>
        </div>
        <p className="text-xs text-[var(--nova-text-secondary)]">
          Modify code in an isolated workspace per run. GitHub is never written directly. Approve proposed patches before they apply (default).
        </p>
      </div>

      <div className="grid gap-4 p-4 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)]">
        <label className="text-xs font-medium text-[var(--nova-text-secondary)]">Task</label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          rows={3}
          placeholder='e.g. "Fix checkout calculation"'
          className="w-full text-sm rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] p-3 text-[var(--nova-text-primary)]"
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--nova-text-secondary)] flex items-center gap-1 mb-1">
              <FolderGit2 className="w-3.5 h-3.5" /> Repository
            </label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full text-sm rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] p-2"
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>{r.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--nova-text-secondary)] flex items-center gap-1 mb-1">
              <GitBranch className="w-3.5 h-3.5" /> Branch
            </label>
            <input
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full text-sm rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] p-2"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startAgent}
            disabled={loading || (!!run && !TERMINAL.has(run.status))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--nova-ai)] text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start agent
          </button>
          {run && !TERMINAL.has(run.status) && (
            <button
              type="button"
              onClick={cancelRun}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--nova-border)] text-sm"
            >
              <Square className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {run && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-mono text-xs text-[var(--nova-text-secondary)]">Run {run.id}</span>
            <span className="px-2 py-0.5 rounded-full text-xs border border-[var(--nova-border)]">
              {run.status}
            </span>
            {run.loopPhase && (
              <span className="text-xs text-[var(--nova-text-secondary)]">Phase: {run.loopPhase}</span>
            )}
            {run.status === "COMPLETED" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {run.status === "FAILED" && <AlertCircle className="w-4 h-4 text-red-500" />}
          </div>

          {run.diffSummary && (
            <div className="text-xs p-3 rounded-lg border border-[var(--nova-border)]">
              Workspace diff: +{run.diffSummary.linesAdded} / -{run.diffSummary.linesRemoved} lines
              ({run.diffSummary.filesModified} modified, {run.diffSummary.filesAdded} added)
            </div>
          )}

          {proposals.filter((p) => p.status === "PENDING").length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Pending approval</h3>
              {proposals
                .filter((p) => p.status === "PENDING")
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm"
                  >
                    <div className="flex justify-between gap-2 mb-2">
                      <span className="font-mono text-xs">{p.path}</span>
                      <span className="text-xs text-emerald-600">+{p.linesAdded}</span>
                      <span className="text-xs text-red-500">-{p.linesRemoved}</span>
                    </div>
                    <pre className="text-xs overflow-x-auto max-h-32 text-[var(--nova-text-secondary)]">
                      {p.diffPreview}
                    </pre>
                    <button
                      type="button"
                      onClick={() => approveProposal(p.id)}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--nova-ai)] text-white text-xs"
                    >
                      Approve changes
                    </button>
                  </div>
                ))}
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-[var(--nova-border)]">
              <div className="flex items-center gap-1 text-[var(--nova-text-secondary)] mb-1">
                <Cpu className="w-3.5 h-3.5" /> Token usage
              </div>
              <div>In: {run.tokenUsage?.inputTokens ?? 0}</div>
              <div>Out: {run.tokenUsage?.outputTokens ?? 0}</div>
              <div>Tools: {run.tokenUsage?.toolCalls ?? 0} · Iter: {run.tokenUsage?.iterations ?? 0}</div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--nova-border)] sm:col-span-2">
              <div className="text-[var(--nova-text-secondary)] mb-1">Current step</div>
              <div className="text-sm">
                {currentStep ? `${currentStep.id}: ${currentStep.description}` : "—"}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <ListChecks className="w-4 h-4" /> Plan
            </div>
            <ul className="space-y-2">
              {run.plan.map((step) => (
                <li
                  key={step.id}
                  className="p-3 rounded-lg border border-[var(--nova-border)] text-sm"
                >
                  <div className="flex justify-between gap-2">
                    <span>{step.description}</span>
                    <span className="text-xs text-[var(--nova-text-secondary)] shrink-0">{step.status}</span>
                  </div>
                  {step.result && (
                    <p className="mt-2 text-xs text-[var(--nova-text-secondary)]">{step.result}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {(run.finalResult || run.error) && (
            <div className="p-4 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)]">
              <h3 className="text-sm font-medium mb-2">Final result</h3>
              <pre className="text-xs whitespace-pre-wrap text-[var(--nova-text-secondary)]">
                {run.error || run.finalResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
