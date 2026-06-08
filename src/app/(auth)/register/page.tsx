"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, User, GraduationCap, BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

const ROLES = [
  {
    value: "student" as const,
    label: "Student",
    icon: GraduationCap,
    description: "I want to learn new skills",
  },
  {
    value: "teacher" as const,
    label: "Teacher",
    icon: BookOpen,
    description: "I want to teach and create courses",
  },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Registration failed");
        return;
      }

      setUser(json.data.user);
      toast.success("Account created! Welcome to Skillora 🎉");

      const role = json.data.user.role;
      if (role === "teacher") router.push("/teacher");
      else router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl border border-[hsl(var(--border))] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Join 50,000+ learners on Skillora
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("role", value)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all",
                    selectedRole === value
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"
                  )}
                >
                  {selectedRole === value && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <Icon className="h-6 w-6 mb-2 text-[hsl(var(--primary))]" />
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                id="name"
                placeholder="John Doe"
                className="pl-10"
                {...register("name")}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                className="pl-10 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" variant="gradient" loading={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-[hsl(var(--primary))] hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-[hsl(var(--primary))] hover:underline">Privacy Policy</Link>
          </p>
        </form>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
