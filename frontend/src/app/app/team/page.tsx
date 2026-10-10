"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  ArrowUpRight,
  LayoutGrid,
  List,
  UsersRound,
  Pencil,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { TeamMember } from "@/types";
import { TeamSkeleton } from "@/components/workspace/Skeletons";
import { useOrgPermissions } from "@/hooks/useOrgPermissions";

interface TeamGroup {
  id: string;
  name: string;
  description?: string;
}

type PageTab = "squads" | "members";

export default function TeamPage() {
  const { canManageTeam } = useOrgPermissions();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PageTab>("squads");

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [memberStatus, setMemberStatus] = useState<TeamMember["status"]>("online");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const groupNameById = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [groups]);

  const buildAuthHeaders = (extra: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...extra };
    if (typeof window !== "undefined") {
      const orgId = localStorage.getItem("nova_active_org_id");
      if (orgId) headers["x-organization-id"] = orgId;
      const token = localStorage.getItem("nova_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchTeam = async () => {
    try {
      const headers = buildAuthHeaders();
      const [teamRes, groupRes] = await Promise.all([
        fetch("/api/team", { headers, credentials: "include" }),
        fetch("/api/team/groups", { headers, credentials: "include" }),
      ]);
      const teamData = await teamRes.json();
      const groupData = await groupRes.json();
      if (teamData.team) setTeam(teamData.team);
      if (groupData.groups) setGroups(groupData.groups);
    } catch (err) {
      console.error("Failed to load team", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const resetMemberForm = () => {
    setName("");
    setRole("");
    setEmail("");
    setMemberStatus("online");
    setSelectedGroupId("");
    setEditingMemberId(null);
  };

  const resetGroupForm = () => {
    setGroupName("");
    setGroupDesc("");
    setEditingGroupId(null);
  };

  const openCreateMember = () => {
    resetMemberForm();
    setIsMemberModalOpen(true);
  };

  const openEditMember = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setName(member.name);
    setRole(member.role);
    setEmail(member.email);
    setMemberStatus(member.status);
    setSelectedGroupId(member.teamGroupId || "");
    setIsMemberModalOpen(true);
  };

  const openCreateGroup = () => {
    resetGroupForm();
    setIsGroupModalOpen(true);
  };

  const openEditGroup = (group: TeamGroup) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupDesc(group.description || "");
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setIsSaving(true);
    try {
      const isEdit = Boolean(editingGroupId);
      const url = isEdit ? `/api/team/groups/${editingGroupId}` : "/api/team/groups";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: groupName.trim(), description: groupDesc.trim() }),
      });
      const data = await res.json();
      if (data.group) {
        if (isEdit) {
          setGroups(groups.map((g) => (g.id === data.group.id ? data.group : g)));
        } else {
          setGroups([...groups, data.group]);
        }
        setIsGroupModalOpen(false);
        resetGroupForm();
      }
    } catch (err) {
      console.error("Failed to save squad", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (group: TeamGroup) => {
    if (!confirm(`Delete squad "${group.name}"? Members will move to unassigned.`)) return;
    try {
      const res = await fetch(`/api/team/groups/${group.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: buildAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setGroups(groups.filter((g) => g.id !== group.id));
        setTeam(
          team.map((m) =>
            m.teamGroupId === group.id ? { ...m, teamGroupId: null } : m
          )
        );
      }
    } catch (err) {
      console.error("Failed to delete squad", err);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !email.trim()) return;
    setIsSaving(true);
    try {
      const isEdit = Boolean(editingMemberId);
      const url = isEdit ? `/api/team/${editingMemberId}` : "/api/team";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name,
          role,
          email,
          status: memberStatus,
          teamGroupId: selectedGroupId || null,
        }),
      });
      const data = await res.json();
      if (data.member) {
        if (isEdit) {
          setTeam(team.map((m) => (m.id === data.member.id ? data.member : m)));
          setInviteNotice(null);
        } else {
          setTeam([...team, data.member]);
          if (data.invitation?.acceptUrl) {
            const hint = data.invitation.simulated
              ? `Invitation email simulated (SMTP not configured). Share this link: ${data.invitation.acceptUrl}`
              : `Invitation email sent to ${email}. They must accept before showing as active.`;
            setInviteNotice(hint);
          }
        }
        setIsMemberModalOpen(false);
        resetMemberForm();
        fetchTeam();
      }
    } catch (err) {
      console.error("Failed to save member", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendInvite = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/team/${member.id}/resend-invite`, {
        method: "POST",
        credentials: "include",
        headers: buildAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.invitation?.acceptUrl) {
        setInviteNotice(
          data.invitation.simulated
            ? `Resent (simulated). Share link: ${data.invitation.acceptUrl}`
            : `Invitation resent to ${member.email}.`
        );
      }
    } catch (err) {
      console.error("Failed to resend invite", err);
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.name} from the team directory?`)) return;
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: buildAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTeam(team.filter((m) => m.id !== member.id));
      }
    } catch (err) {
      console.error("Failed to delete member", err);
    }
  };

  const toggleAll = () => {
    if (selectedRows.size === team.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(team.map((m) => m.id)));
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const statusDot = (status: TeamMember["status"]) =>
    status === "online"
      ? "bg-[var(--nova-success)] animate-pulse"
      : status === "away"
      ? "bg-[var(--nova-warning)]"
      : status === "pending"
      ? "bg-purple-500 animate-pulse"
      : "bg-[var(--nova-text-muted)]";

  const renderMemberCard = (member: TeamMember) => (
    <div
      key={member.id}
      className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl p-4 flex flex-col gap-4 hover:border-[var(--nova-border-strong)] transition-all shadow-xs min-h-[220px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-[var(--nova-accent-subtle)] text-[var(--nova-accent)] font-bold border border-[var(--nova-accent-border)] flex items-center justify-center text-xs shrink-0">
            {member.initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--nova-text-primary)] truncate">{member.name}</h3>
            <p className="text-xs text-[var(--nova-text-secondary)] truncate">{member.role}</p>
            {member.teamGroupId && groupNameById[member.teamGroupId] && (
              <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-muted)]">
                {groupNameById[member.teamGroupId]}
              </span>
            )}
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${statusDot(member.status)}`} title={member.status} />
      </div>

      <div className="flex-1 p-3 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)] space-y-2 text-xs">
        {member.status === "pending" ? (
          <p className="text-center text-[var(--nova-text-muted)] italic font-mono py-2">Pending invitation</p>
        ) : (
          <>
            <div className="flex justify-between text-[var(--nova-text-secondary)]">
              <span>Active tasks</span>
              <span className="font-mono text-[var(--nova-text-primary)]">{member.activeTasksCount}</span>
            </div>
            <div className="flex justify-between gap-2 text-[var(--nova-text-secondary)]">
              <span>Email</span>
              <span className="font-mono text-[11px] text-[var(--nova-text-muted)] truncate">{member.email}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {canManageTeam && member.status === "pending" && (
          <button
            type="button"
            onClick={() => handleResendInvite(member)}
            className="w-full py-1.5 text-[10px] font-medium rounded-md border border-[var(--nova-accent-border)] text-[var(--nova-accent)] hover:bg-[var(--nova-accent-subtle)]"
          >
            Resend invitation email
          </button>
        )}
        <Link
          href="/app/tasks"
          className={`flex items-center justify-center gap-1 py-1.5 rounded-md border border-[var(--nova-border)] text-xs font-medium hover:bg-[var(--nova-deep)] ${canManageTeam ? "flex-1" : "w-full"}`}
        >
          Issues <ArrowUpRight className="w-3 h-3" />
        </Link>
        {canManageTeam && (
          <>
            <button
              type="button"
              onClick={() => openEditMember(member)}
              className="p-1.5 rounded-md border border-[var(--nova-border)] hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)]"
              title="Edit member"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMember(member)}
              className="p-1.5 rounded-md border border-[var(--nova-danger-border)] text-[var(--nova-danger-text)] hover:bg-[var(--nova-danger-subtle)]"
              title="Remove member"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (loading) return <TeamSkeleton />;

  return (
    <div className="min-h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Team Directory</h1>
            <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
              Manage squads and engineering members for this organization
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "members" && (
              <div className="flex items-center bg-[var(--nova-deep)] p-0.5 rounded border border-[var(--nova-border)]">
                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  className={`p-1 rounded ${viewMode === "card" ? "bg-[var(--nova-surface)] shadow-xs" : ""}`}
                  title="Card view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1 rounded ${viewMode === "table" ? "bg-[var(--nova-surface)] shadow-xs" : ""}`}
                  title="Table view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {canManageTeam &&
              (activeTab === "squads" ? (
                <button
                  type="button"
                  onClick={openCreateGroup}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] text-white rounded text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Squad
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreateMember}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] text-white rounded text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              ))}
          </div>
        </div>

        <div className="flex gap-1 border-b border-[var(--nova-border)]">
          <button
            type="button"
            onClick={() => setActiveTab("squads")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "squads"
                ? "border-[var(--nova-accent)] text-[var(--nova-accent)]"
                : "border-transparent text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
            }`}
          >
            <UsersRound className="w-3.5 h-3.5" />
            Squads ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "members"
                ? "border-[var(--nova-accent)] text-[var(--nova-accent)]"
                : "border-transparent text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
            }`}
          >
            <UserCircle2 className="w-3.5 h-3.5" />
            Members ({team.length})
          </button>
        </div>
      </div>

      {inviteNotice && (
        <div className="rounded-lg border border-[var(--nova-accent-border)] bg-[var(--nova-accent-subtle)] px-4 py-3 text-xs text-[var(--nova-text-primary)] flex justify-between gap-3">
          <span className="break-all">{inviteNotice}</span>
          <button type="button" className="shrink-0 text-[var(--nova-text-muted)]" onClick={() => setInviteNotice(null)}>Dismiss</button>
        </div>
      )}

      {activeTab === "squads" && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--nova-border)] bg-[var(--nova-surface)] p-8 text-center space-y-3">
              <UsersRound className="w-8 h-8 mx-auto text-[var(--nova-text-muted)]" />
              <p className="text-sm text-[var(--nova-text-secondary)]">No squads yet. Create one to organize your team.</p>
              {canManageTeam && (
                <button type="button" onClick={openCreateGroup} className="text-xs text-[var(--nova-accent)] font-medium">
                  + Create first squad
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.map((group) => {
                const count = team.filter((m) => m.teamGroupId === group.id).length;
                return (
                  <div
                    key={group.id}
                    className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl p-4 flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold">{group.name}</h2>
                        <p className="text-[11px] text-[var(--nova-text-muted)] mt-1 line-clamp-2 min-h-[2rem]">
                          {group.description || "No description"}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--nova-deep)] border border-[var(--nova-border)]">
                        {count} members
                      </span>
                    </div>
                    {canManageTeam && (
                      <div className="flex gap-2 pt-2 border-t border-[var(--nova-border)]">
                        <button
                          type="button"
                          onClick={() => openEditGroup(group)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md border border-[var(--nova-border)] hover:bg-[var(--nova-deep)]"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-md border border-[var(--nova-danger-border)] text-[var(--nova-danger-text)] hover:bg-[var(--nova-danger-subtle)]"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <>
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {team.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-[var(--nova-border)] p-8 text-center text-sm text-[var(--nova-text-secondary)]">
                  No team members yet. Click <strong>Add Member</strong> to invite someone.
                </div>
              ) : (
                team.map((member) => renderMemberCard(member))
              )}
            </div>
          ) : (
            <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg overflow-x-auto shadow-xs">
              <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                <thead>
                  <tr className="border-b border-[var(--nova-border)] bg-[var(--nova-deep)] text-[11px] uppercase tracking-wider text-[var(--nova-text-muted)]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedRows.size > 0 && selectedRows.size === team.length}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Squad</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tasks</th>
                    {canManageTeam && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--nova-border)]">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-[var(--nova-deep)]/60">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(member.id)}
                          onChange={() => toggleRow(member.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">{member.name}</td>
                      <td className="py-3 px-4 text-[var(--nova-text-muted)]">
                        {member.teamGroupId ? groupNameById[member.teamGroupId] || "—" : "Unassigned"}
                      </td>
                      <td className="py-3 px-4">{member.role}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">{member.email}</td>
                      <td className="py-3 px-4 capitalize">{member.status}</td>
                      <td className="py-3 px-4 text-right font-mono">{member.activeTasksCount}</td>
                      {canManageTeam && (
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => openEditMember(member)} className="p-1 rounded hover:bg-[var(--nova-deep)]">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member)}
                              className="p-1 rounded text-[var(--nova-danger-text)] hover:bg-[var(--nova-danger-subtle)]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => { setIsMemberModalOpen(false); resetMemberForm(); }} />
          <div className="relative w-full max-w-md bg-[var(--nova-surface)] border border-[var(--nova-border-strong)] rounded-xl shadow-2xl p-5 z-10 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--nova-border)] mb-4">
              <span className="text-sm font-semibold">{editingMemberId ? "Edit Member" : "Add Member"}</span>
              <button type="button" onClick={() => { setIsMemberModalOpen(false); resetMemberForm(); }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="space-y-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] text-xs"
              />
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role"
                className="w-full px-3 py-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] text-xs"
              />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] text-xs"
              />
              <select
                value={memberStatus}
                onChange={(e) => setMemberStatus(e.target.value as TeamMember["status"])}
                className="w-full px-3 py-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] text-xs"
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] text-xs"
              >
                <option value="">Unassigned squad</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsMemberModalOpen(false); resetMemberForm(); }}>Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 rounded bg-[var(--nova-accent)] text-white">
                  {isSaving ? "Saving…" : editingMemberId ? "Save changes" : "Add member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => { setIsGroupModalOpen(false); resetGroupForm(); }} />
          <div className="relative w-full max-w-md bg-[var(--nova-surface)] border border-[var(--nova-border-strong)] rounded-xl shadow-2xl p-5 z-10 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--nova-border)] mb-4">
              <span className="text-sm font-semibold">{editingGroupId ? "Edit Squad" : "Create Squad"}</span>
              <button type="button" onClick={() => { setIsGroupModalOpen(false); resetGroupForm(); }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveGroup} className="space-y-3">
              <input
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Squad name"
                className="w-full px-3 py-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] text-xs"
              />
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] text-xs resize-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsGroupModalOpen(false); resetGroupForm(); }}>Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 rounded bg-[var(--nova-accent)] text-white">
                  {isSaving ? "Saving…" : editingGroupId ? "Save squad" : "Create squad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
