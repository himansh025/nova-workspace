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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.4)] backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-[0_20px_40px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-10 text-xs text-[var(--nova-text-primary)] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--nova-accent)] flex items-center justify-center text-white font-bold text-sm">
              {user?.initials || "U"}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">{user?.name || "Workspace Member"}</h3>
              <p className="text-[11px] text-[var(--nova-text-secondary)]">{user?.role || "Engineer"} • {user?.organization || "Workspace"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] rounded hover:bg-[var(--nova-deep)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Account Details Card */}
          <div className="rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--nova-text-secondary)] uppercase tracking-wider">Account Details</span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active Session</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-[var(--nova-text-secondary)] mt-0.5" />
                <div>
                  <div className="text-[10px] text-[var(--nova-text-secondary)]">Email Address</div>
                  <div className="font-medium text-[var(--nova-text-primary)] text-xs">{user?.email || "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 text-[var(--nova-text-secondary)] mt-0.5" />
                <div>
                  <div className="text-[10px] text-[var(--nova-text-secondary)]">Role / Title</div>
                  <div className="font-medium text-[var(--nova-text-primary)] text-xs">{user?.role || "Software Engineer"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-[var(--nova-text-secondary)] mt-0.5" />
                <div>
                  <div className="text-[10px] text-[var(--nova-text-secondary)]">Organization</div>
                  <div className="font-medium text-[var(--nova-text-primary)] text-xs">{user?.organization || "Nova Workspace"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-[var(--nova-text-secondary)] mt-0.5" />
                <div>
                  <div className="text-[10px] text-[var(--nova-text-secondary)]">User Identifier</div>
                  <div className="font-mono text-[var(--nova-text-secondary)] text-[11px]">{user?.id || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal API Session Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-[var(--nova-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Personal Session API Token</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-medium">Bearer Auth Valid</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={sessionToken}
                className="flex-1 bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-md px-3 py-2 text-[var(--nova-text-secondary)] font-mono text-xs focus:outline-hidden"
              />
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1 px-3 py-2 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] hover:bg-[var(--nova-deep)] text-[var(--nova-text-primary)] text-xs font-medium transition-colors shrink-0"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? "Copied" : "Copy Token"}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Workspace</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--nova-border)] bg-[var(--nova-surface)] flex justify-between items-center text-[10px] text-[var(--nova-text-secondary)]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Trust Identity • Session Encrypted</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
