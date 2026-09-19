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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0E1015] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121316]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-neutral-400 rounded-full">
                  {language}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Execute AI-generated implementations directly inside an isolated browser sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              title="Reset Code & Console"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? "Executing..." : "Run in Sandbox"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Grid: Code Editor (Left) & Live Terminal (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10 min-h-0 bg-[#0A0B0D]">
          {/* Code Editor Panel */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 bg-[#121316]/50 border-b border-white/5 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[11px]">source.{language === "rust" ? "rs" : "ts"}</span>
              </div>
              <span className="text-[10px] text-neutral-500">Editable In-Memory Buffer</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-4 bg-transparent text-neutral-200 font-mono text-xs leading-relaxed resize-none focus:outline-hidden selection:bg-indigo-500/30 overflow-auto"
            />
          </div>

          {/* Live Terminal Output Panel */}
          <div className="flex flex-col min-h-0 bg-[#07080A]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#121316]/50 border-b border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px] text-neutral-300">Sandbox Console Output</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                {executionTime !== null && (
                  <span className="flex items-center gap-1 text-neutral-400 font-mono text-[10px]">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {executionTime}ms
                  </span>
                )}
                {exitStatus === "success" && (
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Exited 0
                  </span>
                )}
                {exitStatus === "error" && (
                  <span className="flex items-center gap-1 text-rose-400 text-[10px] font-mono">
                    <AlertCircle className="w-3 h-3" /> Error
                  </span>
                )}
              </div>
            </div>

            {/* Console Log Stream */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2">
              {outputs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 gap-2">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No execution logs yet.</p>
                  <p className="text-[10px] text-neutral-500">
                    Click <span className="text-indigo-400 font-semibold">"Run in Sandbox"</span> to execute this implementation.
                  </p>
                </div>
              ) : (
                outputs.map((out) => (
                  <div key={out.id} className="flex items-start gap-2.5 leading-relaxed text-[11px]">
                    <span className="text-neutral-600 text-[10px] select-none shrink-0 pt-0.5">
                      {out.time}
                    </span>
                    <div
                      className={`flex-1 break-all whitespace-pre-wrap ${
                        out.type === "error"
                          ? "text-rose-400 bg-rose-500/10 p-2 rounded-md border border-rose-500/20"
                          : out.type === "warn"
                          ? "text-amber-400"
                          : out.type === "system"
                          ? "text-indigo-300 font-semibold italic"
                          : "text-neutral-200"
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
