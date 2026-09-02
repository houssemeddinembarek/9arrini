#!/usr/bin/env node
/**
 * Populates src/curriculum/tunisia from the sources declared in
 * curriculum-sources.mjs.
 *
 *   node scripts/fetch-curriculum.mjs            # mirror-enabled sources only
 *   node scripts/fetch-curriculum.mjs --dry-run  # show what would be written
 *
 * Only sources marked `mirror: true` are downloaded. Everything else is recorded
 * in the manifest as a deep link, so the app can point students at the original
 * page instead of copying someone else's files.
 *
 * The fetcher is idempotent: a file already on disk with a matching byte length
 * is left alone, so re-running only picks up what is missing or changed.
 */

import { mkdir, writeFile, readFile, stat, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SOURCES, SUBJECT_SLUGS, PLACEMENT, BUCKETS, EXAM_SUBJECT_SLUGS, BAC_SECTIONS,
  EXAM_VARIANTS,
} from "./curriculum-sources.mjs";
import { inferSubject, inferLevel, inferBucket } from "./curriculum-infer.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TREE = path.join(ROOT, "src/curriculum/tunisia");
const UA = "TelmidhiCurriculumBot/1.0 (+educational platform; contact@telmidhi.tn)";
const DRY = process.argv.includes("--dry-run");
// --only=riadhyet,sigmaths — restrict the run to named sources. A filtered run
// never writes the manifest, since it would describe only part of the corpus.
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "")
  .replace("--only=", "")
  .split(",")
  .filter(Boolean);
// Re-request links a previous run recorded as 404 (a site may have since
// uploaded the missing file).
const RETRY_FAILED = process.argv.includes("--retry-failed");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Strip accents/punctuation so anchor labels match the SUBJECT_SLUGS keys. */
function normalise(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function placementFor(url) {
  return PLACEMENT.find((p) => url.toLowerCase().includes(p.match)) ?? null;
}

/** Node's fetch rejects the ministry's incomplete TLS chain; curl mirrors what a browser accepts. */
async function fetchText(url) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  try {
    const { stdout } = await run("curl", ["-sk", "-L", "-m", "40", "-A", UA, url], {
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  } catch (e) {
    // A timeout still yields whatever arrived before the clock ran out; a page
    // half-read is better than aborting the crawl over one slow response.
    return e?.stdout ?? "";
  }
}

/**
 * Never throws. curl exits non-zero on a timeout (28) or a reset connection even
 * when the transfer actually completed, and an exception here would abort a run
 * of thousands over one slow file — so the outcome is always reported as a
 * value, and the file on disk is the final arbiter.
 */
async function fetchBinary(url, dest) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const args = [
    "-sk", "-L", "-m", "180", "--retry", "2", "--retry-delay", "2", "-A", UA,
    "-w", "%{http_code} %{content_type}",
    "-o", dest, url,
  ];

  let stdout = "";
  let curlError = null;
  try {
    ({ stdout } = await run("curl", args));
  } catch (e) {
    stdout = e?.stdout ?? "";
    curlError = e?.code ?? "error";
  }

  const [rawCode, type = ""] = stdout.trim().split(" ");
  const code = Number(rawCode) || 0;
  return { code, type, curlError };
}

/** Parse the ministry's "Programmes Officiels" index into placed documents. */
async function collectMinistryProgrammes(source) {
  const html = await fetchText(source.index);
  const anchors = [...html.matchAll(/<a[^>]*href="([^"]*\.pdf)"[^>]*>(.*?)<\/a>/gis)];
  const seen = new Set();
  const docs = [];

  for (const [, href, rawLabel] of anchors) {
    const url = new URL(href, source.index).toString();
    if (seen.has(url)) continue; // the page repeats the "cadre" link per degré
    seen.add(url);

    const label = rawLabel.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const place = placementFor(url);
    if (!place) {
      console.warn(`  ! no placement rule for ${url}`);
      continue;
    }

    // The framework document ("cadre") is not a subject — it governs the cycle.
    const key = normalise(label);
    const subject = label ? SUBJECT_SLUGS[key] : "_cadre-general";
    if (!subject) {
      console.warn(`  ! unmapped subject "${label}" (${url})`);
      continue;
    }

    docs.push({
      source: source.id,
      url,
      label: label || "Cadre général",
      cycle: place.cycle,
      level: place.level,
      subject,
      bucket: source.bucket,
      appliesTo: place.appliesTo,
      file: path.posix.join(place.cycle, place.level, subject, source.bucket, path.basename(new URL(url).pathname)),
    });
  }
  return docs;
}

/**
 * Read an exam filename stem: `math`, `math_c` (corrigé), `economie_ar` (Arabic
 * version), `algorithme_nr_c` (nouveau régime, corrigé). The full stem is tried
 * against the subject table first, so multi-word names like `pensee_islamique`
 * and `exp_arabe` are not mistaken for a variant suffix.
 */
function parseExamStem(stem) {
  const isCorrection = /_c$/.test(stem);
  let base = stem.replace(/_c$/, "");
  let variant = null;

  if (!EXAM_SUBJECT_SLUGS[base]) {
    const m = base.match(/^(.*)_(ar|nr|a)$/);
    if (m && EXAM_SUBJECT_SLUGS[m[1]]) {
      base = m[1];
      variant = EXAM_VARIANTS[m[2]];
    }
  }
  return { subject: EXAM_SUBJECT_SLUGS[base] ?? null, isCorrection, variant };
}

/**
 * 9Web / 6Web: one flat page of links shaped /<year>/<subject>.pdf. The year
 * carries the identity, so it becomes the filename inside the subject folder.
 */
async function collectYearSubject(source) {
  const html = await fetchText(source.index);
  const hrefs = [...html.matchAll(/href="([^"]*\.pdf)"/gi)].map((m) => m[1]);
  const seen = new Set();
  const docs = [];

  for (const href of hrefs) {
    const url = new URL(href, source.index).toString();
    if (seen.has(url)) continue;
    seen.add(url);

    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const stem = path.basename(parts.at(-1), ".pdf").toLowerCase();
    const year = parts.at(-2);
    if (!/^\d{4}$/.test(year ?? "")) continue;

    const { subject, isCorrection, variant } = parseExamStem(stem);
    if (!subject) {
      console.warn(`  ! unmapped exam subject "${stem}" (${url})`);
      continue;
    }

    const bucket = isCorrection ? "corrections" : source.bucket;
    const name = variant ? `${year}-${variant}.pdf` : `${year}.pdf`;
    docs.push({
      source: source.id, url, label: `${subject} ${year}`,
      cycle: source.cycle, level: source.level, subject, bucket, variant,
      appliesTo: [source.level], year,
      file: path.posix.join(source.cycle, source.level, subject, bucket, name),
    });
  }
  return docs;
}

/**
 * BacWeb splits its papers across one page per subject; each links to
 * bac/<year>/<session>/<section>/<subject>.pdf, with `_c` marking the corrigé.
 */
async function collectBacweb(source) {
  const index = await fetchText(source.index);
  const pages = new Set(
    [...index.matchAll(/href="([a-z0-9_-]+\.htm)"/gi)].map((m) => m[1]),
  );
  const seen = new Set();
  const docs = [];

  for (const page of pages) {
    const pageUrl = new URL(page, source.index).toString();
    let html;
    try {
      html = await fetchText(pageUrl);
    } catch {
      continue;
    }
    await sleep(source.crawlDelayMs);

    for (const [, href] of html.matchAll(/href="([^"]*\.pdf)"/gi)) {
      const url = new URL(href, pageUrl).toString();
      if (seen.has(url)) continue;
      seen.add(url);

      // bac/<year>/<session>/<section>/<subject>.pdf
      const parts = new URL(url).pathname.split("/").filter(Boolean);
      const i = parts.indexOf("bac");
      if (i === -1 || parts.length < i + 5) continue;
      const [year, session, section] = parts.slice(i + 1, i + 4);
      if (!/^\d{4}$/.test(year)) continue;

      const stem = path.basename(parts.at(-1), ".pdf").toLowerCase();
      const { subject, isCorrection, variant } = parseExamStem(stem);
      const level = BAC_SECTIONS[section];
      if (!subject || !level) {
        console.warn(`  ! unmapped bac paper ${section}/${stem} (${url})`);
        continue;
      }

      const bucket = isCorrection ? "corrections" : source.bucket;
      const name = variant
        ? `${year}-${session}-${variant}.pdf`
        : `${year}-${session}.pdf`;
      docs.push({
        source: source.id, url, label: `${subject} ${year} ${session}`,
        cycle: "lycee", level, subject, bucket, variant,
        appliesTo: [level], year, session,
        file: path.posix.join("lycee", level, subject, bucket, name),
      });
    }
  }
  return docs;
}

// ── Generic site crawl ─────────────────────────────────────────────────────
// The teacher sites have no common page shape, so rather than six bespoke
// parsers this walks each site from its index, same host only, and picks up
// whatever PDFs it finds. Subject, level and bucket are read off the URL and
// link text by ./curriculum-infer.mjs; anything unrecognised lands in
// `_non-classe` rather than being guessed into the wrong year.

/** Parse robots.txt into the Allow/Disallow rules for `User-agent: *`. */
async function readRobots(origin) {
  let body = "";
  try {
    body = await fetchText(`${origin}/robots.txt`);
  } catch {
    return { allow: [], disallow: [] };
  }
  if (/<html/i.test(body)) return { allow: [], disallow: [] }; // 404 page

  const allow = [], disallow = [];
  let applies = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [k, ...rest] = line.split(":");
    const key = k.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") applies = value === "*";
    else if (applies && key === "disallow" && value) disallow.push(value);
    else if (applies && key === "allow" && value) allow.push(value);
  }
  return { allow, disallow };
}

/** Longest-prefix match, Allow winning ties — the usual robots precedence. */
function robotsPermits({ allow, disallow }, pathname) {
  const hit = (rules) =>
    rules.filter((r) => pathname.startsWith(r)).sort((a, b) => b.length - a.length)[0] ?? "";
  return hit(allow).length >= hit(disallow).length;
}

function safeName(pathname) {
  return decodeURIComponent(path.basename(pathname))
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "")
    .slice(-120) || "document.pdf";
}

async function collectSiteCrawl(source) {
  const start = new URL(source.index);
  const origin = start.origin;
  const robots = await readRobots(origin);
  const maxPages = source.crawl?.maxPages ?? 150;
  const maxDepth = source.crawl?.maxDepth ?? 3;

  const queue = [{ url: start.toString(), depth: 0 }];
  const visited = new Set();
  const pdfs = new Map(); // url -> link text that led to it
  let pages = 0;

  while (queue.length && pages < maxPages) {
    const { url, depth } = queue.shift();
    if (visited.has(url) || depth > maxDepth) continue;
    visited.add(url);

    let html;
    try {
      html = await fetchText(url);
    } catch {
      continue;
    }
    pages++;
    await sleep(source.crawlDelayMs);

    for (const [, href, text] of html.matchAll(/<a[^>]*href="([^"#][^"]*)"[^>]*>(.*?)<\/a>/gis)) {
      let target;
      try {
        target = new URL(href, url);
      } catch {
        continue;
      }
      const label = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      // Google Sites keeps its documents on Drive, linked as
      // drive.google.com/open?id=… — cross-origin AND without a .pdf
      // extension, so neither the origin test nor the extension test below
      // would ever see them. Rewrite to the direct-download form.
      if (source.allowDrive) {
        const id = target.href.match(
          /drive\.google\.com\/(?:open\?id=|file\/d\/|uc\?(?:[^"]*&)?id=)([A-Za-z0-9_-]{10,})/,
        )?.[1];
        if (id) {
          const dl = `https://drive.google.com/uc?export=download&id=${id}`;
          if (!pdfs.has(dl)) pdfs.set(dl, label || id);
          continue;
        }
      }

      if (target.origin !== origin) continue;
      if (!robotsPermits(robots, target.pathname)) continue;

      if (/\.pdf$/i.test(target.pathname)) {
        if (!pdfs.has(target.toString())) pdfs.set(target.toString(), label);
      } else if (
        depth < maxDepth &&
        !/\.(jpg|jpeg|png|gif|svg|css|js|zip|rar|mp4|webm|doc|docx|xls)$/i.test(target.pathname) &&
        (!source.crawl?.deny || !new RegExp(source.crawl.deny, "i").test(target.pathname)) &&
        // `only` keeps a crawl inside its own corner of a shared host — vital on
        // sites.google.com, where the origin is every Google Sites page there is.
        (!source.crawl?.only || new RegExp(source.crawl.only, "i").test(target.pathname))
      ) {
        const next = target.origin + target.pathname + target.search;
        if (!visited.has(next)) queue.push({ url: next, depth: depth + 1 });
      }
    }
  }

  console.log(`  crawled ${pages} pages, found ${pdfs.size} PDFs`);

  const docs = [];
  const used = new Set();
  for (const [url, label] of pdfs) {
    const u = new URL(url);
    const hay = `${decodeURIComponent(u.pathname)} ${label}`;
    const placed = source.fixedLevel
      ? { cycle: source.defaultCycle, level: source.fixedLevel }
      : inferLevel(hay) ?? { cycle: source.defaultCycle, level: "_non-classe" };

    const bucket = inferBucket(hay, source.bucket);
    // A site's own section naming ("/sciences-svt/", "Devoir anglais 8ème") is
    // the best signal for the subject; the source default is only a fallback.
    const subject = inferSubject(hay) ?? source.defaultSubject;

    // A Drive download URL has no filename in its path (it is just /uc), so the
    // link text is the only name the document has. Fall back to the file id.
    const isDrive = u.hostname === "drive.google.com";
    let name = isDrive
      ? `${safeName(label || u.searchParams.get("id") || "document").replace(/\.pdf$/i, "")}.pdf`
      : safeName(u.pathname);

    let file = path.posix.join(placed.cycle, placed.level, subject, bucket, name);
    let n = 2;
    while (used.has(file)) { // two sites can ship the same filename
      file = path.posix.join(placed.cycle, placed.level, subject, bucket,
        name.replace(/\.pdf$/i, "") + `-${n++}.pdf`);
    }
    used.add(file);

    docs.push({
      source: source.id, url, label: label || name,
      cycle: placed.cycle, level: placed.level, subject, bucket,
      appliesTo: [placed.level], file,
    });
  }
  return docs;
}

const COLLECTORS = {
  siteCrawl: collectSiteCrawl,
  ministryProgrammes: collectMinistryProgrammes,
  yearSubject: collectYearSubject,
  bacweb: collectBacweb,
};

/** URLs the last run proved dead (404), so this one need not ask again. */
async function loadDeadLinks() {
  if (RETRY_FAILED) return new Set();
  try {
    const prev = JSON.parse(await readFile(path.join(TREE, "manifest.json"), "utf8"));
    return new Set(
      prev.documents
        .filter((d) => d.status === "failed" && d.httpStatus === 404)
        .map((d) => d.url),
    );
  } catch {
    return new Set(); // no manifest yet, or unreadable — just fetch everything
  }
}

async function main() {
  const manifest = { generatedAt: new Date().toISOString(), sources: [], documents: [] };
  let downloaded = 0, skipped = 0, failed = 0, deadSkipped = 0;
  const deadLinks = await loadDeadLinks();
  if (deadLinks.size) {
    console.log(`skipping ${deadLinks.size} links a previous run found dead (--retry-failed to recheck)`);
  }

  for (const source of SOURCES) {
    if (ONLY.length && !ONLY.includes(source.id)) continue;
    manifest.sources.push({
      id: source.id, label: source.label, index: source.index,
      mirrored: source.mirror, rights: source.rights,
    });

    if (!source.mirror) {
      console.log(`\n· ${source.id} — deep link only (${source.rights.split(".")[0]}.)`);
      continue;
    }

    console.log(`\n▸ ${source.id} — ${source.label}`);
    const collect = COLLECTORS[source.collector ?? "ministryProgrammes"];
    const docs = await collect(source);
    console.log(`  ${docs.length} documents found`);

    for (const doc of docs) {
      const dest = path.join(TREE, doc.file);

      if (existsSync(dest) && (await stat(dest)).size > 1024) {
        skipped++;
        manifest.documents.push({ ...doc, status: "present" });
        continue;
      }

      // A link the site advertises but has never uploaded 404s on every run.
      // Re-requesting it each time only adds load, so once seen it is left
      // alone until --retry-failed asks for another look.
      if (deadLinks.has(doc.url)) {
        deadSkipped++;
        manifest.documents.push({ ...doc, status: "failed", httpStatus: 404 });
        continue;
      }
      if (DRY) {
        console.log(`  would write ${doc.file}`);
        manifest.documents.push({ ...doc, status: "pending" });
        continue;
      }

      try {
        await mkdir(path.dirname(dest), { recursive: true });
        const { code, type, curlError } = await fetchBinary(doc.url, dest);

        // What landed on disk decides, not curl's exit status: a timeout can
        // still leave a complete PDF, and a 404 page is served as HTML.
        const size = existsSync(dest) ? (await stat(dest)).size : 0;
        const looksPdf = size > 1024 && !type.includes("html");

        if (code === 200 && looksPdf) {
          downloaded++;
          console.log(`  ✓ ${doc.file} (${Math.round(size / 1024)} KB)`);
          manifest.documents.push({ ...doc, status: "downloaded", bytes: size });
        } else {
          failed++;
          if (size && !looksPdf) await rm(dest, { force: true }); // don't leave a stub
          // Say *why* it was rejected: a 200 that served 0 bytes, or an HTML
          // error page, is otherwise indistinguishable from a fetcher bug.
          const why = !code
            ? `curl ${curlError ?? "failed"}`
            : code !== 200
              ? `http ${code}`
              : size === 0
                ? "http 200 but empty file on server"
                : `http 200 but ${type || "unknown type"}, ${size} B`;
          console.warn(`  ✗ ${doc.file} — ${why}`);
          manifest.documents.push({
            ...doc, status: "failed", httpStatus: code || null, reason: why,
          });
        }
      } catch (e) {
        // One unreadable document must never end a run of thousands.
        failed++;
        console.warn(`  ✗ ${doc.file} — ${e?.message ?? e}`);
        manifest.documents.push({ ...doc, status: "failed", error: String(e?.message ?? e) });
      }
      await sleep(source.downloadDelayMs ?? source.crawlDelayMs);
    }
  }

  if (!DRY && !ONLY.length) {
    await mkdir(TREE, { recursive: true });
    await writeFile(
      path.join(TREE, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
  }
  console.log(
    `\ndownloaded ${downloaded} · already present ${skipped} · ` +
    `failed ${failed} · known-dead skipped ${deadSkipped}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
