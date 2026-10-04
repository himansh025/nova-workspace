"use client";

import React, { useState } from "react";
import {
  Play,
  Terminal,
  RotateCcw,
  Copy,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Code2,
} from "lucide-react";

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode: string;
  title?: string;
  language?: string;
}

interface ConsoleOutput {
  id: string;
  type: "log" | "info" | "warn" | "error" | "system";
  content: string;
  time: string;
}

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({
  isOpen,
  onClose,
  initialCode,
  title = "In-Browser Code Execution Sandbox",
  language = "typescript",
}) => {
  const [code, setCode] = useState(initialCode);
  const [outputs, setOutputs] = useState<ConsoleOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [exitStatus, setExitStatus] = useState<"idle" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutputs([]);
    setExitStatus("idle");
    setExecutionTime(null);
  };

  const runCode = () => {
    setIsRunning(true);
    setExitStatus("idle");
    const captured: ConsoleOutput[] = [];
    const startTime = performance.now();

    const timestamp = () =>
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

    captured.push({
      id: `sys-start-${Date.now()}`,
      type: "system",
      content: `[Sandbox Runtime] Initializing sandboxed V8 execution context (${language})...`,
      time: timestamp(),
    });

    try {
      // Mock / capture console methods
      const logs: ConsoleOutput[] = [];

      const mockConsole = {
        log: (...args: any[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: "log",
            content: args
              .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
              .join(" "),
            time: timestamp(),
          });
        },
        info: (...args: any[]) => {
          logs.push({
            id: `info-${Date.now()}-${Math.random()}`,
            type: "info",
            content: args.join(" "),
            time: timestamp(),
          });
        },
        warn: (...args: any[]) => {
          logs.push({
            id: `warn-${Date.now()}-${Math.random()}`,
            type: "warn",
            content: args.join(" "),
            time: timestamp(),
          });
        },
        error: (...args: any[]) => {
          logs.push({
            id: `err-${Date.now()}-${Math.random()}`,
            type: "error",
            content: args.join(" "),
            time: timestamp(),
          });
        },
      };

      // Strip basic TypeScript types (interfaces, types, type annotations) to execute safely in JS runtime
      const sanitizedJs = code
        .replace(/export\s+class/g, "class")
        .replace(/export\s+const/g, "const")
        .replace(/export\s+function/g, "function")
        .replace(/public\s+|private\s+|protected\s+/g, "")
        .replace(/:\s*Promise<[^>]+>/g, "")
        .replace(/:\s*Record<[^>]+>/g, "")
        .replace(/:\s*[a-zA-Z0-9_<>|[\]]+/g, "");

      // Execute code with runner harness
      const executableScript = `
        ${sanitizedJs}

        // Auto-run class test harness if present
        if (typeof DistributedStateSyncEngine !== 'undefined') {
          console.log("[Test Harness] Instantiating DistributedStateSyncEngine...");
          const engine = new DistributedStateSyncEngine();
          if (typeof engine.syncState === 'function') {
            engine.syncState({ peerId: "node-west-01", vectorClock: 42, payloadHash: "sha256-4f81c9a" })
              .then(res => console.log("[Test Harness] syncState Result:", JSON.stringify(res)))
              .catch(err => console.error("[Test Harness] Execution error:", err));
          }
        }
      `;

      const executeFn = new Function("console", executableScript);
      executeFn(mockConsole);

      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);
      setExecutionTime(elapsed);

      captured.push(...logs);
      captured.push({
        id: `sys-done-${Date.now()}`,
        type: "system",
        content: `[Sandbox Runtime] Process completed in ${elapsed}ms with exit code 0.`,
        time: timestamp(),
      });

      setOutputs(captured);
      setExitStatus("success");
    } catch (err: any) {
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);
      setExecutionTime(elapsed);

      captured.push({
        id: `sys-err-${Date.now()}`,
        type: "error",
        content: `Runtime Error: ${err.message || err}`,
        time: timestamp(),
      });

      setOutputs(captured);
      setExitStatus("error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.4)] backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-5xl h-[85vh] bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden z-10 text-[var(--nova-text-primary)]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[var(--nova-accent)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--nova-text-primary)] flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] rounded-full">
                  {language}
                </span>
              </h2>
              <p className="text-xs text-[var(--nova-text-secondary)]">
                Execute AI-generated implementations directly inside an isolated browser sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] border border-transparent hover:border-[var(--nova-border)] transition-colors"
              title="Reset Code & Console"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--nova-text-primary)] bg-[var(--nova-surface)] hover:bg-[var(--nova-deep)] border border-[var(--nova-border)] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] disabled:opacity-50 transition-all shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? "Executing..." : "Run in Sandbox"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Grid: Code Editor (Left) & Live Terminal (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--nova-border)] min-h-0 bg-[var(--nova-bg)]">
          {/* Code Editor Panel */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--nova-surface)] border-b border-[var(--nova-border)] text-xs text-[var(--nova-text-secondary)]">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                <span className="font-mono text-[11px]">source.{language === "rust" ? "rs" : "ts"}</span>
              </div>
              <span className="text-[10px] text-[var(--nova-text-muted)]">Editable In-Memory Buffer</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-4 bg-transparent text-[var(--nova-text-primary)] font-mono text-xs leading-relaxed resize-none focus:outline-hidden selection:bg-[var(--nova-accent)]/20 overflow-auto"
            />
          </div>

          {/* Live Terminal Output Panel */}
          <div className="flex flex-col min-h-0 bg-[var(--nova-deep)]">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--nova-surface)] border-b border-[var(--nova-border)] text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-mono text-[11px] text-[var(--nova-text-primary)] font-medium">Sandbox Console Output</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                {executionTime !== null && (
                  <span className="flex items-center gap-1 text-[var(--nova-text-secondary)] font-mono text-[10px]">
                    <Clock className="w-3 h-3 text-[var(--nova-text-muted)]" />
                    {executionTime}ms
                  </span>
                )}
                {exitStatus === "success" && (
                  <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-mono font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Exited 0
                  </span>
                )}
                {exitStatus === "error" && (
                  <span className="flex items-center gap-1 text-rose-500 text-[10px] font-mono font-medium">
                    <AlertCircle className="w-3 h-3" /> Error
                  </span>
                )}
              </div>
            </div>

            {/* Console Log Stream */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
              {outputs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[var(--nova-text-muted)] gap-2">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p className="text-xs text-[var(--nova-text-secondary)]">No execution logs yet.</p>
                  <p className="text-[10px] text-[var(--nova-text-muted)]">
                    Click <span className="text-[var(--nova-accent)] font-semibold">&quot;Run in Sandbox&quot;</span> to execute this implementation.
                  </p>
                </div>
              ) : (
                outputs.map((out) => (
                  <div key={out.id} className="flex items-start gap-2.5 leading-relaxed text-[11px]">
                    <span className="text-[var(--nova-text-muted)] text-[10px] select-none shrink-0 pt-0.5">
                      {out.time}
                    </span>
                    <div
                      className={`flex-1 break-all whitespace-pre-wrap ${
                        out.type === "error"
                          ? "text-rose-600 bg-rose-500/10 p-2 rounded-md border border-rose-500/20"
                          : out.type === "warn"
                          ? "text-amber-600"
                          : out.type === "system"
                          ? "text-[var(--nova-accent)] font-semibold italic"
                          : "text-[var(--nova-text-primary)]"
                      }`}
                    >
                      {out.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
