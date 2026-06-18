"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TokenData {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

// Plays a single remote participant's video/audio into its own tile.
function RemotePlayer({ user }: { user: IAgoraRTCRemoteUser }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && ref.current) {
      user.videoTrack.play(ref.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user, user.videoTrack]);

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-[hsl(var(--muted))]">
      <div ref={ref} className="absolute inset-0" />
      {!user.videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
          Camera off
        </div>
      )}
      <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/60 text-white">
        {String(user.uid)}
      </span>
    </div>
  );
}

export function AgoraRoom({
  tokenUrl,
  title,
  backHref = "/dashboard/meetings",
}: {
  tokenUrl: string;
  title: string;
  backHref?: string;
}) {
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [error, setError] = useState("");
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const camTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        // Fetch a join token scoped to this room + user.
        const res = await fetch(tokenUrl, { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Could not join the meeting");
        }
        const { appId, channel, token, uid } = json.data as TokenData;

        // The web SDK touches browser APIs at import time — load it lazily, client-side only.
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        if (cancelled) return;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") user.audioTrack?.play();
          setRemoteUsers([...client.remoteUsers]);
        });
        client.on("user-unpublished", () => setRemoteUsers([...client.remoteUsers]));
        client.on("user-left", () => setRemoteUsers([...client.remoteUsers]));

        await client.join(appId, channel, token, uid || null);

        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          micTrack.close();
          camTrack.close();
          await client.leave();
          return;
        }
        micTrackRef.current = micTrack;
        camTrackRef.current = camTrack;
        if (localVideoRef.current) camTrack.play(localVideoRef.current);
        await client.publish([micTrack, camTrack]);

        setStatus("live");
        setRemoteUsers([...client.remoteUsers]);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not join the meeting");
        setStatus("error");
      }
    };

    start();

    return () => {
      cancelled = true;
      micTrackRef.current?.close();
      camTrackRef.current?.close();
      const client = clientRef.current;
      if (client) {
        client.removeAllListeners();
        client.leave().catch(() => {});
      }
    };
  }, [tokenUrl]);

  const toggleMic = async () => {
    if (!micTrackRef.current) return;
    const next = !micOn;
    await micTrackRef.current.setEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    if (!camTrackRef.current) return;
    const next = !camOn;
    await camTrackRef.current.setEnabled(next);
    setCamOn(next);
  };

  const leave = () => {
    window.location.href = backHref;
  };

  if (status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="font-semibold mb-1">Can&apos;t join the meeting</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{error}</p>
          <Button variant="outline" onClick={leave}>Back to meetings</Button>
        </div>
      </div>
    );
  }

  const tiles = remoteUsers.length + 1;
  const gridCols = tiles <= 1 ? "grid-cols-1" : tiles <= 4 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mt-0.5">
            <Users className="h-3.5 w-3.5" /> {tiles} in call
            {status === "connecting" && (
              <span className="flex items-center gap-1 ml-2 text-amber-600">
                <Loader2 className="h-3 w-3 animate-spin" /> connecting…
              </span>
            )}
          </p>
        </div>
      </div>

      <div className={cn("grid gap-3", gridCols)}>
        {/* Local tile */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-[hsl(var(--muted))] ring-2 ring-[hsl(var(--primary))]/40">
          <div ref={localVideoRef} className="absolute inset-0" />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[hsl(var(--muted-foreground))]">
              Camera off
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/60 text-white">
            You
          </span>
        </div>

        {remoteUsers.map((user) => (
          <RemotePlayer key={String(user.uid)} user={user} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          variant={micOn ? "outline" : "destructive"}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleMic}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        <Button
          variant={camOn ? "outline" : "destructive"}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleCam}
          title={camOn ? "Turn camera off" : "Turn camera on"}
        >
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={leave}
          title="Leave"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
