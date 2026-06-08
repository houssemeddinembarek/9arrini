"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  BookOpen, ArrowLeft, ArrowRight, Plus, X, Upload, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = [
  "Web Development", "Mobile Dev", "AI & ML", "Data Science",
  "Design", "Business", "Marketing", "Programming", "DevOps", "Cybersecurity",
];

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  shortDescription: z.string().max(200).optional(),
  category: z.string().min(1, "Please select a category"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  isFree: z.boolean(),
  price: z.number().min(0).optional(),
  language: z.string(),
});

type CourseForm = z.infer<typeof schema>;

const STEPS = ["Basic Info", "Details", "Curriculum", "Pricing"];

export default function CreateCoursePage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const router = useRouter();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { level: "beginner" as const, isFree: true, price: 0, language: "English", title: "", description: "", category: "" },
  });

  const isFree = watch("isFree");

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tags, objectives, requirements }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create course");
        return;
      }
      toast.success("Course created successfully!");
      router.push(`/teacher/courses/${json.data.course.slug}/edit`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Course</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? "gradient-bg text-white cursor-pointer" :
                i === step ? "gradient-bg text-white animate-pulse-glow" :
                "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className="text-sm hidden sm:block text-[hsl(var(--muted-foreground))]">{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 rounded-full mx-1 ${i < step ? "gradient-bg" : "bg-[hsl(var(--muted))]"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6">
          {step === 0 && (
            <>
              <h2 className="text-lg font-semibold">Basic Information</h2>

              <div className="space-y-1.5">
                <Label>Course Title *</Label>
                <Input placeholder="e.g. Complete Web Development Bootcamp 2024" {...register("title")} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Short Description</Label>
                <Input placeholder="One-liner about your course (max 200 chars)" {...register("shortDescription")} />
              </div>

              <div className="space-y-1.5">
                <Label>Full Description *</Label>
                <Textarea
                  placeholder="Describe what students will learn, who it's for, and what makes it great..."
                  className="min-h-[140px]"
                  {...register("description")}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select onValueChange={(v) => setValue("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Level *</Label>
                  <Select defaultValue="beginner" onValueChange={(v) => setValue("level", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold">Course Details</h2>

              <div className="space-y-2">
                <Label>What will students learn? (Objectives)</Label>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Add at least 4 learning objectives</p>
                {objectives.map((obj, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Objective ${i + 1}`}
                      value={obj}
                      onChange={(e) => {
                        const next = [...objectives];
                        next[i] = e.target.value;
                        setObjectives(next);
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setObjectives(objectives.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setObjectives([...objectives, ""])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Objective
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Requirements / Prerequisites</Label>
                {requirements.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Requirement ${i + 1}`}
                      value={req}
                      onChange={(e) => {
                        const next = [...requirements];
                        next[i] = e.target.value;
                        setRequirements(next);
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setRequirements(requirements.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setRequirements([...requirements, ""])}>
                  <Plus className="h-4 w-4 mr-1" /> Add Requirement
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select defaultValue="English" onValueChange={(v) => setValue("language", v)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["English", "French", "Spanish", "Arabic", "German", "Chinese"].map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Curriculum Editor</h3>
                <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1 max-w-md mx-auto">
                  After creating the course, you&apos;ll be redirected to the full curriculum editor where you can add video lessons, PDFs, quizzes, and assignments.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Upload className="h-4 w-4" /> Supports video, PDF, and text lessons
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold">Pricing</h2>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                <Switch
                  id="isFree"
                  checked={isFree}
                  onCheckedChange={(v) => setValue("isFree", v)}
                />
                <div>
                  <Label htmlFor="isFree" className="cursor-pointer">Free Course</Label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Students can enroll without paying</p>
                </div>
              </div>

              {!isFree && (
                <div className="space-y-1.5">
                  <Label>Price (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] font-medium">$</span>
                    <Input
                      type="number"
                      min={1}
                      className="pl-7"
                      placeholder="29"
                      {...register("price", { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Recommended: $29 – $129 for a quality course</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20">
                <p className="text-sm font-medium text-[hsl(var(--primary))] mb-1">Stripe Ready</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Payment processing via Stripe will be enabled once you connect your Stripe account in Settings.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="gradient" onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" variant="gradient" loading={loading}>
              <Check className="h-4 w-4 mr-1" />
              Create Course
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
