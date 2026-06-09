"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Filter, MoreVertical, Shield, UserX, CheckCircle2, XCircle, BadgeCheck, Eye, FileText, ExternalLink, AlertTriangle, Image as ImageIcon } from "lucide-react";
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

interface VerificationDoc {
  name: string;
  url: string;
  type: string;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  isVerified: boolean;
  isApproved: boolean;
  xp?: number;
  createdAt: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
  verificationStatus?: "incomplete" | "pending" | "approved" | "rejected";
  verificationDocuments?: VerificationDoc[];
  rejectionReason?: string;
}

export default function AdminUsersPage() {
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
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage all platform users</p>
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
            <SelectItem value="admin">Admins</SelectItem>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden xl:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
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
                      <Badge variant={user.role === "teacher" ? "purple" : user.role === "admin" ? "destructive" : "blue"} className="capitalize">
                        {user.role}
                      </Badge>
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
                            {!user.isVerified && (
                              <DropdownMenuItem
                                onClick={() => patchUser(user._id, { isVerified: true }, `${user.name} verified`)}
                              >
                                <BadgeCheck className="h-4 w-4 mr-2" /> Verify User
                              </DropdownMenuItem>
                            )}
                            {user.role !== "admin" && (
                              <DropdownMenuItem
                                onClick={() => patchUser(user._id, { role: "admin", isApproved: true }, `${user.name} is now an admin`)}
                              >
                                <Shield className="h-4 w-4 mr-2" /> Make Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => deleteUser(user._id)}
                            >
                              <UserX className="h-4 w-4 mr-2" /> Remove User
                            </DropdownMenuItem>
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

      {/* Teacher profile review */}
      <Dialog open={!!reviewUser} onOpenChange={(open) => !open && setReviewUser(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher verification</DialogTitle>
          </DialogHeader>

          {reviewUser && (
            <div className="space-y-5">
              {/* Identity */}
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={reviewUser.avatar} />
                  <AvatarFallback className="gradient-bg text-white font-bold">
                    {getInitials(reviewUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold">{reviewUser.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{reviewUser.email}</p>
                </div>
              </div>

              {/* Photo presence */}
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                {reviewUser.avatar ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Profile photo provided</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">No profile photo</span>
                )}
              </div>

              {reviewUser.bio && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{reviewUser.bio}</p>
              )}

              {reviewUser.expertise && reviewUser.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reviewUser.expertise.map((e) => (
                    <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                  ))}
                </div>
              )}

              {/* Documents */}
              <div>
                <p className="text-sm font-medium mb-2">Proof documents</p>
                {reviewUser.verificationDocuments && reviewUser.verificationDocuments.length > 0 ? (
                  <ul className="space-y-2">
                    {reviewUser.verificationDocuments.map((d) => (
                      <li key={d.url} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2">
                        <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                        <span className="text-sm flex-1 truncate">{d.name}</span>
                        <a href={d.url} target="_blank" rel="noopener noreferrer" title="Open">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> No documents uploaded.
                  </p>
                )}
              </div>

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
