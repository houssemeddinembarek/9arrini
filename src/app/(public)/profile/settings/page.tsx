"use client";

import { useState } from "react";
import { Lock, Bell, Palette, Shield, Trash2, Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { toast } from "sonner";

export default function SettingsPage() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [notifications, setNotifications] = useState({
    email_courses: true,
    email_messages: true,
    email_promos: false,
    push_lessons: true,
    push_messages: true,
    push_achievements: true,
  });

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preference saved");
  };

  return (
    <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold mb-8">Settings</h1>

          <Tabs defaultValue="security" orientation="vertical">
            <div className="flex flex-col sm:flex-row gap-6">
              <TabsList className="flex flex-row sm:flex-col h-auto w-full sm:w-48 shrink-0 p-1 justify-start">
                <TabsTrigger value="security" className="justify-start gap-2 w-auto sm:w-full">
                  <Lock className="h-4 w-4" /> Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start gap-2 w-auto sm:w-full">
                  <Bell className="h-4 w-4" /> Notifications
                </TabsTrigger>
                <TabsTrigger value="appearance" className="justify-start gap-2 w-auto sm:w-full">
                  <Palette className="h-4 w-4" /> Appearance
                </TabsTrigger>
                <TabsTrigger value="privacy" className="justify-start gap-2 w-auto sm:w-full">
                  <Shield className="h-4 w-4" /> Privacy
                </TabsTrigger>
                <TabsTrigger value="danger" className="justify-start gap-2 w-auto sm:w-full text-red-500">
                  <Trash2 className="h-4 w-4" /> Danger Zone
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-w-0">
                <TabsContent value="security">
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
                    <h2 className="font-semibold text-lg">Change Password</h2>

                    <div className="space-y-1.5">
                      <Label>Current Password</Label>
                      <div className="relative">
                        <Input type={showCurrent ? "text" : "password"} placeholder="Enter current password" className="pr-10" />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" onClick={() => setShowCurrent(!showCurrent)}>
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input type={showNew ? "text" : "password"} placeholder="Min. 6 characters" className="pr-10" />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" onClick={() => setShowNew(!showNew)}>
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Confirm New Password</Label>
                      <Input type="password" placeholder="Confirm new password" />
                    </div>

                    <Button variant="gradient" onClick={() => toast.success("Password updated!")}>
                      <Save className="h-4 w-4" /> Update Password
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="notifications">
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
                    <h2 className="font-semibold text-lg">Notification Preferences</h2>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Email Notifications</h3>
                      {[
                        { key: "email_courses", label: "Course updates", desc: "New lessons, announcements" },
                        { key: "email_messages", label: "Messages", desc: "When someone sends you a message" },
                        { key: "email_promos", label: "Promotions", desc: "Sales, new courses, offers" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between gap-4 py-2">
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{desc}</p>
                          </div>
                          <Switch
                            checked={notifications[key as keyof typeof notifications]}
                            onCheckedChange={() => handleNotificationToggle(key as keyof typeof notifications)}
                          />
                        </div>
                      ))}

                      <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mt-4">Push Notifications</h3>
                      {[
                        { key: "push_lessons", label: "New lessons available", desc: "For your enrolled courses" },
                        { key: "push_messages", label: "Direct messages", desc: "From teachers and peers" },
                        { key: "push_achievements", label: "Achievements", desc: "Badges, level-ups, streaks" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between gap-4 py-2">
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{desc}</p>
                          </div>
                          <Switch
                            checked={notifications[key as keyof typeof notifications]}
                            onCheckedChange={() => handleNotificationToggle(key as keyof typeof notifications)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appearance">
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
                    <h2 className="font-semibold text-lg">Appearance</h2>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Color Theme</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Switch between light and dark mode
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Language</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">Platform language</p>
                      </div>
                      <Badge variant="secondary">English (US)</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="privacy">
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Privacy Settings</h2>
                    {[
                      { label: "Show profile publicly", desc: "Anyone can view your profile" },
                      { label: "Show enrolled courses", desc: "Others can see what you're learning" },
                      { label: "Show certificates", desc: "Display your achievements" },
                    ].map(({ label, desc }) => (
                      <div key={label} className="flex items-center justify-between gap-4 py-2">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{desc}</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="danger">
                  <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 space-y-4">
                    <h2 className="font-semibold text-lg text-red-700 dark:text-red-400">Danger Zone</h2>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      These actions are permanent and cannot be undone.
                    </p>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => toast.error("Please contact support to deactivate your account")}>
                        Deactivate Account
                      </Button>
                      <Button variant="destructive" className="w-full"
                        onClick={() => toast.error("Please contact support to delete your account")}>
                        <Trash2 className="h-4 w-4" /> Delete Account Permanently
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
    </main>
  );
}
