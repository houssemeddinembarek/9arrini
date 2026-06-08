"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Mail, Globe, AtSign, Link2, Camera, Save,
  BookOpen, Award, Star, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/useAuthStore";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

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
        toast.success("Profile updated successfully!");
      } else {
        toast.error(json.error || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const STATS = [
    { label: "Courses Enrolled", value: 3, icon: BookOpen, color: "text-purple-500" },
    { label: "Certificates", value: 1, icon: Award, color: "text-green-500" },
    { label: "Quiz Score", value: "88%", icon: Star, color: "text-amber-500" },
    { label: "Level", value: user?.level || 1, icon: GraduationCap, color: "text-blue-500" },
  ];

  return (
    <main className="pt-16">
        {/* Banner */}
        <div className="h-40 gradient-bg relative">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-[hsl(var(--background))] shadow-xl">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="gradient-bg text-white text-2xl font-bold">
                  {user ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <button className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* User Info Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-[hsl(var(--muted-foreground))]">{user?.email}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="purple" className="capitalize">{user?.role}</Badge>
              <Badge variant="success">Level {user?.level || 1}</Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {STATS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

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

            <TabsContent value="activity">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/30" />
                <p className="font-medium">No activity yet</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Start learning to see your activity here
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </main>
  );
}
