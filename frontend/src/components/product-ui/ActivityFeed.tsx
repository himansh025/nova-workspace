"use client";

import React from "react";
import { GitPullRequest, CheckCircle2, MessageSquare } from "lucide-react";

export const ActivityFeed: React.FC = () => {
  const events = [
    {
      icon: <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />,
      user: "Marcus Chen",
      action: "opened pull request",
      target: "#204 - Fix offline sync mutations",
      time: "4m ago"
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      user: "Elena Rostova",
      action: "resolved blocker",
      target: "NV-832 Authentication token deadlock",
      time: "18m ago"
    },
    {
      icon: <MessageSquare className="w-3.5 h-3.5 text-sky-400" />,
      user: "NOVA Copilot",
      action: "synthesized changelog for",
      target: "Release v2.4.0-rc3",
      time: "32m ago"
    }
  ];

  return (
    <div className="bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg p-3 text-xs text-[var(--nova-text-primary)]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2.5">
        Live Activity Stream
      </div>
      <div className="space-y-2.5">
        {events.map((e, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-[11px]">
            <div className="mt-0.5 shrink-0">{e.icon}</div>
            <div className="flex-1 leading-snug">
              <span className="font-medium text-[var(--nova-text-primary)]">{e.user}</span>{" "}
              <span className="text-neutral-400">{e.action}</span>{" "}
              <span className="text-neutral-200 font-mono text-[10px]">{e.target}</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 shrink-0">
              {e.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
