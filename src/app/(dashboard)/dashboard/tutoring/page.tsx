"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Video, ArrowRight, Search, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";

const BOOKINGS = [
  {
    id: "1",
    teacher: { name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50" },
    subject: "React Advanced Patterns",
    date: "2024-02-15",
    time: "2:00 PM",
    duration: 60,
    status: "upcoming",
    meetingUrl: "https://zoom.us/j/example",
  },
  {
    id: "2",
    teacher: { name: "Dr. Marcus Chen", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50" },
    subject: "Machine Learning Basics",
    date: "2024-01-28",
    time: "4:00 PM",
    duration: 60,
    status: "completed",
    meetingUrl: "",
  },
];

export default function DashboardTutoringPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tutoring Sessions</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage your 1-on-1 sessions</p>
        </div>
        <Link href="/tutoring">
          <Button variant="gradient">
            <Search className="h-4 w-4" /> Find a Tutor
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {["upcoming", "completed"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="space-y-4">
              {BOOKINGS.filter((b) => b.status === tab).map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={booking.teacher.avatar} />
                    <AvatarFallback className="gradient-bg text-white font-bold">
                      {getInitials(booking.teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{booking.subject}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">with {booking.teacher.name}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {booking.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {booking.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tab === "upcoming" && booking.meetingUrl && (
                      <Button variant="gradient" size="sm" asChild>
                        <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4" /> Join
                        </a>
                      </Button>
                    )}
                    {tab === "completed" && (
                      <Button variant="outline" size="sm">
                        <Star className="h-4 w-4" /> Review
                      </Button>
                    )}
                    <Badge variant={tab === "upcoming" ? "blue" : "success"} className="self-center capitalize">
                      {tab}
                    </Badge>
                  </div>
                </div>
              ))}

              {BOOKINGS.filter((b) => b.status === tab).length === 0 && (
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No {tab} sessions</p>
                  <Link href="/tutoring">
                    <Button variant="outline" className="mt-4">Book a Session</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
