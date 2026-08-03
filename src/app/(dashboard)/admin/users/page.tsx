"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Filter, MoreVertical, Shield, ShieldOff, UserX, CheckCircle2, XCircle, BadgeCheck, Eye, FileText, ExternalLink, AlertTriangle, Image as ImageIcon, Globe, AtSign, Link2, Hash, Calendar, Sparkles, BookOpen, KeyRound, Copy, Check, RefreshCw, Loader2, Mail, Send, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, formatDate } from "@/lib/utils";
import { canManageUser, isAdmin, isSuperAdmin } from "@/lib/roles";
import { useAuthStore } from "@/stores/useAuthStore";

interface VerificationDoc {
  name: string;
  url: string;
  type: string;
}

interface TeachingProfile {
  institution?: string;
  headline?: string;
  subjects?: string[];
  levels?: string[];
  availability?: { day: string; from: string; to: string }[];
  hourlyRate?: number;
  experienceYears?: number;
}

interface StudentProfile {
  stage?: string;
  year?: string;
  section?: string;
  governorate?: string;
}

interface LinkedParent {
  _id: string;
  name: string;
  email: string;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  studentProfile?: StudentProfile;
  role: "student" | "teacher" | "admin" | "parent" | "superadmin";
  provider?: "local" | "google" | "facebook";
  isVerified: boolean;
  isApproved: boolean;
  xp?: number;
  level?: number;
  createdAt: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
  badges?: string[];
  socialLinks?: { website?: string; twitter?: string; linkedin?: string };
  enrolledCourses?: string[];
  createdCourses?: string[];
  teachingProfile?: TeachingProfile;
  verificationStatus?: "incomplete" | "pending" | "approved" | "rejected";
  verificationDocuments?: VerificationDoc[];
  rejectionReason?: string;
}

function TeachingDetails({ profile }: { profile: TeachingProfile }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 space-y-2 text-sm">
      {profile.headline && <p className="font-medium">{profile.headline}</p>}
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        <span className="text-[hsl(var(--muted-foreground))]">Établissement</span>
        <span>{profile.institution || "—"}</span>

        <span className="text-[hsl(var(--muted-foreground))]">Matières</span>
        <span className="flex flex-wrap gap-1">
          {profile.subjects?.length
            ? profile.subjects.map((s) => (
                <Badge key={s} variant="purple" className="text-[10px]">{s}</Badge>
              ))
            : "—"}
        </span>

        <span className="text-[hsl(var(--muted-foreground))]">Niveaux</span>
        <span className="flex flex-wrap gap-1">
          {profile.levels?.length
            ? profile.levels.map((l) => (
                <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
              ))
            : "—"}
        </span>

        <span className="text-[hsl(var(--muted-foreground))]">Disponibilités</span>
        <span className="flex flex-col gap-0.5">
          {profile.availability?.length
            ? profile.availability.map((a) => (
                <span key={a.day}>{a.day} : {a.from}–{a.to}</span>
              ))
            : "—"}
        </span>

        <span className="text-[hsl(var(--muted-foreground))]">Tarif</span>
        <span>{profile.hourlyRate ? `${profile.hourlyRate} DT/h` : "—"}</span>

        <span className="text-[hsl(var(--muted-foreground))]">Expérience</span>
        <span>{profile.experienceYears ? `${profile.experienceYears} ans` : "—"}</span>
      </div>
    </div>
  );
}

function DocumentsList({ docs }: { docs?: VerificationDoc[] }) {
  if (!docs || docs.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4" /> No documents uploaded.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <li key={d.url} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2">
          <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
          <span className="text-sm flex-1 truncate">{d.name}</span>
          <a href={d.url} target="_blank" rel="noopener noreferrer" title="Open">
            <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
          </a>
        </li>
      ))}
    </ul>
  );
}

function TeacherDetails({ user }: { user: AdminUser }) {
  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="gradient-bg text-white font-bold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{user.email}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        {user.verificationStatus === "pending" ? (
          <Badge variant="warning">Pending review</Badge>
        ) : user.verificationStatus === "rejected" ? (
          <Badge variant="destructive">Changes requested</Badge>
        ) : user.isApproved ? (
          <Badge variant="success">Approved</Badge>
        ) : (
          <Badge variant="secondary">Incomplete</Badge>
        )}
        <Badge variant={user.isVerified ? "success" : "secondary"}>
          {user.isVerified ? "Verified" : "Unverified"}
        </Badge>
        <Badge variant={user.avatar ? "success" : "secondary"} className="gap-1">
          <ImageIcon className="h-3 w-3" /> {user.avatar ? "Photo" : "No photo"}
        </Badge>
      </div>

      {/* Account meta */}
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined</span>
        <span>{formatDate(user.createdAt)}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> XP / Level</span>
        <span>{user.xp ?? 0} XP · Niveau {user.level ?? 1}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Cours créés</span>
        <span>{user.createdCourses?.length ?? 0}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> User ID</span>
        <span className="font-mono text-xs break-all">{user._id}</span>
      </div>

      {/* Rejection reason (if previously rejected) */}
      {user.verificationStatus === "rejected" && user.rejectionReason && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-red-700 dark:text-red-400">Changes requested</p>
            <p className="text-[hsl(var(--muted-foreground))]">{user.rejectionReason}</p>
          </div>
        </div>
      )}

      {user.bio && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{user.bio}</p>
      )}

      {user.expertise && user.expertise.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Expertise</p>
          <div className="flex flex-wrap gap-1.5">
            {user.expertise.map((e) => (
              <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
            ))}
          </div>
        </div>
      )}

      {user.badges && user.badges.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Badges</p>
          <div className="flex flex-wrap gap-1.5">
            {user.badges.map((b) => (
              <Badge key={b} variant="purple" className="text-xs">{b}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      {(user.socialLinks?.website || user.socialLinks?.twitter || user.socialLinks?.linkedin) && (
        <div>
          <p className="text-sm font-medium mb-2">Contact</p>
          <div className="flex flex-col gap-1.5 text-sm">
            {user.socialLinks.website && (
              <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[hsl(var(--primary))] hover:underline">
                <Globe className="h-4 w-4 shrink-0" /> <span className="truncate">{user.socialLinks.website}</span>
              </a>
            )}
            {user.socialLinks.twitter && (
              <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[hsl(var(--primary))] hover:underline">
                <AtSign className="h-4 w-4 shrink-0" /> <span className="truncate">{user.socialLinks.twitter}</span>
              </a>
            )}
            {user.socialLinks.linkedin && (
              <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[hsl(var(--primary))] hover:underline">
                <Link2 className="h-4 w-4 shrink-0" /> <span className="truncate">{user.socialLinks.linkedin}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Teaching details */}
      {user.teachingProfile && <TeachingDetails profile={user.teachingProfile} />}

      {/* Documents */}
      <div>
        <p className="text-sm font-medium mb-2">Proof documents</p>
        <DocumentsList docs={user.verificationDocuments} />
      </div>
    </div>
  );
}

// The student's parent-link code lives here and nowhere else: the student never
// sees it. An admin reads it, sends it to the parent (by email or by hand), and
// can rotate it if it leaks.
function ParentLinkSection({ student }: { student: AdminUser }) {
  const [code, setCode] = useState("");
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const inviteUrl = code ? `${window.location.origin}/register/parent?code=${code}` : "";

  const load = useCallback(async (method: "GET" | "POST") => {
    try {
      const res = await fetch(`/api/admin/users/${student._id}/link-code`, { method });
      const json = await res.json();
      if (json.success) {
        setCode(json.data.code);
        setParents(json.data.parents || []);
      } else {
        toast.error(json.error || "Failed to load the code");
      }
    } catch {
      toast.error("Failed to load the code");
    } finally {
      setLoading(false);
      setRotating(false);
    }
  }, [student._id]);

  // Deferred a tick so the fetch never sets state synchronously on mount —
  // same pattern as the debounced user search below.
  useEffect(() => {
    const t = setTimeout(() => load("GET"), 0);
    return () => clearTimeout(t);
  }, [load]);

  const copy = (value: string, what: "code" | "link") => {
    navigator.clipboard.writeText(value);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
    toast.success(what === "code" ? "Code copied" : "Invite link copied");
  };

  const rotate = () => {
    if (!confirm("Generate a new code? The current one will stop working.")) return;
    setRotating(true);
    load("POST");
  };

  const invite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/admin/users/${student._id}/invite-parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Could not send the invitation"); return; }
      toast.success(`Invitation sent to ${email.trim()}`);
      setEmail("");
    } catch {
      toast.error("Could not send the invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4 space-y-3">
      <p className="text-sm font-medium flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[hsl(var(--primary))]" /> Parent link code
      </p>

      {loading ? (
        <div className="py-3 flex justify-center text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-center text-lg font-mono font-bold tracking-[0.3em] bg-[hsl(var(--background))] rounded-xl py-2.5 select-all">
              {code}
            </code>
            <Button variant="outline" size="icon" onClick={() => copy(code, "code")} title="Copy code">
              {copied === "code" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={rotate} disabled={rotating} title="New code">
              <RefreshCw className={`h-4 w-4 ${rotating ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => copy(inviteUrl, "link")}>
            {copied === "link" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
            Copy the parent sign-up link
          </Button>

          {/* Send it straight to the parent */}
          <div className="pt-3 border-t border-[hsl(var(--border))]">
            <p className="text-xs font-medium flex items-center gap-1.5 mb-2">
              <Mail className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Send to the parent
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") invite(); }}
              />
              <Button variant="outline" onClick={invite} loading={inviting} disabled={!email.trim() || inviting}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Who is already following this student */}
          <div className="pt-3 border-t border-[hsl(var(--border))]">
            <p className="text-xs font-medium mb-2">
              Linked parents {parents.length > 0 && `(${parents.length})`}
            </p>
            {parents.length === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">No parent linked yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {parents.map((p) => (
                  <li key={p._id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="gradient-bg text-white text-[10px] font-bold">
                        {getInitials(p.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{p.name}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">{p.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StudentDetails({ user }: { user: AdminUser }) {
  const sp = user.studentProfile;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="gradient-bg text-white font-bold">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Niveau</span>
        <span>{sp?.stage || "—"}{sp?.year ? ` · ${sp.year}` : ""}{sp?.section ? ` · ${sp.section}` : ""}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Gouvernorat</span>
        <span>{sp?.governorate || "—"}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined</span>
        <span>{formatDate(user.createdAt)}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> XP / Level</span>
        <span>{user.xp ?? 0} XP · Niveau {user.level ?? 1}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Cours suivis</span>
        <span>{user.enrolledCourses?.length ?? 0}</span>

        <span className="text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> User ID</span>
        <span className="font-mono text-xs break-all">{user._id}</span>
      </div>

      <ParentLinkSection student={user} />
    </div>
  );
}

// Role chip colours — super admins stand out from ordinary admins.
function RoleBadge({ role }: { role: AdminUser["role"] }) {
  const variant =
    role === "superadmin" ? "warning" :
    role === "admin" ? "destructive" :
    role === "teacher" ? "purple" :
    role === "parent" ? "secondary" :
    "blue";
  return (
    <Badge variant={variant} className="capitalize gap-1">
      {role === "superadmin" && <Shield className="h-3 w-3" />}
      {role === "superadmin" ? "Super admin" : role}
    </Badge>
  );
}

export default function AdminUsersPage() {
  const { user: me } = useAuthStore();
  const superAdmin = isSuperAdmin(me?.role);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
      } else {
        toast.error(json.error || "Failed to load users");
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  // Debounce search / refetch on filter change.
  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const patchUser = async (id: string, update: Partial<AdminUser>, successMsg: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...update } : u)));
        toast.success(successMsg);
      } else {
        toast.error(json.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        toast.success("User removed");
      } else {
        toast.error(json.error || "Failed to remove user");
      }
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [reviewUser, setReviewUser] = useState<AdminUser | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const openReview = (u: AdminUser) => {
    setRejectMessage("");
    setReviewUser(u);
  };

  const submitReview = async (action: "approve" | "reject") => {
    if (!reviewUser) return;
    if (action === "reject" && !rejectMessage.trim()) {
      toast.error("Explain what is missing so the teacher can fix it");
      return;
    }
    setReviewing(true);
    try {
      const res = await fetch(`/api/admin/users/${reviewUser._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message: rejectMessage }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.map((u) => (u._id === reviewUser._id ? { ...u, ...json.data.user } : u)));
        toast.success(action === "approve" ? `${reviewUser.name} approved` : "Feedback sent to teacher");
        setReviewUser(null);
        setRejectMessage("");
      } else {
        toast.error(json.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          {superAdmin
            ? "Manage every account on the platform, administrators included"
            : "Manage all platform users"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="parent">Parents</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="superadmin">Super admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden lg:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden lg:table-cell">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden xl:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  // A plain admin can only act on non-admin accounts; a super
                  // admin can act on anyone but themselves.
                  const manageable = canManageUser(me?.role, user.role) && user._id !== me?._id;
                  return (
                  <tr key={user._id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {user.role === "teacher" ? (
                        user.verificationStatus === "pending" ? (
                          <Badge variant="warning">Pending review</Badge>
                        ) : user.verificationStatus === "rejected" ? (
                          <Badge variant="destructive">Changes requested</Badge>
                        ) : user.isApproved ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Incomplete</Badge>
                        )
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge
                        variant={user.provider === "google" ? "blue" : user.provider === "facebook" ? "purple" : "secondary"}
                        className="capitalize"
                      >
                        {user.provider === "google" ? "Google" : user.provider === "facebook" ? "Facebook" : "Email"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))] hidden xl:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === "teacher" && (
                          <Button
                            size="sm"
                            variant={user.verificationStatus === "pending" ? "gradient" : "outline"}
                            className="h-7 text-xs"
                            onClick={() => openReview(user)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Review
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(user.role === "teacher" || user.role === "student") && (
                              <DropdownMenuItem onClick={() => setViewUser(user)}>
                                <Eye className="h-4 w-4 mr-2" /> View details
                              </DropdownMenuItem>
                            )}
                            {user.role === "teacher" && (
                              user.isApproved ? (
                                <DropdownMenuItem
                                  onClick={() => patchUser(user._id, { isApproved: false }, `${user.name}'s access revoked`)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Revoke Approval
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => patchUser(user._id, { isApproved: true }, `${user.name} approved`)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Teacher
                                </DropdownMenuItem>
                              )
                            )}
                            {!user.isVerified && manageable && (
                              <DropdownMenuItem
                                onClick={() => patchUser(user._id, { isVerified: true }, `${user.name} verified`)}
                              >
                                <BadgeCheck className="h-4 w-4 mr-2" /> Verify User
                              </DropdownMenuItem>
                            )}
                            {/* Granting or revoking admin rights is reserved for super admins.
                                The super admin role itself is only set in the database. */}
                            {superAdmin && manageable && !isAdmin(user.role) && (
                              <DropdownMenuItem
                                onClick={() => patchUser(user._id, { role: "admin", isApproved: true }, `${user.name} is now an admin`)}
                              >
                                <Shield className="h-4 w-4 mr-2" /> Make Admin
                              </DropdownMenuItem>
                            )}
                            {superAdmin && manageable && user.role === "admin" && (
                              <DropdownMenuItem
                                onClick={() => patchUser(user._id, { role: "student" }, `${user.name} is no longer an admin`)}
                              >
                                <ShieldOff className="h-4 w-4 mr-2" /> Revoke Admin
                              </DropdownMenuItem>
                            )}
                            {manageable ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-500 focus:text-red-500"
                                  onClick={() => deleteUser(user._id)}
                                >
                                  <UserX className="h-4 w-4 mr-2" /> Remove User
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem disabled>
                                {user._id === me?._id ? "This is your account" : "Super admin only"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Read-only profile: teacher verification, or student + parent code */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewUser?.role === "student" ? "Student details" : "Teacher details"}
            </DialogTitle>
          </DialogHeader>

          {viewUser && (
            viewUser.role === "student"
              ? <StudentDetails user={viewUser} />
              : <TeacherDetails user={viewUser} />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher profile review */}
      <Dialog open={!!reviewUser} onOpenChange={(open) => !open && setReviewUser(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher verification</DialogTitle>
          </DialogHeader>

          {reviewUser && (
            <div className="space-y-5">
              <TeacherDetails user={reviewUser} />

              {/* Rejection message */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Message to teacher (required to reject)</p>
                <Textarea
                  placeholder="Explain what is missing or incorrect, e.g. 'Your diploma is unreadable, please upload a clearer copy.'"
                  className="min-h-[90px]"
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600"
              onClick={() => submitReview("reject")}
              disabled={reviewing}
            >
              <XCircle className="h-4 w-4" /> Reject &amp; notify
            </Button>
            <Button variant="gradient" onClick={() => submitReview("approve")} loading={reviewing}>
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
