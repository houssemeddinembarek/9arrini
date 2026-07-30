"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Mail, Globe, AtSign, Link2, Camera, Save,
  BookOpen, Award, GraduationCap,
  Clock, Zap, ChevronRight, ArrowRight, Video,
  Upload, FileText, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Loader2, Image as ImageIcon, ExternalLink,
  Building2, Briefcase, Wallet, CalendarDays, BookMarked, ChevronDown, GraduationCap as GradCap, Layers, Check, BookOpenCheck,
  Users, Eye, LayoutDashboard, Settings, LogOut, ClipboardList,
  Hourglass, XCircle, Search, PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentAssignments } from "@/components/assignments/student-assignments";
import { LinkParentCard } from "@/components/parent/link-parent-card";
import { useAuthStore } from "@/stores/useAuthStore";
import { useDict } from "@/lib/i18n/context";
import { getInitials, cn, isMeetingEnded } from "@/lib/utils";
import { SUBJECTS, CLASS_LEVELS, WEEKDAYS } from "@/lib/tunisia-education";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface VerificationDoc {
  name: string;
  url: string;
  type: string;
  uploadedAt?: string;
}

interface AvailabilitySlot {
  day: string;
  from: string;
  to: string;
}

interface TeachingProfile {
  institution?: string;
  headline?: string;
  subjects?: string[];
  levels?: string[];
  availability?: AvailabilitySlot[];
  hourlyRate?: number;
  experienceYears?: number;
}

interface FullProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  xp?: number;
  level?: number;
  badges?: string[];
  isApproved?: boolean;
  teachingProfile?: TeachingProfile;
  verificationStatus?: "incomplete" | "pending" | "approved" | "rejected";
  verificationDocuments?: VerificationDoc[];
  rejectionReason?: string;
}

function TutorCardPreview({
  name, avatar, bio, headline, subjects, levels, availability, hourlyRate, experienceYears, verified,
}: {
  name: string;
  avatar?: string;
  bio?: string;
  headline?: string;
  subjects: string[];
  levels: string[];
  availability: AvailabilitySlot[];
  hourlyRate: string;
  experienceYears: string;
  verified: boolean;
}) {
  const specialty = subjects[0] || "Matière";
  const levelLabel = levels.length ? `${levels.length} niveau${levels.length > 1 ? "x" : ""}` : "Niveaux à définir";
  const days = availability.map((a) => a.day);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="gradient-bg text-white text-xl font-bold">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate">{name}</h3>
            {verified && <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Badge variant="purple">{specialty}</Badge>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{levelLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {experienceYears ? (
              <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                <Briefcase className="h-3.5 w-3.5" />
                {experienceYears} ans d&apos;exp.
              </div>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Nouveau profil</Badge>
            )}
            <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
              <Users className="h-3.5 w-3.5" /> 0 élève
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold">{hourlyRate || "—"} DT</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">/ heure</p>
        </div>
      </div>

      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2 min-h-[2.5rem]">
        {bio || headline || "Ajoutez une bio pour vous présenter aux élèves."}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[1.75rem]">
        {subjects.length ? (
          subjects.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)
        ) : (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Vos matières apparaîtront ici.</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          <CalendarDays className="h-3.5 w-3.5" />
          {days.length ? `Dispo : ${days.join(", ")}` : "Disponibilités à définir"}
        </div>
        <Button variant="gradient" size="sm" disabled>
          Réserver <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

interface EnrolledCourse {
  enrollmentId: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  certificateIssued: boolean;
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  level: string;
}

interface UpcomingMeeting {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: "online" | "in-person" | "hybrid";
  group?: { name: string };
  teacher?: { name: string };
  recordingUrl?: string;
}

// The action shown for a meeting: join while live, watch the recording once it
// has ended (played in place so the student stays on this screen), or a disabled
// "Terminé" when there's nothing to replay.
function MeetingAction({ m }: { m: UpcomingMeeting }) {
  const t = useDict().profile.meetings;
  const [playing, setPlaying] = useState(false);

  if (m.type === "in-person") return null;

  if (isMeetingEnded(m.date, m.startTime, m.endTime)) {
    if (!m.recordingUrl) {
      return <Button size="sm" variant="outline" className="shrink-0" disabled>{t.ended}</Button>;
    }
    return (
      <>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => setPlaying(true)}>
          <PlayCircle className="h-3.5 w-3.5" /> {t.recording}
        </Button>
        {playing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPlaying(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-white font-semibold truncate">{m.title}</h3>
                <button onClick={() => setPlaying(false)} title={t.close} className="text-white/80 hover:text-white shrink-0">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <video src={m.recordingUrl} controls autoPlay className="w-full rounded-xl bg-black max-h-[80vh]" />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Link href={`/profile/meetings/${m._id}`} className="shrink-0">
      <Button size="sm" variant="gradient"><Video className="h-3.5 w-3.5" /> {t.join}</Button>
    </Link>
  );
}

interface TutoringReservation {
  _id: string;
  status: "pending" | "accepted" | "rejected";
  createdAt?: string;
  teacher?: { _id: string; name: string; avatar?: string };
}

// Maps a reservation status to the visual progress shown to the student. Labels
// are resolved from the active dictionary at render time (see RESERVATION_STEP_KEYS).
const RESERVATION_STEP_KEYS = ["sent", "waiting", "replied"] as const;
function reservationProgress(status: TutoringReservation["status"]) {
  if (status === "accepted") return { value: 100, step: 3, statusKey: "accepted" as const, tone: "success" as const, Icon: CheckCircle2 };
  if (status === "rejected") return { value: 100, step: 3, statusKey: "rejected" as const, tone: "destructive" as const, Icon: XCircle };
  return { value: 50, step: 2, statusKey: "waiting" as const, tone: "warning" as const, Icon: Hourglass };
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const t = useDict().profile;
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<"overview" | "courses" | "assignments" | "tutoring" | "meetings" | "profile">("overview");
  const isStudent = !user?.role || user.role === "student";
  const isTeacher = user?.role === "teacher";

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState(0);
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [reservations, setReservations] = useState<TutoringReservation[]>([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success) setProfile(json.data.user);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Load the student's real enrolled courses and upcoming meetings.
  useEffect(() => {
    if (!isStudent) return;
    let active = true;
    (async () => {
      try {
        const [cRes, mRes, rRes] = await Promise.all([
          fetch("/api/student/courses"),
          fetch("/api/meetings?upcoming=true"),
          fetch("/api/tutoring/requests"),
        ]);
        const cJson = await cRes.json();
        const mJson = await mRes.json();
        const rJson = await rRes.json();
        if (!active) return;
        if (cJson.success) {
          setEnrolledCourses(cJson.data.courses);
          setCertificates(cJson.data.certificates);
        }
        if (mJson.success) setUpcomingMeetings(mJson.data.meetings);
        if (rJson.success) setReservations(rJson.data.requests);
      } catch {
        /* ignore */
      } finally {
        if (active) setStudentLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isStudent]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/users/avatar", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        setProfile((p) => (p ? { ...p, avatar: json.data.avatar } : p));
        if (user) setUser({ ...user, avatar: json.data.avatar });
        toast.success(t.toasts.avatarUpdated);
      } else {
        toast.error(json.error || t.toasts.uploadFailed);
      }
    } catch {
      toast.error(t.toasts.genericError);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/teacher/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data.user);
        toast.success("Document ajouté");
      } else {
        toast.error(json.error || "Échec du téléversement");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDoc = async (url: string) => {
    try {
      const res = await fetch(`/api/teacher/documents?url=${encodeURIComponent(url)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) setProfile(json.data.user);
      else toast.error(json.error || "Échec de la suppression");
    } catch {
      toast.error("Une erreur est survenue");
    }
  };

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/verification", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await refreshProfile();
        toast.success("Profil soumis pour vérification");
      } else {
        toast.error(json.error || "Échec de la soumission");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Teaching profile (tutor card details) ----
  const [teaching, setTeaching] = useState({
    institution: "",
    headline: "",
    subjects: [] as string[],
    levels: [] as string[],
    availability: [] as AvailabilitySlot[],
    hourlyRate: "",
    experienceYears: "",
  });
  const [openStages, setOpenStages] = useState<string[]>([]);
  const [savingTeaching, setSavingTeaching] = useState(false);
  // Seed the teaching form from the saved profile only once. Avatar/document
  // uploads call setProfile() too, and re-seeding on every profile change would
  // wipe the teacher's in-progress edits before they hit "Save".
  const teachingSeeded = useRef(false);

  useEffect(() => {
    if (!profile || teachingSeeded.current) return;
    teachingSeeded.current = true;
    const tp = profile.teachingProfile;
    const levels = tp?.levels || [];
    setTeaching({
      institution: tp?.institution || "",
      headline: tp?.headline || "",
      subjects: tp?.subjects || [],
      levels,
      availability: tp?.availability || [],
      hourlyRate: tp?.hourlyRate ? String(tp.hourlyRate) : "",
      experienceYears: tp?.experienceYears ? String(tp.experienceYears) : "",
    });
    // Open the stages that already have selected classes.
    setOpenStages(
      CLASS_LEVELS.filter((s) => s.classes.some((c) => levels.includes(c))).map((s) => s.stage)
    );
  }, [profile]);

  const toggleStage = (stage: string) =>
    setOpenStages((s) => (s.includes(stage) ? s.filter((x) => x !== stage) : [...s, stage]));

  const toggleArr = (key: "subjects" | "levels", val: string) =>
    setTeaching((t) => ({
      ...t,
      [key]: t[key].includes(val) ? t[key].filter((x) => x !== val) : [...t[key], val],
    }));

  const toggleDay = (day: string) =>
    setTeaching((t) => {
      const exists = t.availability.some((a) => a.day === day);
      return {
        ...t,
        availability: exists
          ? t.availability.filter((a) => a.day !== day)
          : [...t.availability, { day, from: "14:00", to: "18:00" }],
      };
    });

  const setDayTime = (day: string, field: "from" | "to", value: string) =>
    setTeaching((t) => ({
      ...t,
      availability: t.availability.map((a) => (a.day === day ? { ...a, [field]: value } : a)),
    }));

  const saveTeaching = async () => {
    if (!user) return;
    if (!teaching.institution.trim()) return toast.error("Indiquez votre établissement");
    if (teaching.subjects.length === 0) return toast.error("Choisissez au moins une matière");
    if (teaching.levels.length === 0) return toast.error("Choisissez au moins une classe");
    if (teaching.availability.length === 0) return toast.error("Indiquez vos disponibilités");
    const badSlot = teaching.availability.find((a) => a.from >= a.to);
    if (badSlot) return toast.error(`Horaire invalide pour ${badSlot.day} (début avant fin)`);
    setSavingTeaching(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teachingProfile: {
            institution: teaching.institution.trim(),
            headline: teaching.headline.trim(),
            subjects: teaching.subjects,
            levels: teaching.levels,
            availability: teaching.availability,
            hourlyRate: Number(teaching.hourlyRate) || 0,
            experienceYears: Number(teaching.experienceYears) || 0,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshProfile();
        toast.success("Détails d'enseignement enregistrés");
      } else {
        toast.error(json.error || "Échec de l'enregistrement");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setSavingTeaching(false);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      bio: "",
      website: "",
      twitter: "",
      linkedin: "",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, bio: data.bio, socialLinks: { website: data.website, twitter: data.twitter, linkedin: data.linkedin } }),
      });
      const json = await res.json();
      if (res.ok) {
        setUser({ ...user, name: data.name });
        toast.success(t.toasts.updated);
      } else {
        toast.error(json.error || t.toasts.updateFailed);
      }
    } catch {
      toast.error(t.toasts.somethingWrong);
    } finally {
      setSaving(false);
    }
  };

  const STATS = [
    { label: t.stats.courses, value: enrolledCourses.length, icon: BookOpen, color: "text-purple-500" },
    { label: t.stats.certificates, value: certificates, icon: Award, color: "text-green-500" },
    { label: t.stats.xp, value: profile?.xp ?? user?.xp ?? 0, icon: Zap, color: "text-amber-500" },
    { label: t.stats.level, value: profile?.level ?? user?.level ?? 1, icon: GraduationCap, color: "text-blue-500" },
  ];

  const vStatus = profile?.verificationStatus ?? "incomplete";
  const vDocs = profile?.verificationDocuments ?? [];
  const hasAvatar = !!(profile?.avatar || user?.avatar);
  const savedTeaching = profile?.teachingProfile;

  const TEACHER_STATS = [
    { label: "Matières", value: savedTeaching?.subjects?.length ?? 0, icon: BookOpen, color: "text-purple-500" },
    { label: "Niveaux", value: savedTeaching?.levels?.length ?? 0, icon: Layers, color: "text-blue-500" },
    { label: "Tarif / h", value: savedTeaching?.hourlyRate ? `${savedTeaching.hourlyRate} DT` : "—", icon: Wallet, color: "text-green-500" },
    { label: "Expérience", value: savedTeaching?.experienceYears ? `${savedTeaching.experienceYears} ans` : "—", icon: Briefcase, color: "text-amber-500" },
  ];
  const teachingComplete = !!(
    savedTeaching?.institution &&
    savedTeaching.subjects?.length &&
    savedTeaching.levels?.length &&
    savedTeaching.availability?.length
  );
  const canSubmit =
    hasAvatar && vDocs.length > 0 && teachingComplete && vStatus !== "pending" && vStatus !== "approved";

  // ── Student profile: clean, simple sidebar layout ──────────────────────
  if (isStudent) {
    const firstName = user?.name?.split(" ")[0] || "toi";
    const xp = profile?.xp ?? user?.xp ?? 0;
    const lvl = profile?.level ?? user?.level ?? 1;
    const NAV = [
      { id: "overview", label: t.nav.overview, icon: LayoutDashboard },
      { id: "courses", label: t.nav.courses, icon: BookOpen },
      { id: "assignments", label: t.nav.assignments, icon: ClipboardList },
      { id: "tutoring", label: t.nav.tutoring, icon: Users },
      { id: "meetings", label: t.nav.meetings, icon: Video },
      { id: "profile", label: t.nav.profile, icon: Settings },
    ] as const;

    return (
      <main className="pt-16 min-h-screen bg-[hsl(var(--muted))]/20">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[250px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-4 border-[hsl(var(--background))] shadow-md">
                  <AvatarImage src={profile?.avatar || user?.avatar} />
                  <AvatarFallback className="gradient-bg text-white text-xl font-bold">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label={t.changePhoto}
                >
                  {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                </button>
              </div>
              <p className="font-bold mt-3 leading-tight">{user?.name}</p>
              <Badge variant="success" className="mt-1.5 gap-1">🎓 {t.levelWord} {lvl}</Badge>
              <div className="w-full mt-3">
                <Progress value={(xp % 1000) / 10} className="h-2" />
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">{xp % 1000} {t.xpSuffix}</p>
              </div>
            </div>

            <nav className="mt-5 space-y-1">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    section === id
                      ? "gradient-bg text-white shadow-sm"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-5 pt-4 border-t border-[hsl(var(--border))]">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" /> {t.logout}
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 space-y-6">
            {section === "overview" && (
              <>
                <div>
                  <h1 className="text-2xl font-bold">{t.greeting.replace("{name}", firstName)}</h1>
                  <p className="text-[hsl(var(--muted-foreground))]">{t.greetingSub}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STATS.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
                      <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
                      <div className="text-xl font-bold">{value}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress + badges */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl gradient-bg flex flex-col items-center justify-center shadow-lg text-white shrink-0">
                      <span className="text-[10px] font-medium opacity-90 -mb-0.5">{t.levelWord}</span>
                      <span className="font-extrabold text-xl leading-none">{lvl}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Progress value={(xp % 1000) / 10} className="flex-1 h-2.5" />
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] shrink-0">{xp % 1000} {t.xpSuffix}</span>
                      </div>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                        {t.xpToNext.replace("{xp}", String(1000 - (xp % 1000))).replace("{level}", String(lvl + 1))}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">{t.badgesTitle}</p>
                  <div className="flex flex-wrap gap-2">
                    {profile?.badges?.length ? (
                      profile.badges.map((b) => (
                        <div key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500">
                          <Award className="h-3.5 w-3.5" />
                          {b}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{t.noBadges}</span>
                    )}
                  </div>
                </div>

                {/* Share code so a parent can follow this student's progress */}
                <LinkParentCard />
              </>
            )}

            {section === "courses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold flex items-center gap-2">{t.courses.title}</h1>
                  <Link href="/courses" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
                    {t.courses.catalog} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {studentLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />)}
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center">
                    <div className="text-4xl mb-2">🎒</div>
                    <p className="font-semibold">{t.courses.emptyTitle}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{t.courses.emptyText}</p>
                    <Link href="/courses"><Button variant="gradient" size="sm">{t.courses.explore}</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrolledCourses.map((course) => (
                      <div
                        key={course.enrollmentId}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-md transition-all"
                      >
                        <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-[hsl(var(--muted))]">
                          {course.thumbnail ? (
                            <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 gradient-bg flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-1 mb-1">{course.title}</h3>
                          <div className="flex items-center gap-2">
                            <Progress value={course.progress} className="flex-1 h-1.5" />
                            <span className="text-xs font-medium text-[hsl(var(--primary))] shrink-0">{course.progress}%</span>
                          </div>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                            {course.completedLessons}/{course.totalLessons} {t.courses.lessons}
                          </p>
                        </div>
                        <Link href={`/courses/${course.slug}/learn`}>
                          <Button size="sm" variant={course.progress >= 100 ? "outline" : "gradient"} className="shrink-0">
                            {course.progress >= 100 ? t.courses.review : t.courses.continue}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "assignments" && <StudentAssignments />}

            {section === "tutoring" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-[hsl(var(--primary))]" /> {t.tutoring.title}
                  </h1>
                  <Link href="/tutoring" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
                    {t.tutoring.find} <Search className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] -mt-2">
                  {t.tutoring.subtitle}
                </p>

                {studentLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />)}
                  </div>
                ) : reservations.length === 0 ? (
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center">
                    <div className="text-4xl mb-2">🧑‍🏫</div>
                    <p className="font-semibold">{t.tutoring.emptyTitle}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{t.tutoring.emptyText}</p>
                    <Link href="/tutoring"><Button variant="gradient" size="sm">{t.tutoring.find}</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((r) => {
                      const prog = reservationProgress(r.status);
                      const rejected = r.status === "rejected";
                      return (
                        <div
                          key={r._id}
                          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={r.teacher?.avatar} alt={r.teacher?.name} />
                              <AvatarFallback className="gradient-bg text-white font-bold">
                                {getInitials(r.teacher?.name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{r.teacher?.name}</p>
                              {r.createdAt && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                                  <CalendarDays className="h-3 w-3" /> {t.tutoring.reservedOn} {new Date(r.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <Badge variant={prog.tone} className="gap-1 shrink-0">
                              <prog.Icon className="h-3 w-3" /> {t.tutoring.status[prog.statusKey]}
                            </Badge>
                          </div>

                          <div className="mt-4">
                            <Progress
                              value={prog.value}
                              className={cn("h-1.5", rejected && "[&>div]:bg-red-500")}
                            />
                            <div className="flex justify-between mt-1.5">
                              {RESERVATION_STEP_KEYS.map((key, i) => {
                                const done = i + 1 <= prog.step;
                                const isLast = i === RESERVATION_STEP_KEYS.length - 1;
                                return (
                                  <span
                                    key={key}
                                    className={cn(
                                      "text-[10px]",
                                      isLast && "text-right",
                                      done
                                        ? rejected && isLast
                                          ? "text-red-500 font-medium"
                                          : "text-[hsl(var(--primary))] font-medium"
                                        : "text-[hsl(var(--muted-foreground))]"
                                    )}
                                  >
                                    {isLast ? t.tutoring.status[prog.statusKey] : t.tutoring.steps[key]}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {r.status === "accepted" && (
                            <div className="mt-4 flex justify-end">
                              <Link href="/dashboard/tutoring">
                                <Button size="sm" variant="outline">
                                  <Video className="h-3.5 w-3.5" /> {t.tutoring.seeSessions}
                                </Button>
                              </Link>
                            </div>
                          )}
                          {rejected && (
                            <div className="mt-4 flex justify-end">
                              <Link href="/tutoring">
                                <Button size="sm" variant="gradient">
                                  <Search className="h-3.5 w-3.5" /> {t.tutoring.findAnother}
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === "meetings" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Video className="h-6 w-6 text-[hsl(var(--primary))]" /> {t.meetings.title}
                  </h1>
                  <Link href="/dashboard/meetings" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
                    {t.meetings.seeAll} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {upcomingMeetings.length === 0 ? (
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center py-12 text-[hsl(var(--muted-foreground))]">
                    <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6" />
                    </div>
                    <p className="text-sm">{t.meetings.empty}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingMeetings.map((m) => (
                      <div key={m._id} className="flex items-center gap-3 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-2 mt-0.5">
                            <CalendarDays className="h-3 w-3" /> {new Date(m.date).toLocaleDateString()} · {m.startTime}
                            {m.teacher?.name && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.teacher.name}</span>}
                          </p>
                        </div>
                        <MeetingAction m={m} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "profile" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <h1 className="text-2xl font-bold">{t.form.title}</h1>
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{t.form.fullName}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input className="pl-9" {...register("name")} />
                      </div>
                      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.form.email}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input className="pl-9" value={user?.email} disabled />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t.form.bio}</Label>
                    <Textarea placeholder={t.form.bioPlaceholder} className="min-h-[100px]" {...register("bio")} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" loading={saving}>
                    <Save className="h-4 w-4" /> {t.form.save}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16">
        {/* Banner */}
        <div className="h-40 gradient-bg relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-[hsl(var(--background))] shadow-xl">
                <AvatarImage src={profile?.avatar || user?.avatar} />
                <AvatarFallback className="gradient-bg text-white text-2xl font-bold">
                  {user ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* User Info Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            {isTeacher && savedTeaching?.headline ? (
              <p className="text-[hsl(var(--muted-foreground))]">{savedTeaching.headline}</p>
            ) : (
              <p className="text-[hsl(var(--muted-foreground))]">{user?.email}</p>
            )}
            {isTeacher && savedTeaching?.institution && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-1.5 mt-1">
                <Building2 className="h-3.5 w-3.5" /> {savedTeaching.institution}
              </p>
            )}
            <div className="flex items-center justify-center flex-wrap gap-2 mt-3">
              <Badge variant="purple" className="capitalize">{user?.role}</Badge>
              {isTeacher ? (
                vStatus === "approved" ? (
                  <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Profil vérifié</Badge>
                ) : vStatus === "pending" ? (
                  <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> En cours de vérification</Badge>
                ) : vStatus === "rejected" ? (
                  <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Modifications demandées</Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Profil incomplet</Badge>
                )
              ) : (
                <Badge variant="success" className="gap-1">🎓 Niveau {profile?.level ?? user?.level ?? 1}</Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {(isTeacher ? TEACHER_STATS : STATS).map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
              </div>
            ))}
          </div>

          <Tabs defaultValue={isStudent ? "overview" : "profile"}>
            <TabsList className="mb-6">
              {isStudent && <TabsTrigger value="overview">Aperçu</TabsTrigger>}
              <TabsTrigger value="profile">{isStudent ? "Mon profil" : "Profile"}</TabsTrigger>
              {isTeacher && <TabsTrigger value="verification">Verification</TabsTrigger>}
              {!isStudent && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
              {!isStudent && <TabsTrigger value="activity">Activity</TabsTrigger>}
            </TabsList>

            {isStudent && (
              <TabsContent value="overview" className="space-y-6">
                {/* Ma progression — XP / niveau */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl gradient-bg flex flex-col items-center justify-center shadow-lg text-white shrink-0">
                        <span className="text-[10px] font-medium opacity-90 -mb-0.5">Niveau</span>
                        <span className="font-extrabold text-2xl leading-none">{profile?.level ?? user?.level ?? 1}</span>
                      </div>
                      <div>
                        <p className="font-bold text-lg">Salut {user?.name?.split(" ")[0]} 👋</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Continue comme ça, tu progresses bien ! 💪</p>
                        <div className="flex items-center gap-2">
                          <Progress value={((profile?.xp ?? user?.xp ?? 0) % 1000) / 10} className="w-44 h-2.5" />
                          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                            {(profile?.xp ?? user?.xp ?? 0) % 1000} / 1000 XP
                          </span>
                        </div>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                          Encore {1000 - ((profile?.xp ?? user?.xp ?? 0) % 1000)} XP avant le niveau {(profile?.level ?? user?.level ?? 1) + 1} 🚀
                        </p>
                      </div>
                    </div>
                    <div className="sm:max-w-[14rem]">
                      <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">🏅 Mes badges</p>
                      <div className="flex flex-wrap gap-2">
                        {profile?.badges?.length ? (
                          profile.badges.map((b) => (
                            <div key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500">
                              <Award className="h-3.5 w-3.5" />
                              {b}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            Termine des cours et des quiz pour gagner tes premiers badges 🎯
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue Learning — real enrolled courses */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">📚 Mes cours</h2>
                    <Link href="/courses" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
                      Voir le catalogue <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {studentLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />)}
                    </div>
                  ) : enrolledCourses.length === 0 ? (
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 text-center">
                      <div className="text-4xl mb-2">🎒</div>
                      <p className="font-semibold">Tu n&apos;as encore rejoint aucun cours</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Explore le catalogue et commence à apprendre dès aujourd&apos;hui.</p>
                      <Link href="/courses"><Button variant="gradient" size="sm">Explorer les cours</Button></Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrolledCourses.map((course) => (
                        <div
                          key={course.enrollmentId}
                          className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-md transition-all group"
                        >
                          <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-[hsl(var(--muted))]">
                            {course.thumbnail ? (
                              <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                            ) : (
                              <div className="absolute inset-0 gradient-bg flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-1 mb-1">{course.title}</h3>
                            <div className="flex items-center gap-2">
                              <Progress value={course.progress} className="flex-1 h-1.5" />
                              <span className="text-xs font-medium text-[hsl(var(--primary))] shrink-0">
                                {course.progress}%
                              </span>
                            </div>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                              {course.completedLessons}/{course.totalLessons} leçons
                            </p>
                          </div>
                          <Link href={`/courses/${course.slug}/learn`}>
                            <Button size="sm" variant={course.progress >= 100 ? "outline" : "gradient"} className="shrink-0">
                              {course.progress >= 100 ? "Revoir" : "Continuer"}
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mes prochaines réunions — depuis le module meetings */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Video className="h-4 w-4 text-[hsl(var(--primary))]" />
                      Mes prochaines réunions
                    </h3>
                    <Link href="/dashboard/meetings" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
                      Tout voir <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {upcomingMeetings.length === 0 ? (
                    <div className="text-center py-6 text-[hsl(var(--muted-foreground))]">
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-6 w-6" />
                      </div>
                      <p className="text-sm">Aucune réunion prévue pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingMeetings.slice(0, 4).map((m) => (
                        <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))]">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{m.title}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-2 mt-0.5">
                              <CalendarDays className="h-3 w-3" /> {new Date(m.date).toLocaleDateString()} · {m.startTime}
                              {m.teacher?.name && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.teacher.name}</span>}
                            </p>
                          </div>
                          <MeetingAction m={m} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="profile">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
                  <h2 className="font-semibold text-lg">Personal Information</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input className="pl-9" {...register("name")} />
                      </div>
                      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input className="pl-9" value={user?.email} disabled />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Bio</Label>
                    <Textarea
                      placeholder="Tell the community about yourself..."
                      className="min-h-[100px]"
                      {...register("bio")}
                    />
                  </div>

                  <Separator />
                  <h3 className="font-medium">Social Links</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input className="pl-9" placeholder="https://yoursite.com" {...register("website")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Twitter</Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input className="pl-9" placeholder="@username" {...register("twitter")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>LinkedIn</Label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input className="pl-9" placeholder="linkedin.com/in/you" {...register("linkedin")} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" loading={saving}>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </TabsContent>

            {isTeacher && (
              <TabsContent value="verification" className="space-y-6">
                {/* Status banner */}
                {vStatus === "approved" ? (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 p-5 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">Profile approved</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Your teacher account is verified. You have full access to your dashboard.
                      </p>
                    </div>
                  </div>
                ) : vStatus === "pending" ? (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-5 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400">Under review</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Your profile has been submitted. An administrator will review it shortly.
                      </p>
                    </div>
                  </div>
                ) : vStatus === "rejected" ? (
                  <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-5 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">Changes requested</p>
                      <p className="text-sm text-[hsl(var(--foreground))] mt-1">{profile?.rejectionReason}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        Please update your profile and submit again.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-5 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Complete your profile to teach</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Add a profile photo and upload documents proving you are a teacher, then submit for review.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                  <div className="space-y-6 min-w-0">
                {/* Teaching details (tutor card) */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--primary))]/8 via-transparent to-transparent">
                    <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center shadow-md shrink-0">
                      <BookOpenCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg leading-tight">Teaching profile</h2>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Shown on your public tutor card so students can find you.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-7">
                    {/* Institution + headline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Établissement</Label>
                        <Input
                          placeholder="Lycée Pilote de l'Ariana…"
                          value={teaching.institution}
                          onChange={(e) => setTeaching((t) => ({ ...t, institution: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><BookMarked className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Titre / spécialité</Label>
                        <Input
                          placeholder="Professeur agrégé de mathématiques"
                          value={teaching.headline}
                          onChange={(e) => setTeaching((t) => ({ ...t, headline: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="space-y-2.5">
                      <Label className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Matières enseignées</Label>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.map((s) => {
                          const active = teaching.subjects.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleArr("subjects", s)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                active
                                  ? "gradient-bg text-white border-transparent shadow-sm"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                              )}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Levels — cascading by stage */}
                    <div className="space-y-2.5">
                      <Label className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Niveaux à enseigner</Label>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] -mt-1">
                        Choisissez un cycle, puis les classes précises.
                      </p>
                      <div className="space-y-2">
                        {CLASS_LEVELS.map(({ stage, classes }) => {
                          const open = openStages.includes(stage);
                          const count = classes.filter((c) => teaching.levels.includes(c)).length;
                          return (
                            <div key={stage} className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleStage(stage)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[hsl(var(--muted))]/40 transition-colors"
                              >
                                <span className="flex items-center gap-2 text-sm font-medium">
                                  <GradCap className="h-4 w-4 text-[hsl(var(--primary))]" />
                                  {stage}
                                  {count > 0 && <Badge variant="purple" className="text-[10px] px-1.5 py-0">{count}</Badge>}
                                </span>
                                <ChevronDown className={cn("h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform", open && "rotate-180")} />
                              </button>
                              {open && (
                                <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1 border-t border-[hsl(var(--border))]">
                                  {classes.map((c) => {
                                    const active = teaching.levels.includes(c);
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => toggleArr("levels", c)}
                                        className={cn(
                                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                          active
                                            ? "gradient-bg text-white border-transparent shadow-sm"
                                            : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                                        )}
                                      >
                                        {c}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Availability — per day, with time range */}
                    <div className="space-y-2.5">
                      <Label className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Disponibilités</Label>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] -mt-1">
                        Activez un jour puis indiquez l&apos;horaire (de — à).
                      </p>
                      <div className="space-y-2">
                        {WEEKDAYS.map(({ key, label }) => {
                          const slot = teaching.availability.find((a) => a.day === key);
                          const on = !!slot;
                          return (
                            <div
                              key={key}
                              className={cn(
                                "flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                                on ? "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5" : "border-[hsl(var(--border))]"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => toggleDay(key)}
                                className="flex items-center gap-2 text-sm font-medium w-28 shrink-0"
                              >
                                <span className={cn("h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0", on ? "gradient-bg border-transparent" : "border-[hsl(var(--border))]")}>
                                  {on && <Check className="h-3 w-3 text-white" />}
                                </span>
                                {label}
                              </button>
                              {on ? (
                                <div className="flex items-center gap-2 ml-auto">
                                  <input
                                    type="time"
                                    value={slot!.from}
                                    onChange={(e) => setDayTime(key, "from", e.target.value)}
                                    className="h-9 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-sm"
                                  />
                                  <span className="text-[hsl(var(--muted-foreground))]">—</span>
                                  <input
                                    type="time"
                                    value={slot!.to}
                                    onChange={(e) => setDayTime(key, "to", e.target.value)}
                                    className="h-9 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-sm"
                                  />
                                </div>
                              ) : (
                                <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">Indisponible</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rate + experience */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Tarif horaire (DT)</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="40"
                          value={teaching.hourlyRate}
                          onChange={(e) => setTeaching((t) => ({ ...t, hourlyRate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Années d&apos;expérience</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="5"
                          value={teaching.experienceYears}
                          onChange={(e) => setTeaching((t) => ({ ...t, experienceYears: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button type="button" variant="gradient" onClick={saveTeaching} loading={savingTeaching}>
                        <Save className="h-4 w-4" /> Save teaching details
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
                  <h2 className="font-semibold text-lg">Verification requirements</h2>

                  {/* Photo requirement */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasAvatar ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>
                      {hasAvatar ? <CheckCircle2 className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile photo</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {hasAvatar ? "Added" : "Use the camera icon on your avatar to upload a photo."}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                      {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                      {hasAvatar ? "Change" : "Add"}
                    </Button>
                  </div>

                  {/* Documents requirement */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${vDocs.length > 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>
                        {vDocs.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Proof documents</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          Diploma, teaching certificate or professional ID (PDF or image).
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}>
                        {uploadingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload
                      </Button>
                      <input
                        ref={docInputRef}
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleDocChange}
                      />
                    </div>

                    {vDocs.length > 0 && (
                      <ul className="space-y-2 pl-11">
                        {vDocs.map((d) => (
                          <li key={d.url} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2">
                            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                            <span className="text-sm flex-1 truncate">{d.name}</span>
                            <a href={d.url} target="_blank" rel="noopener noreferrer" title="Open">
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                            </a>
                            {vStatus !== "approved" && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deleteDoc(d.url)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Teaching details requirement */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${teachingComplete ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>
                      {teachingComplete ? <CheckCircle2 className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Teaching details</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {teachingComplete
                          ? "Institution, subjects, levels and availability provided."
                          : "Fill in your établissement, subjects, levels and availability above, then save."}
                      </p>
                    </div>
                  </div>

                  {vStatus !== "approved" && (
                    <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {canSubmit
                          ? "Everything looks good — submit for review."
                          : "Complete your photo, documents and teaching details to submit."}
                      </p>
                      <Button type="button" variant="gradient" onClick={submitForReview} disabled={!canSubmit || submitting} loading={submitting}>
                        <ShieldCheck className="h-4 w-4" />
                        {vStatus === "rejected" ? "Resubmit" : "Submit for review"}
                      </Button>
                    </div>
                  )}
                </div>
                  </div>

                  {/* Live preview of the public tutor card */}
                  <div className="lg:sticky lg:top-20 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Eye className="h-4 w-4 text-[hsl(var(--primary))]" /> Aperçu de votre carte
                    </div>
                    <TutorCardPreview
                      name={user?.name || "Votre nom"}
                      avatar={profile?.avatar || user?.avatar}
                      bio={profile?.bio}
                      headline={teaching.headline}
                      subjects={teaching.subjects}
                      levels={teaching.levels}
                      availability={teaching.availability}
                      hourlyRate={teaching.hourlyRate}
                      experienceYears={teaching.experienceYears}
                      verified={vStatus === "approved"}
                    />
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Voici comment les élèves vous verront sur la page <span className="font-medium">Cours particuliers</span>. La note et le nombre d&apos;élèves apparaîtront après vos premières séances.
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}

            {!isStudent && (
            <TabsContent value="achievements">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                <h2 className="font-semibold text-lg mb-4">Badges & Achievements</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { emoji: "🔥", label: "7-day Streak", earned: true },
                    { emoji: "🏆", label: "First Course", earned: true },
                    { emoji: "⭐", label: "5-star Quizzer", earned: true },
                    { emoji: "📚", label: "Knowledge Seeker", earned: false },
                    { emoji: "🎓", label: "Graduate", earned: false },
                    { emoji: "🤖", label: "AI Explorer", earned: false },
                    { emoji: "💡", label: "Mentor", earned: false },
                    { emoji: "🚀", label: "Top Performer", earned: false },
                  ].map(({ emoji, label, earned }) => (
                    <div
                      key={label}
                      className={`p-4 rounded-xl border text-center ${
                        earned
                          ? "border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5"
                          : "border-[hsl(var(--border))] opacity-40"
                      }`}
                    >
                      <div className="text-3xl mb-2">{emoji}</div>
                      <p className="text-xs font-medium">{label}</p>
                      {earned && <Badge variant="success" className="text-[10px] mt-1">Earned</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            )}

            {!isStudent && (
            <TabsContent value="activity">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/30" />
                <p className="font-medium">No activity yet</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Start learning to see your activity here
                </p>
              </div>
            </TabsContent>
            )}
          </Tabs>
        </div>
    </main>
  );
}
