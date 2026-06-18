"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IAgoraRTC,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, AlertTriangle, Users,
  MonitorUp, Presentation, Crown, ChevronUp, ChevronDown, Images,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Whiteboard } from "@/components/meetings/whiteboard";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

interface TokenData {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

// A participant we learned about over the presence channel.
interface Member {
  name: string;
  role: "teacher" | "student";
  mic: boolean;
  cam: boolean;
}

// The data-stream send method exists at runtime but is absent from the public types.
type RtcWithDataStream = IAgoraRTCClient & {
  sendStreamMessage?: (msg: string | Uint8Array, ordered?: boolean) => Promise<void>;
};

// Presence/control protocol carried over the Agora data stream.
type RoomMessage =
  | { k: "hello"; uid: string; name: string; role: "teacher" | "student"; mic: boolean; cam: boolean; reply?: boolean }
  | { k: "status"; uid: string; mic: boolean; cam: boolean }
  | { k: "ctrl"; target: string; action: "mute-audio" | "mute-video" }
  | { k: "board"; open: boolean };

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

// Plays a single remote participant's video into its tile, with a name + mute badge.
// `variant` controls the size: "grid" (equal tile), "stage" (large spotlight),
// or "thumb" (small fixed-width strip tile).
function RemotePlayer({
  user, name, micOn, variant = "grid",
}: {
  user: IAgoraRTCRemoteUser;
  name: string;
  micOn: boolean;
  variant?: "grid" | "stage" | "thumb";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.videoTrack && ref.current) user.videoTrack.play(ref.current);
    return () => { user.videoTrack?.stop(); };
  }, [user, user.videoTrack]);

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-[hsl(var(--muted))]",
        variant === "thumb" ? "w-40 shrink-0 aspect-video" : variant === "stage" ? "h-full w-full" : "aspect-video w-full",
        variant === "stage" && "ring-2 ring-[hsl(var(--primary))]/40",
      )}
    >
      <div ref={ref} className="absolute inset-0" />
      {!user.videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "rounded-full bg-[hsl(var(--background))]/80 flex items-center justify-center font-semibold",
              variant === "stage" ? "h-20 w-20 text-2xl" : variant === "thumb" ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg",
            )}
          >
            {initials(name)}
          </div>
        </div>
      )}
      <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/60 text-white">
        {!micOn && <MicOff className="h-3 w-3 text-red-400" />} {name}
      </span>
    </div>
  );
}

export function AgoraRoom({
  tokenUrl,
  title,
  isTeacher = false,
  backHref = "/dashboard/meetings",
}: {
  tokenUrl: string;
  title: string;
  isTeacher?: boolean;
  backHref?: string;
}) {
  const { user } = useAuthStore();
  const myName = user?.name || (isTeacher ? "Professeur" : "Élève");
  const myRole: "teacher" | "student" = isTeacher ? "teacher" : "student";

  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [error, setError] = useState("");
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [roster, setRoster] = useState<Record<string, Member>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  // Collapsible sections so the room always fits one screen without scrolling.
  const [showHeader, setShowHeader] = useState(true);
  const [showStrip, setShowStrip] = useState(true);
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);

  const agoraRef = useRef<IAgoraRTC | null>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const camTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  // Live mirrors of identity/state so event handlers always read current values.
  const myUidRef = useRef<string>("");
  const micOnRef = useRef(true);
  const camOnRef = useRef(true);
  const showBoardRef = useRef(false);

  const send = (msg: RoomMessage) => {
    const c = clientRef.current as RtcWithDataStream | null;
    c?.sendStreamMessage?.(JSON.stringify(msg)).catch(() => {});
  };
  const announce = (reply = false) =>
    send({ k: "hello", uid: myUidRef.current, name: myName, role: myRole, mic: micOnRef.current, cam: camOnRef.current, reply });
  const broadcastStatus = () =>
    send({ k: "status", uid: myUidRef.current, mic: micOnRef.current, cam: camOnRef.current });

  // Obey a teacher's mute command on our own track (Agora can't stop another
  // client's track directly, so the target mutes itself).
  const forceMute = async (kind: "audio" | "video") => {
    if (kind === "audio" && micTrackRef.current && micOnRef.current) {
      await micTrackRef.current.setEnabled(false);
      micOnRef.current = false;
      setMicOn(false);
      toast.info("Le professeur a coupé ton micro");
    } else if (kind === "video" && camTrackRef.current && camOnRef.current) {
      await camTrackRef.current.setEnabled(false);
      camOnRef.current = false;
      setCamOn(false);
      toast.info("Le professeur a coupé ta caméra");
    }
    broadcastStatus();
  };

  // ── Join + media + presence/control wiring ──
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const res = await fetch(tokenUrl, { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Could not join the meeting");
        const { appId, channel, token, uid } = json.data as TokenData;

        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        agoraRef.current = AgoraRTC;
        if (cancelled) return;

        const c = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = c;
        setClient(c);

        c.on("user-published", async (ru, mediaType) => {
          await c.subscribe(ru, mediaType);
          if (mediaType === "audio") ru.audioTrack?.play();
          setRemoteUsers([...c.remoteUsers]);
        });
        c.on("user-unpublished", () => setRemoteUsers([...c.remoteUsers]));
        c.on("user-left", (ru) => {
          setRemoteUsers([...c.remoteUsers]);
          setRoster((r) => { const n = { ...r }; delete n[String(ru.uid)]; return n; });
        });

        // Presence + teacher control messages.
        const decoder = new TextDecoder();
        c.on("stream-message", (_uid: UID, payload: Uint8Array) => {
          let msg: RoomMessage;
          try { msg = JSON.parse(decoder.decode(payload)) as RoomMessage; } catch { return; }
          if (msg.k === "hello") {
            if (msg.uid === myUidRef.current) return;
            setRoster((r) => ({ ...r, [msg.uid]: { name: msg.name, role: msg.role, mic: msg.mic, cam: msg.cam } }));
            if (!msg.reply) {
              announce(true); // let the newcomer learn about us
              // The teacher also syncs the board state so late joiners catch up.
              if (isTeacher && showBoardRef.current) send({ k: "board", open: true });
            }
          } else if (msg.k === "status") {
            if (msg.uid === myUidRef.current) return;
            setRoster((r) => (r[msg.uid] ? { ...r, [msg.uid]: { ...r[msg.uid], mic: msg.mic, cam: msg.cam } } : r));
          } else if (msg.k === "ctrl" && msg.target === myUidRef.current) {
            if (msg.action === "mute-audio") forceMute("audio");
            else forceMute("video");
          } else if (msg.k === "board" && !isTeacher) {
            // Students follow the teacher: the board opens/closes on their screen too.
            showBoardRef.current = msg.open;
            setShowBoard(msg.open);
          }
        });

        await c.join(appId, channel, token, uid || null);
        myUidRef.current = String(c.uid ?? "");

        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          micTrack.close(); camTrack.close();
          await c.leave();
          return;
        }
        micTrackRef.current = micTrack;
        camTrackRef.current = camTrack;
        if (localVideoRef.current) camTrack.play(localVideoRef.current);
        await c.publish([micTrack, camTrack]);

        setStatus("live");
        setRemoteUsers([...c.remoteUsers]);
        announce(false); // tell the room who we are
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
      screenTrackRef.current?.close();
      const c = clientRef.current;
      if (c) { c.removeAllListeners(); c.leave().catch(() => {}); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl]);

  // ── Local controls ──
  const toggleMic = async () => {
    if (!micTrackRef.current) return;
    const next = !micOn;
    await micTrackRef.current.setEnabled(next);
    micOnRef.current = next;
    setMicOn(next);
    broadcastStatus();
  };

  const toggleCam = async () => {
    if (!camTrackRef.current) return;
    const next = !camOn;
    await camTrackRef.current.setEnabled(next);
    camOnRef.current = next;
    setCamOn(next);
    broadcastStatus();
  };

  // Teacher asks a participant to mute — the target's client obeys (Agora can't
  // stop another client's track directly).
  const muteParticipant = (uid: string, action: "mute-audio" | "mute-video") => {
    send({ k: "ctrl", target: uid, action });
    toast.success(action === "mute-audio" ? "Demande de coupure du micro envoyée" : "Demande de coupure de la caméra envoyée");
  };

  const stopSharing = async () => {
    const c = clientRef.current;
    const screen = screenTrackRef.current;
    if (!c || !screen) return;
    await c.unpublish(screen);
    screen.stop(); screen.close();
    screenTrackRef.current = null;
    if (camTrackRef.current) {
      await c.publish(camTrackRef.current);
      if (localVideoRef.current) camTrackRef.current.play(localVideoRef.current);
    }
    setSharing(false);
  };

  const toggleScreen = async () => {
    const c = clientRef.current;
    const AgoraRTC = agoraRef.current;
    if (!c || !AgoraRTC) return;
    if (sharing) { await stopSharing(); return; }
    try {
      const screen = await AgoraRTC.createScreenVideoTrack({}, "disable");
      screen.on("track-ended", () => { stopSharing().catch(() => {}); });
      if (camTrackRef.current) await c.unpublish(camTrackRef.current);
      await c.publish(screen);
      screenTrackRef.current = screen;
      if (localVideoRef.current) screen.play(localVideoRef.current);
      setSharing(true);
    } catch {
      // share picker cancelled — ignore
    }
  };

  // Opening the board as the teacher pushes it onto every student's screen.
  const toggleBoard = () => {
    setShowBoard((v) => {
      const next = !v;
      showBoardRef.current = next;
      if (isTeacher) send({ k: "board", open: next });
      return next;
    });
  };

  const closeBoard = () => {
    showBoardRef.current = false;
    setShowBoard(false);
    if (isTeacher) send({ k: "board", open: false });
  };

  const leave = () => { window.location.href = backHref; };

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

  // Everyone sees the whole room. Students get a Teams-style spotlight on the
  // teacher (large) with the rest as small thumbnails; the teacher gets a grid.
  const teacherRemote = remoteUsers.find((ru) => roster[String(ru.uid)]?.role === "teacher");
  const otherRemotes = remoteUsers.filter((ru) => ru !== teacherRemote);

  const tiles = remoteUsers.length + 1;
  const gridCols = showBoard ? "grid-cols-1" : tiles <= 1 ? "grid-cols-1" : tiles <= 4 ? "grid-cols-2" : "grid-cols-3";

  // Side-panel roster: me first, then everyone else.
  const visibleMembers = Object.entries(roster);
  const participants: { uid: string; name: string; role: "teacher" | "student"; mic: boolean; cam: boolean; self: boolean }[] = [
    { uid: "self", name: `${myName} (toi)`, role: myRole, mic: micOn, cam: camOn, self: true },
    ...visibleMembers.map(([uid, m]) => ({ uid, ...m, self: false })),
  ];

  // The local camera tile. `variant` matches RemotePlayer so it can sit in the
  // equal grid ("grid") or in the student spotlight strip ("thumb").
  const renderLocalTile = (variant: "grid" | "thumb" = "grid") => (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-[hsl(var(--muted))] ring-2 ring-[hsl(var(--primary))]/40",
        variant === "thumb" ? "w-40 shrink-0 aspect-video" : "aspect-video w-full",
      )}
    >
      <div ref={localVideoRef} className="absolute inset-0" />
      {!camOn && !sharing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "rounded-full bg-[hsl(var(--background))]/80 flex items-center justify-center font-semibold",
              variant === "thumb" ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg",
            )}
          >
            {initials(myName)}
          </div>
        </div>
      )}
      <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/60 text-white">
        {!micOn && <MicOff className="h-3 w-3 text-red-400" />} {sharing ? "Ton écran" : "Toi"}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Header — collapsible to save vertical space */}
      {showHeader && (
      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {title}
            {isTeacher && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Crown className="h-3 w-3" /> Animateur
              </span>
            )}
          </h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5 mt-0.5">
            <span className={cn("h-2 w-2 rounded-full", status === "live" ? "bg-green-500" : "bg-amber-500 animate-pulse")} />
            {status === "live" ? `${tiles} en ligne` : "connexion…"}
          </p>
        </div>
        <Button variant={showPanel ? "gradient" : "outline"} size="sm" onClick={() => setShowPanel((v) => !v)}>
          <Users className="h-4 w-4" /> Participants ({participants.length})
        </Button>
      </div>
      )}

      {/* Stage (left) + shared whiteboard (right half when open) */}
      <div className={cn("flex gap-3 flex-1 min-h-0", showBoard && "flex-col lg:flex-row")}>
        <div className={cn("flex gap-3 min-w-0 min-h-0", showBoard ? "lg:w-1/2" : "flex-1")}>
        {isTeacher ? (
          // Teacher: equal grid of everyone (scrolls inside its own box if crowded).
          <div className={cn("grid gap-3 flex-1 min-h-0 overflow-y-auto auto-rows-min content-start", gridCols)}>
            {renderLocalTile("grid")}
            {remoteUsers.map((ru) => {
              const m = roster[String(ru.uid)];
              return (
                <RemotePlayer
                  key={String(ru.uid)}
                  user={ru}
                  name={m?.name || `Invité ${String(ru.uid).slice(0, 4)}`}
                  micOn={m?.mic ?? true}
                />
              );
            })}
          </div>
        ) : (
          // Student: Teams-style spotlight on the teacher, others as a thumbnail strip.
          <div className="flex flex-col gap-2 flex-1 min-w-0 min-h-0">
            <div className="flex-1 min-h-0">
              {teacherRemote ? (
                <RemotePlayer
                  variant="stage"
                  user={teacherRemote}
                  name={roster[String(teacherRemote.uid)]?.name || "Professeur"}
                  micOn={roster[String(teacherRemote.uid)]?.mic ?? true}
                />
              ) : (
                <div className="relative h-full w-full rounded-xl overflow-hidden bg-[hsl(var(--muted))] flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  En attente du professeur…
                </div>
              )}
            </div>
            {/* Thumbnail strip — collapsible via the handle on the left */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowStrip((v) => !v)}
                title={showStrip ? "Masquer les vignettes" : "Afficher les vignettes"}
                className="shrink-0 h-8 w-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--accent))]"
              >
                {showStrip ? <ChevronDown className="h-4 w-4" /> : <Images className="h-4 w-4" />}
              </button>
              {showStrip && (
                <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
                  {renderLocalTile("thumb")}
                  {otherRemotes.map((ru) => {
                    const m = roster[String(ru.uid)];
                    return (
                      <RemotePlayer
                        key={String(ru.uid)}
                        variant="thumb"
                        user={ru}
                        name={m?.name || `Invité ${String(ru.uid).slice(0, 4)}`}
                        micOn={m?.mic ?? true}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {showPanel && (
          <div className="w-64 shrink-0 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))] text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-[hsl(var(--primary))]" /> Participants
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[hsl(var(--border))]">
              {participants.map((p) => (
                <div key={p.uid} className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(p.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate flex items-center gap-1">
                      {p.role === "teacher" && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                      {p.name}
                    </p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                      {p.role === "teacher" ? "Professeur" : "Élève"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.mic ? <Mic className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" /> : <MicOff className="h-3.5 w-3.5 text-red-500" />}
                    {p.cam ? <Video className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" /> : <VideoOff className="h-3.5 w-3.5 text-red-500" />}
                    {/* Teacher controls for other participants */}
                    {isTeacher && !p.self && (
                      <>
                        <button
                          onClick={() => muteParticipant(p.uid, "mute-audio")}
                          disabled={!p.mic}
                          title="Couper le micro"
                          className="p-1 rounded-md hover:bg-[hsl(var(--accent))] disabled:opacity-30"
                        >
                          <MicOff className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => muteParticipant(p.uid, "mute-video")}
                          disabled={!p.cam}
                          title="Couper la caméra"
                          className="p-1 rounded-md hover:bg-[hsl(var(--accent))] disabled:opacity-30"
                        >
                          <VideoOff className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {showBoard && (
          <div className="lg:w-1/2 min-w-0 flex-1 min-h-0">
            <Whiteboard client={client} onClose={closeBoard} readOnly={!isTeacher} />
          </div>
        )}
      </div>

      {/* Controls — pinned to the bottom of the room (always visible, no page scroll) */}
      <div className="shrink-0 flex justify-center pt-1">
        <div className="flex items-center justify-center gap-3 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 px-4 py-2 shadow-lg backdrop-blur">
          <Button variant={micOn ? "outline" : "destructive"} size="icon" className="h-12 w-12 rounded-full" onClick={toggleMic} title={micOn ? "Couper le micro" : "Activer le micro"}>
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button variant={camOn ? "outline" : "destructive"} size="icon" className="h-12 w-12 rounded-full" onClick={toggleCam} title={camOn ? "Couper la caméra" : "Activer la caméra"}>
            {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          <Button variant={sharing ? "gradient" : "outline"} size="icon" className="h-12 w-12 rounded-full" onClick={toggleScreen} title={sharing ? "Arrêter le partage" : "Partager l'écran"}>
            <MonitorUp className="h-5 w-5" />
          </Button>
          {/* The whiteboard toggle is teacher-only; students simply follow whatever the teacher opens. */}
          {isTeacher && (
            <Button variant={showBoard ? "gradient" : "outline"} size="icon" className="h-12 w-12 rounded-full" onClick={toggleBoard} title={showBoard ? "Masquer le tableau" : "Ouvrir le tableau"}>
              <Presentation className="h-5 w-5" />
            </Button>
          )}
          {/* Collapse the header to free up vertical space */}
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => setShowHeader((v) => !v)} title={showHeader ? "Masquer l'en-tête" : "Afficher l'en-tête"}>
            {showHeader ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
          <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={leave} title="Quitter">
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
