"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  GitCommit,
  CheckSquare,
  FileText,
  Rocket,
  Shield,
  Radio,
  X,
  ExternalLink,
} from "lucide-react";
import { useToast } from "./ToastProvider";

export interface NotificationItem {
  id: string;
  type: string;
  category: "tasks" | "specs" | "releases" | "git" | "system";
  title: string;
  message: string;
  timestamp: string;
  link?: string;
  isRead?: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Load initial notifications and listen to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    // Fetch initial history immediately via fast JSON endpoint
    fetch("/api/events?poll=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.history)) {
          setNotifications(
            data.history.map((n: any) => ({
              ...n,
              isRead: false,
            }))
          );
          setUnreadCount(data.history.length);
        }
      })
      .catch(() => {});

    function connectSSE() {
      try {
        eventSource = new EventSource("/api/events");

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "init") {
              if (Array.isArray(data.history)) {
                setNotifications(
                  data.history.map((n: any) => ({
                    ...n,
                    isRead: false,
                  }))
                );
                setUnreadCount(data.history.length);
              }
              return;
            }

            // Real-time event arrived!
            const newNotif: NotificationItem = {
              id: data.id || `notif-${Date.now()}`,
              type: data.type || "system",
              category: data.category || "system",
              title: data.title || "Workspace Update",
              message: data.message || "",
              timestamp: "Just now",
              link: data.link,
              isRead: false,
            };

            setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
            setUnreadCount((count) => count + 1);

            // Trigger global toast alert
            const toastType =
              newNotif.category === "git"
                ? "commit"
                : newNotif.category === "releases"
                ? "release"
                : newNotif.category === "specs"
                ? "accent"
                : "success";

            addToast({
              title: newNotif.title,
              message: newNotif.message || newNotif.title,
              type: toastType,
            });

            // Dispatch custom window event so open pages (Kanban, etc.) can auto-refresh
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("nova:realtime_sync", { detail: data })
              );
            }
          } catch (err) {
            console.error("Error parsing SSE frame:", err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Auto-reconnect after 4s
          reconnectTimeout = setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        setIsConnected(false);
      }
    }

    connectSSE();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [addToast]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const filtered = notifications.filter((n) => {
    if (activeCategory === "all") return true;
    return n.category === activeCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "tasks":
        return <CheckSquare className="w-3.5 h-3.5 text-blue-400" />;
      case "specs":
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case "releases":
        return <Rocket className="w-3.5 h-3.5 text-purple-400" />;
      case "git":
        return <GitCommit className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
        title="Real-Time Notification Center"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(94,67,243,0.6)] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121316] border border-white/10 rounded-xl shadow-2xl shadow-black/80 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Live Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-indigo-400 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Read all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-black/20 overflow-x-auto text-[11px]">
            {["all", "tasks", "specs", "releases", "git"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 rounded-md capitalize transition-colors shrink-0 ${
                  activeCategory === cat
                    ? "bg-white/10 text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No notifications in this category
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3 transition-colors hover:bg-white/[0.04] cursor-pointer flex gap-3 ${
                    !item.isRead ? "bg-indigo-500/[0.04]" : ""
                  }`}
                >
                  <div className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-medium text-zinc-200 truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                  {!item.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer with Real-time Status */}
          <div className="p-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-[10px]">
                {isConnected ? "SSE Real-Time Sync Connected" : "Connecting live stream..."}
              </span>
            </div>
            <Radio className="w-3 h-3 text-zinc-600" />
          </div>
        </div>
      )}
    </div>
  );
}
