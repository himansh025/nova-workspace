"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetchInit } from "@/lib/apiHeaders";

function TeamInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [invite, setInvite] = useState<{
    name: string;
    email: string;
    role: string;
    organizationName: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }
    fetch(`/api/team/invites/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.invitation) {
          setInvite(data.invitation);
        } else {
          setError(data.error || "Invitation not found.");
        }
      })
      .catch(() => setError("Could not load invitation."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/team/invites/accept", {
        method: "POST",
        ...apiFetchInit({ "Content-Type": "application/json" }),
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.organizationId && typeof window !== "undefined") {
          localStorage.setItem("nova_active_org_id", data.organizationId);
        }
        setAccepted(true);
      } else {
        setError(data.error || "Failed to accept invitation.");
      }
    } catch {
      setError("Network error while accepting invitation.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--nova-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl shadow-lg p-6 text-[var(--nova-text-primary)]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--nova-text-secondary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading invitation…
          </div>
        ) : accepted ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[var(--nova-success)] mx-auto" />
            <h1 className="text-lg font-semibold">You're on the team!</h1>
            <p className="text-sm text-[var(--nova-text-secondary)]">
              Your invitation was accepted. Open the workspace to see your team and projects.
            </p>
            <Link
              href={user ? "/app/team" : "/login"}
              className="inline-block px-4 py-2 rounded-md bg-[var(--nova-accent)] text-white text-sm font-medium"
            >
              {user ? "Open team" : "Go to login"}
            </Link>
          </div>
        ) : error && !invite ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-[var(--nova-danger-text)]">{error}</p>
            <Link href="/" className="text-xs text-[var(--nova-accent)]">Back to home</Link>
          </div>
        ) : invite ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--nova-accent-subtle)] flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--nova-accent)]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Team invitation</h1>
                <p className="text-xs text-[var(--nova-text-muted)]">{invite.organizationName}</p>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)] p-4 text-sm space-y-1">
              <p><span className="text-[var(--nova-text-muted)]">Name:</span> {invite.name}</p>
              <p><span className="text-[var(--nova-text-muted)]">Email:</span> {invite.email}</p>
              <p><span className="text-[var(--nova-text-muted)]">Role:</span> {invite.role}</p>
            </div>
            {error && <p className="text-xs text-[var(--nova-danger-text)]">{error}</p>}
            {!user && (
              <p className="text-[11px] text-[var(--nova-text-muted)]">
                Sign in with <strong>{invite.email}</strong> to accept from the app, or accept here without an account.
              </p>
            )}
            {!user && (
              <Link
                href={`/login?redirect=${encodeURIComponent(`/invite/team?token=${token}`)}`}
                className="block w-full py-2.5 rounded-md border border-[var(--nova-border)] text-center text-sm font-medium"
              >
                Sign in to accept
              </Link>
            )}
            <button
              type="button"
              disabled={accepting}
              onClick={handleAccept}
              className="w-full py-2.5 rounded-md bg-[var(--nova-accent)] text-white text-sm font-medium disabled:opacity-60"
            >
              {accepting ? "Accepting…" : user ? "Accept invitation" : "Accept without signing in"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TeamInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--nova-text-muted)]">
          Loading…
        </div>
      }
    >
      <TeamInviteContent />
    </Suspense>
  );
}
