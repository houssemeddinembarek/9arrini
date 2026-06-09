import crypto from "crypto";

function sign(params: Record<string, string>, secret: string): string {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha1").update(str + secret).digest("hex");
}

function envCreds() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local");
  }
  return { cloudName, apiKey, apiSecret };
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder = "skillora/content"
): Promise<{ url: string; publicId: string }> {
  const { cloudName, apiKey, apiSecret } = envCreds();

  const timestamp = String(Math.round(Date.now() / 1000));
  const publicId = `${folder}/${filename.replace(/\.pdf$/i, "")}_${timestamp}`;

  const paramsToSign: Record<string, string> = { folder, public_id: publicId, timestamp };
  const signature = sign(paramsToSign, apiSecret);

  const form = new FormData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append("file", new Blob([buffer as any], { type: "application/pdf" }), filename);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}

export async function uploadVideoToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder = "skillora/lessons"
): Promise<{ url: string; publicId: string; duration: number; thumbnailUrl: string; width: number; height: number }> {
  const { cloudName, apiKey, apiSecret } = envCreds();

  const timestamp = String(Math.round(Date.now() / 1000));
  const safeName = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const publicId = `${folder}/${safeName}_${timestamp}`;

  const paramsToSign: Record<string, string> = { folder, public_id: publicId, timestamp };
  const signature = sign(paramsToSign, apiSecret);

  const form = new FormData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append("file", new Blob([buffer as any], { type: mimeType }), filename);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary video upload failed: ${err}`);
  }

  const data = await res.json();
  // Cloudinary auto-generates a poster frame; build the JPG URL.
  const thumbnailUrl = `https://res.cloudinary.com/${cloudName}/video/upload/so_auto,w_640,h_360,c_fill/${data.public_id}.jpg`;

  return {
    url: data.secure_url,
    publicId: data.public_id,
    duration: typeof data.duration === "number" ? data.duration : 0,
    thumbnailUrl,
    width: data.width || 0,
    height: data.height || 0,
  };
}

export async function deleteFromCloudinary(publicId: string, resourceType: "raw" | "video" | "image" = "raw"): Promise<void> {
  const { cloudName, apiKey, apiSecret } = envCreds();

  const timestamp = String(Math.round(Date.now() / 1000));
  const paramsToSign: Record<string, string> = { public_id: publicId, timestamp };
  const signature = sign(paramsToSign, apiSecret);

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    console.warn("Cloudinary delete failed:", await res.text());
  }
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
