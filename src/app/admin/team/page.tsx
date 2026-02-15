"use client";

import { useEffect, useState } from "react";
import type { Admin } from "@/lib/supabase";
import { UserPlus, Trash2, Shield, ShieldCheck, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLE_CONFIG = {
  owner: { label: "Owner", icon: ShieldCheck, className: "bg-amber-100 text-amber-800" },
  admin: { label: "Admin", icon: Shield, className: "bg-blue-100 text-blue-800" },
  announcer: { label: "Announcer", icon: Megaphone, className: "bg-green-100 text-green-800" },
} as const;

export default function TeamPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<Admin["role"]>("admin");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "announcer">("admin");
  const [formPassword, setFormPassword] = useState("");

  const isOwner = currentRole === "owner";

  const fetchTeam = async () => {
    try {
      const response = await fetch("/api/admin/team");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch team");
      }
      const data = await response.json();
      setAdmins(data.admins || []);
      setCurrentAdminId(data.currentAdminId);
      const me = (data.admins || []).find(
        (a: Admin) => a.id === data.currentAdminId
      );
      if (me) setCurrentRole(me.role);
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormRole("admin");
    setFormPassword("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          password: formPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add team member");
      }

      toast.success(`${formName.trim()} has been added to the team`);
      setShowAddDialog(false);
      resetForm();
      fetchTeam();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add team member"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (target: Admin) => {
    if (
      !window.confirm(
        `Remove ${target.name} (${target.email}) from the team? This will revoke their admin access.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/team?id=${target.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove team member");
      }

      toast.success(`${target.name} has been removed`);
      fetchTeam();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove team member"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground">
            {admins.length} member{admins.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Add Team Member
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="team-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Full Name
                </label>
                <input
                  id="team-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ahmed Khan"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="team-email"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Email
                </label>
                <input
                  id="team-email"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ahmed@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="team-role"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Role
                </label>
                <select
                  id="team-role"
                  value={formRole}
                  onChange={(e) =>
                    setFormRole(e.target.value as "admin" | "announcer")
                  }
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="admin">Admin - Full dashboard access</option>
                  <option value="announcer">
                    Announcer - Announcements only
                  </option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="team-password"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Temporary Password
                </label>
                <input
                  id="team-password"
                  type="text"
                  required
                  minLength={8}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Share this password with the new member. They can log in at
                  /admin.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Added
                </th>
                {isOwner && (
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isOwner ? 5 : 4}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Loading team...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td
                    colSpan={isOwner ? 5 : 4}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No team members found
                  </td>
                </tr>
              ) : (
                admins.map((member) => {
                  const roleConfig = ROLE_CONFIG[member.role];
                  const isMe = member.id === currentAdminId;
                  const canDelete =
                    isOwner && !isMe && member.role !== "owner";

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {member.name}
                          </span>
                          {isMe && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${roleConfig.className}`}
                        >
                          <roleConfig.icon className="w-3 h-3" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-right">
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(member)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
