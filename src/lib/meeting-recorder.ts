// Browser-side meeting recorder. Composites every participant's video into a
// grid on an offscreen canvas and mixes all audio tracks through WebAudio, then
// captures the result with MediaRecorder. The teacher's client drives this; the
// produced webm Blob is uploaded and saved so students can replay the meeting.

export interface RecorderSource {
  id: string;
  label: string;
  video?: MediaStreamTrack;
  audio?: MediaStreamTrack;
}

export class MeetingRecorder {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioCtx: AudioContext | null = null;
  private dest: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private raf = 0;
  private running = false;

  private videos = new Map<string, HTMLVideoElement>();
  private audioNodes = new Map<string, { node: MediaStreamAudioSourceNode; track: MediaStreamTrack }>();
  private labels = new Map<string, string>();
  private order: string[] = [];

  // An optional "main" surface (e.g. the shared whiteboard canvas) shown large
  // with participants reduced to a thumbnail strip — like screen sharing.
  private primaryCanvas: HTMLCanvasElement | null = null;
  private primaryLabel = "";

  static isSupported(): boolean {
    return typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && typeof HTMLCanvasElement.prototype.captureStream === "function";
  }

  constructor(private width = 1280, private height = 720) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.audioCtx = new AudioContext();
    this.dest = this.audioCtx.createMediaStreamDestination();

    const canvasStream = this.canvas.captureStream(24);
    const stream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...this.dest.stream.getAudioTracks(),
    ]);

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";
    this.recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_500_000 });
    this.recorder.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.recorder.start(1000);

    const loop = () => {
      if (!this.running) return;
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // Set (or clear) the main surface drawn large in the recording. Pass the
  // shared whiteboard canvas while it's open; pass null to go back to the grid.
  setPrimary(canvas: HTMLCanvasElement | null, label = "") {
    this.primaryCanvas = canvas;
    this.primaryLabel = label;
  }

  // Reconcile the live set of participant tracks (people join/leave, cameras and
  // screen-shares toggle), creating/removing hidden video elements and audio nodes.
  setSources(sources: RecorderSource[]) {
    const ids = new Set(sources.map((s) => s.id));

    for (const [id, v] of this.videos) {
      if (!ids.has(id)) { v.srcObject = null; this.videos.delete(id); }
    }
    for (const [id, a] of this.audioNodes) {
      if (!ids.has(id)) { try { a.node.disconnect(); } catch {} this.audioNodes.delete(id); }
    }

    this.order = sources.map((s) => s.id);

    for (const s of sources) {
      this.labels.set(s.id, s.label);

      // Video element (one per active video track).
      if (s.video) {
        const cur = this.videos.get(s.id);
        const curTrack = (cur?.srcObject as MediaStream | null)?.getVideoTracks()[0];
        if (!cur || curTrack !== s.video) {
          const v = document.createElement("video");
          v.muted = true;
          v.autoplay = true;
          v.playsInline = true;
          v.srcObject = new MediaStream([s.video]);
          v.play().catch(() => {});
          this.videos.set(s.id, v);
        }
      } else {
        const cur = this.videos.get(s.id);
        if (cur) { cur.srcObject = null; this.videos.delete(s.id); }
      }

      // Audio source feeding the mixer.
      if (s.audio && this.audioCtx && this.dest) {
        const existing = this.audioNodes.get(s.id);
        if (!existing || existing.track !== s.audio) {
          if (existing) { try { existing.node.disconnect(); } catch {} }
          const node = this.audioCtx.createMediaStreamSource(new MediaStream([s.audio]));
          node.connect(this.dest);
          this.audioNodes.set(s.id, { node, track: s.audio });
        }
      } else {
        const existing = this.audioNodes.get(s.id);
        if (existing) { try { existing.node.disconnect(); } catch {} this.audioNodes.delete(s.id); }
      }
    }
  }

  private draw() {
    const ctx = this.ctx, W = this.width, H = this.height;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);

    const ids = this.order.filter((id) => this.videos.has(id));

    if (this.primaryCanvas) {
      // Whiteboard (or other shared surface) large, participants in a bottom strip.
      const stripH = ids.length ? Math.round(H * 0.2) : 0;
      const mainH = H - stripH;
      this.drawFit(this.primaryCanvas, 0, 0, W, mainH, false);
      this.drawLabel(this.primaryLabel, 0, 0, W, mainH);

      if (stripH > 0) {
        const tileW = Math.min((stripH - 12) * (16 / 9), (W - 8) / ids.length - 8);
        ids.forEach((id, i) => {
          const x = 8 + i * (tileW + 8);
          this.drawFit(this.videos.get(id)!, x, mainH + 6, tileW, stripH - 12, true);
        });
      }
      return;
    }

    const n = Math.max(ids.length, 1);
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cw = W / cols, ch = H / rows;

    ids.forEach((id, i) => {
      const cx = (i % cols) * cw;
      const cy = Math.floor(i / cols) * ch;
      this.drawFit(this.videos.get(id)!, cx + 4, cy + 4, cw - 8, ch - 8, true);
      this.drawLabel(this.labels.get(id) || "", cx, cy, cw, ch);
    });
  }

  private drawLabel(label: string, x: number, y: number, w: number, h: number) {
    if (!label) return;
    const ctx = this.ctx;
    ctx.font = "16px sans-serif";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x + 10, y + h - 32, tw + 16, 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 18, y + h - 16);
  }

  // Draw a video or canvas into a box, either cover (crop) or contain (letterbox).
  private drawFit(src: HTMLVideoElement | HTMLCanvasElement, x: number, y: number, w: number, h: number, cover: boolean) {
    const ctx = this.ctx;
    const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.width;
    const sh = src instanceof HTMLVideoElement ? src.videoHeight : src.height;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, w, h);
    if (sw && sh) {
      const scale = cover ? Math.max(w / sw, h / sh) : Math.min(w / sw, h / sh);
      const dw = sw * scale, dh = sh * scale;
      try { ctx.drawImage(src, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); } catch {}
    }
    ctx.restore();
  }

  async stop(): Promise<Blob> {
    this.running = false;
    cancelAnimationFrame(this.raf);

    const rec = this.recorder;
    const blob = await new Promise<Blob>((resolve) => {
      if (!rec || rec.state === "inactive") {
        resolve(new Blob(this.chunks, { type: "video/webm" }));
        return;
      }
      rec.onstop = () => resolve(new Blob(this.chunks, { type: "video/webm" }));
      rec.stop();
    });

    for (const v of this.videos.values()) v.srcObject = null;
    this.videos.clear();
    for (const a of this.audioNodes.values()) { try { a.node.disconnect(); } catch {} }
    this.audioNodes.clear();
    try { await this.audioCtx?.close(); } catch {}
    this.audioCtx = null;
    this.dest = null;
    this.recorder = null;

    return blob;
  }
}
