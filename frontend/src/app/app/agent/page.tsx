"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  FolderGit2,
  GitBranch,
  Loader2,
  Play,
  StopCircle,
  ListChecks,
  AlertCircle,
  CheckCircle2,
  GitPullRequest,
  Sparkles,
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
  tokenBudget?: {
    planning: number;
    decision: number;
    tools: number;
    final: number;
    total: number;
  };
  limits?: {
    maxInputTokens: number;
    maxOutputTokens: number;
    maxIterations: number;
    maxToolCalls: number;
    maxExecutionTimeMs: number;
  };
  taskComplexity?: "simple" | "complex";
  stopReason?: string;
  finalResult?: string;
  error?: string;
  repositoryId: string;
  branch?: string;
  verificationStatus?: string;
  lastExecution?: {
    tool: string;
    success: boolean;
    exitCode: number;
    errorSummary?: string;
    sandbox?: string;
  };
  selfFixIterationCount?: number;
  gitWorkflowStatus?: string;
  gitBranch?: string;
  gitCommitSha?: string;
  gitError?: string;
  publishStatus?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  publishError?: string;
}

const TERMINAL = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

function statusStyles(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border-[var(--nova-success-border)]";
    case "FAILED":
    case "CANCELLED":
      return "bg-[var(--nova-danger-subtle)] text-[var(--nova-danger-text)] border-[var(--nova-danger-border)]";
    case "WAITING":
      return "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border-[var(--nova-warning-border)]";
    default:
      return "bg-[var(--nova-ai-subtle)] text-[var(--nova-ai-text)] border-[var(--nova-ai-border)]";
  }
}

function stepStatusIcon(status: PlanStepStatus) {
  if (status === "COMPLETED") return <CheckCircle2 className="w-4 h-4 text-[var(--nova-success-text)] shrink-0" />;
  if (status === "FAILED") return <AlertCircle className="w-4 h-4 text-[var(--nova-danger-text)] shrink-0" />;
  if (status === "IN_PROGRESS") return <Loader2 className="w-4 h-4 animate-spin text-[var(--nova-ai-text)] shrink-0" />;
  return <span className="w-4 h-4 rounded-full border border-[var(--nova-border)] shrink-0" />;
}

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
    void fetchRun(runId);
    pollRef.current = setInterval(() => fetchRun(runId), 2000);
  };

  const startAgent = async () => {
    if (!selectedRepoId || !task.trim()) {
      addToast({
        type: "warning",
        title: "Missing input",
        message: "Select a repository and describe a concrete coding task.",
      });
      return;
    }
    setLoading(true);
    setRun(null);
    setProposals([]);
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
      addToast({ type: "success", title: "Agent started", message: "Planning and analyzing the repository." });
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
  const runActive = run && !TERMINAL.has(run.status);
  const planningInProgress = run?.status === "PLANNING" || (run?.plan?.length === 0 && runActive);
  const selectedRepo = repositories.find((r) => r.id === selectedRepoId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Page header */}
      <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)]">
                <Bot className="w-5 h-5 text-[var(--nova-ai-text)]" />
              </span>
              <h1 className="text-[17px] font-semibold text-[var(--nova-text-primary)] tracking-tight">
                Coding Agent
              </h1>
            </div>
            <p className="text-[12px] text-[var(--nova-text-secondary)] leading-relaxed max-w-2xl">
              Runs in an isolated workspace per task. GitHub is read via API; writes go through approval (default),
              tests, git branch, and optional PR.
            </p>
          </div>
          <Link
            href="/app/settings?tab=ai"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--nova-accent-text)] hover:underline shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gemini API settings
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* New run */}
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] p-5 shadow-xs space-y-4">
            <h2 className="text-[13px] font-semibold text-[var(--nova-text-primary)]">New run</h2>

            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                Task
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={4}
                disabled={!!runActive}
                placeholder="Describe a concrete change, e.g. fix the login redirect in the auth module and add a unit test."
                className="w-full text-[12px] rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] p-3 text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] disabled:opacity-60"
              />
            </div>

            <div className="grid gap-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--nova-text-secondary)] flex items-center gap-1 mb-1.5">
                  <FolderGit2 className="w-3.5 h-3.5" /> Repository
                </label>
                <select
                  value={selectedRepoId}
                  onChange={(e) => setSelectedRepoId(e.target.value)}
                  disabled={!!runActive}
                  className="w-full text-[12px] rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] p-2.5 text-[var(--nova-text-primary)] focus:outline-none focus:border-[var(--nova-accent)] disabled:opacity-60"
                >
                  {repositories.length === 0 ? (
                    <option value="">No repositories connected</option>
                  ) : (
                    repositories.map((r) => (
                      <option key={r.id} value={r.id}>{r.fullName}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--nova-text-secondary)] flex items-center gap-1 mb-1.5">
                  <GitBranch className="w-3.5 h-3.5" /> Branch
                </label>
                <input
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!!runActive}
                  className="w-full text-[12px] rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] p-2.5 text-[var(--nova-text-primary)] focus:outline-none focus:border-[var(--nova-accent)] disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={startAgent}
                disabled={loading || !!runActive || !selectedRepoId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--nova-ai)] hover:opacity-90 text-white text-[12px] font-medium disabled:opacity-50 transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start agent
              </button>
              {runActive && (
                <button
                  type="button"
                  onClick={cancelRun}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] text-[var(--nova-text-primary)] text-[12px] font-medium hover:bg-[var(--nova-elevated)] transition"
                >
                  <StopCircle className="w-4 h-4 text-[var(--nova-danger-text)]" />
                  Stop run
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Run panel */}
        <section className="lg:col-span-3 space-y-4">
          {!run ? (
            <div className="rounded-xl border border-dashed border-[var(--nova-border)] bg-[var(--nova-bg)]/50 p-10 text-center">
              <Bot className="w-10 h-10 mx-auto text-[var(--nova-text-muted)] mb-3 opacity-60" />
              <p className="text-[13px] font-medium text-[var(--nova-text-primary)]">No active run</p>
              <p className="text-[11px] text-[var(--nova-text-muted)] mt-1 max-w-sm mx-auto">
                Start with a specific task. Greetings like &quot;hi&quot; won&apos;t produce a useful plan — describe what to
                change in the repo.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-[var(--nova-text-muted)] truncate">{run.id}</p>
                    <p className="text-[12px] text-[var(--nova-text-secondary)] mt-0.5 truncate">
                      {selectedRepo?.fullName || run.repositoryId}
                      {run.branch ? ` · ${run.branch}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${statusStyles(run.status)}`}
                    >
                      {run.status}
                    </span>
                    {run.loopPhase && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)]">
                        {run.loopPhase}
                      </span>
                    )}
                    {run.taskComplexity && (
                      <span className="text-[10px] text-[var(--nova-text-muted)]">{run.taskComplexity} task</span>
                    )}
                  </div>
                </div>

                {planningInProgress && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)]">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--nova-ai-text)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[12px] font-medium text-[var(--nova-text-primary)]">Planning…</p>
                      <p className="text-[11px] text-[var(--nova-text-secondary)] mt-0.5">
                        Fetching repo context and asking Gemini for a step-by-step plan. This can take 15–60 seconds.
                      </p>
                    </div>
                  </div>
                )}

                {run.error && (
                  <div className="p-3 rounded-lg border border-[var(--nova-danger-border)] bg-[var(--nova-danger-subtle)] text-[12px] text-[var(--nova-danger-text)]">
                    {run.error}
                  </div>
                )}

                {run.stopReason && (
                  <div className="p-3 rounded-lg border border-[var(--nova-warning-border)] bg-[var(--nova-warning-subtle)] text-[12px] text-[var(--nova-warning-text)]">
                    {run.stopReason}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Input tokens", value: run.tokenUsage?.inputTokens ?? 0 },
                    { label: "Output tokens", value: run.tokenUsage?.outputTokens ?? 0 },
                    { label: "Tool calls", value: run.tokenUsage?.toolCalls ?? 0 },
                    { label: "Iterations", value: run.tokenUsage?.iterations ?? 0 },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="p-2.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)]"
                    >
                      <div className="text-[10px] text-[var(--nova-text-muted)]">{m.label}</div>
                      <div className="text-[14px] font-semibold text-[var(--nova-text-primary)] tabular-nums">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>

                {currentStep && (
                  <div className="p-3 rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)]">
                    <div className="text-[10px] uppercase tracking-wide text-[var(--nova-text-muted)] mb-1">
                      Current step
                    </div>
                    <div className="text-[12px] text-[var(--nova-text-primary)]">
                      <span className="font-mono text-[var(--nova-text-muted)]">{currentStep.id}</span>
                      {" · "}
                      {currentStep.description}
                    </div>
                  </div>
                )}

                {run.pullRequestUrl && (
                  <a
                    href={run.pullRequestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--nova-accent-text)] hover:underline"
                  >
                    <GitPullRequest className="w-4 h-4" />
                    Pull request #{run.pullRequestNumber}
                  </a>
                )}
              </div>

              {proposals.filter((p) => p.status === "PENDING").length > 0 && (
                <div className="rounded-xl border border-[var(--nova-warning-border)] bg-[var(--nova-warning-subtle)]/40 p-4 space-y-3">
                  <h3 className="text-[13px] font-semibold text-[var(--nova-text-primary)]">Approval required</h3>
                  {proposals
                    .filter((p) => p.status === "PENDING")
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg border border-[var(--nova-border)] bg-[var(--nova-surface)] text-[12px]"
                      >
                        <div className="flex flex-wrap justify-between gap-2 mb-2">
                          <span className="font-mono text-[11px]">{p.path}</span>
                          <span className="text-[11px]">
                            <span className="text-[var(--nova-success-text)]">+{p.linesAdded}</span>
                            {" / "}
                            <span className="text-[var(--nova-danger-text)]">-{p.linesRemoved}</span>
                          </span>
                        </div>
                        <pre className="text-[10px] overflow-x-auto max-h-28 text-[var(--nova-text-secondary)] bg-[var(--nova-bg)] p-2 rounded-md">
                          {p.diffPreview}
                        </pre>
                        <button
                          type="button"
                          onClick={() => approveProposal(p.id)}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--nova-ai)] text-white text-[11px] font-medium"
                        >
                          Approve changes
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="w-4 h-4 text-[var(--nova-ai-text)]" />
                  <h3 className="text-[13px] font-semibold text-[var(--nova-text-primary)]">Plan</h3>
                </div>
                {run.plan.length === 0 ? (
                  <p className="text-[11px] text-[var(--nova-text-muted)] py-4 text-center">
                    {planningInProgress ? "Steps will appear when planning finishes." : "No plan steps."}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {run.plan.map((step) => (
                      <li
                        key={step.id}
                        className={`flex gap-3 p-3 rounded-lg border text-[12px] ${
                          step.status === "IN_PROGRESS"
                            ? "border-[var(--nova-ai-border)] bg-[var(--nova-ai-subtle)]/30"
                            : "border-[var(--nova-border)] bg-[var(--nova-bg)]"
                        }`}
                      >
                        {stepStatusIcon(step.status)}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap justify-between gap-2">
                            <span className="text-[var(--nova-text-primary)]">{step.description}</span>
                            <span className="text-[10px] font-mono text-[var(--nova-text-muted)] shrink-0">
                              {step.status}
                            </span>
                          </div>
                          {step.result && (
                            <p className="mt-1.5 text-[11px] text-[var(--nova-text-secondary)]">{step.result}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(run.finalResult || run.error) && TERMINAL.has(run.status) && (
                <div className="rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] p-4 shadow-xs">
                  <h3 className="text-[13px] font-medium text-[var(--nova-text-primary)] mb-2">Summary</h3>
                  <pre className="text-[11px] whitespace-pre-wrap text-[var(--nova-text-secondary)] leading-relaxed">
                    {run.finalResult || run.error}
                  </pre>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
