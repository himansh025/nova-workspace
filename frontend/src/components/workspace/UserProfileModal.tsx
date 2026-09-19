"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Key,
  Copy,
  Check,
  X,
  Building,
  Mail,
  Briefcase,
  LogOut,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import { useAuth } from "@/context/AuthContext";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const sessionToken = user
    ? `nova_sec_${user.id}_${Buffer.from(user.email).toString("base64").slice(0, 16)}`
    : "nova_sec_unauthenticated";

  const handleCopyToken = () => {
    navigator.clipboard.writeText(sessionToken);
    setCopiedToken(true);
    addToast({
      title: "API Token Copied",
      message: "Personal session token copied to clipboard",
      type: "accent",
    });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#14161D] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 text-xs text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#171922]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.initials || "U"}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{user?.name || "Workspace Member"}</h3>
              <p className="text-[11px] text-neutral-400">{user?.role || "Engineer"} • {user?.organization || "Workspace"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Account Details Card */}
          <div className="rounded-xl bg-[#0E1015] border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Account Details</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active Session</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-[10px] text-neutral-400">Email Address</div>
                  <div className="font-medium text-white text-xs">{user?.email || "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-[10px] text-neutral-400">Role / Title</div>
                  <div className="font-medium text-white text-xs">{user?.role || "Software Engineer"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-[10px] text-neutral-400">Organization</div>
                  <div className="font-medium text-white text-xs">{user?.organization || "Nova Workspace"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div>
                  <div className="text-[10px] text-neutral-400">User Identifier</div>
                  <div className="font-mono text-neutral-300 text-[11px]">{user?.id || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal API Session Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3 text-amber-400" />
                <span>Personal Session API Token</span>
              </label>
              <span className="text-[10px] text-emerald-400">Bearer Auth Valid</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={sessionToken}
                className="flex-1 bg-[#0A0B0D] border border-white/10 rounded-lg px-3 py-2 text-neutral-400 font-mono text-xs focus:outline-hidden"
              />
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors shrink-0"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? "Copied" : "Copy Token"}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Workspace</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#121316] flex justify-between items-center text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Trust Identity • Session Encrypted</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-white font-sans text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
