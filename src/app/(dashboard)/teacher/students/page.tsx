"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Search, Loader2, UserX, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface StudentRow {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  tutoring?: boolean;
  classes: { _id: string; title: string; subject: string }[];
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/teacher/students");
        const json = await res.json();
        if (json.success) setStudents(json.data.students);
        else toast.error(json.error || "Failed to load students");
      } catch {
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, query]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            All students enrolled in your classes. Accept new requests from{" "}
            <Link href="/teacher/classes" className="text-[hsl(var(--primary))] underline-offset-2 hover:underline">
              My Classes
            </Link>
            .
          </p>
        </div>
        <Link href="/teacher/groups">
          <Button variant="gradient">
            <Users className="h-4 w-4" /> Manage Groups
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-50">
            <UserX className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {students.length === 0 ? "No students yet" : "No matches"}
          </h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm">
            {students.length === 0
              ? "Once you accept join requests, your enrolled students will appear here."
              : "Try a different name or email."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {filtered.length} student{filtered.length === 1 ? "" : "s"}
          </p>
          {filtered.map((s) => (
            <Link
              key={s._id}
              href={`/teacher/students/${s._id}`}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-[hsl(var(--primary))]/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={s.avatar} />
                  <AvatarFallback className="text-xs">{getInitials(s.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{s.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {s.tutoring && <Badge variant="purple">Tutorat</Badge>}
                {s.classes.map((c) => (
                  <Badge key={c._id} variant="secondary" title={c.subject}>
                    {c.title}
                  </Badge>
                ))}
                <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
