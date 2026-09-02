/**
 * Registry of curriculum sources for src/curriculum/tunisia.
 *
 * `mirror: true`  → the fetcher downloads the files into the repo.
 * `mirror: false` → the fetcher only records deep links in the manifest, so the
 *                   app can send students to the original page. Flip a source to
 *                   true only once you hold written permission from its owner;
 *                   see the "Rights" note on each entry for who to ask.
 */

export const SOURCES = [
  {
    id: "edunet-programmes",
    label: "Programmes officiels — Ministère de l'Éducation",
    index: "https://education.gov.tn/?p=500&lang=fr",
    host: "www.edunet.tn",
    mirror: true,
    crawlDelayMs: 1000,
    bucket: "programme",
    rights:
      "Official curriculum documents published by the Ministry of Education for " +
      "public use. These specify what must be taught; the platform is built to " +
      "follow them.",
  },
  {
    id: "cnp-manuels",
    label: "Manuels scolaires — Centre National Pédagogique",
    index: "https://www.cnp.com.tn/CNP1/web/french/biblio/man-eleves.jsp",
    host: "www.cnp.com.tn",
    mirror: false,
    crawlDelayMs: 2000,
    bucket: "manuel",
    rights:
      "CNP is the state textbook publisher and SELLS these books — the page is a " +
      "sales catalogue (search form + /services-vente/), not a PDF library. There " +
      "are no downloadable textbook files. Only catalogue metadata (which manual " +
      "exists per level/subject) can be recorded. To distribute the books " +
      "themselves you need a licence from CNP.",
  },

  // ── National exams, published by the Ministry ────────────────────────────
  // Past papers and official corrigés. The Ministry puts these online precisely
  // so pupils can revise from them, which makes them the most clearly reusable
  // material in the corpus.
  {
    id: "bacweb",
    label: "Épreuves du Baccalauréat — BacWeb",
    index: "http://www.bacweb.tn/",
    host: "www.bacweb.tn",
    collector: "bacweb",
    mirror: true,
    // ~2 req/s against a static file server, single connection, sequential.
    crawlDelayMs: 500,
    bucket: "examens-nationaux",
    rights: "Official Bac papers and corrigés published by the Ministry for revision.",
  },
  {
    id: "9web",
    label: "Concours 9ème année — 9Web",
    index: "http://www.9web.edunet.tn/",
    host: "9web.edunet.tn",
    collector: "yearSubject",
    cycle: "college",
    level: "9eme",
    mirror: true,
    crawlDelayMs: 800,
    bucket: "examens-nationaux",
    rights: "Official 9ème national exam papers published by the Ministry (edunet.tn).",
  },
  {
    id: "6web",
    label: "Concours 6ème année — 6Web",
    index: "http://www.6web.edunet.tn/",
    host: "6web.edunet.tn",
    collector: "yearSubject",
    cycle: "primaire",
    level: "6eme",
    mirror: true,
    crawlDelayMs: 800,
    bucket: "examens-nationaux",
    rights: "Official 6ème concours papers published by the Ministry (edunet.tn).",
  },
  {
    id: "ecoles-concours",
    label: "Concours nationaux — ecoles.com.tn",
    index: "https://www.ecoles.com.tn/concours?niveau=3836&matiere=All&date=All",
    host: "www.ecoles.com.tn",
    mirror: false,
    crawlDelayMs: 2000,
    bucket: "examens-nationaux",
    rights:
      "Private aggregator, not a Ministry site — it republishes exams alongside " +
      "its own material. Deep-link it; take the papers themselves from the " +
      "official bacweb/9web/6web sources above.",
  },

  // ── Third-party teacher sites ────────────────────────────────────────────
  // Each is one teacher's or small publisher's own exercise sheets, devoirs and
  // corrections. Mirrored on the owner's instruction; `rights` stays on every
  // record so the provenance is never lost and permission can be sought later.
  {
    id: "tunisiecollege",
    // All 11 subject sections, not just maths: anglais, arabe, physique,
    // sciences-svt, informatique, technologie, éducation civique/islamique/
    // musicale and examens-concours. Crawling starts at the site root so every
    // section is reachable; the subject is read off each file's own URL.
    label: "TunisieCollège — toutes matières, collège",
    index: "https://www.tunisiecollege.net/",
    host: "www.tunisiecollege.net",
    collector: "siteCrawl",
    mirror: true,
    // robots.txt asks Crawl-Delay: 5. That directive governs crawling, so page
    // discovery waits the full 5 s; fetching an already-discovered file waits
    // 2.5 s — still only 0.4 req/s, but it turns a 2-hour download into one hour.
    crawlDelayMs: 5000,
    downloadDelayMs: 2500,
    bucket: "exercices",
    defaultCycle: "college",
    defaultSubject: "mathematiques",
    // No `only` fence any more — the whole site is in scope. /app/ and /j/ are
    // excluded by robots.txt, except /app/download/ which is where files live.
    crawl: { maxPages: 700, maxDepth: 4 },
    rights: "Third-party copyright. robots.txt sets Crawl-Delay 5 and disallows /app/, /j/.",
  },
  {
    id: "mathsplustn",
    label: "Maths Plus TN — cours",
    index: "https://sites.google.com/view/mathsplustn/cours",
    host: "sites.google.com",
    collector: "siteCrawl",
    mirror: true,
    crawlDelayMs: 1500,
    bucket: "cours",
    defaultCycle: "college",
    defaultSubject: "mathematiques",
    // Shared host: without `only` the crawl would escape into all of Google Sites.
    crawl: { only: "^/view/mathsplustn", maxPages: 200, maxDepth: 3 },
    // The pages carry no .pdf links at all — every document lives on Drive and
    // is linked as drive.google.com/open?id=…, which is both cross-origin and
    // extensionless. Without this the site yields nothing.
    allowDrive: true,
    rights: "Third-party copyright (Google Sites / Drive).",
  },
  {
    id: "mathezer",
    label: "Mathezer",
    index: "https://www.mathezer.tn/",
    host: "www.mathezer.tn",
    collector: "siteCrawl",
    mirror: true,
    crawlDelayMs: 1500,
    bucket: "exercices",
    defaultCycle: "college",
    defaultSubject: "mathematiques",
    crawl: { deny: "^/(app|PHPMailer)", maxPages: 200, maxDepth: 3 },
    rights: "Third-party copyright. Commercial site — sells its own courses (Offres & FAQ).",
  },
  {
    id: "mathforcollege",
    label: "MathForCollege (AutarKaw / USF) — numerical methods",
    index: "https://mathforcollege.com/",
    host: "mathforcollege.com",
    collector: "siteCrawl",
    mirror: true,
    crawlDelayMs: 1500,
    bucket: "cours",
    // NOT Tunisian collège maths: this is a US university numerical-methods
    // course in English. Kept out of the curriculum tree so it cannot be served
    // to a student as if it matched their programme.
    defaultCycle: "_hors-programme",
    defaultSubject: "numerical-methods",
    fixedLevel: "mathforcollege",
    crawl: { maxPages: 120, maxDepth: 2 },
    rights: "Third-party copyright (NSF-funded, AutarKaw.com). English, university level.",
  },
  {
    id: "sigmaths",
    label: "Sigmaths",
    index: "https://www.sigmaths.net/",
    host: "www.sigmaths.net",
    collector: "siteCrawl",
    mirror: true,
    crawlDelayMs: 1500,
    bucket: "devoirs",
    defaultCycle: "lycee",
    defaultSubject: "mathematiques",
    crawl: { deny: "^/(Login|allComments)", maxPages: 200, maxDepth: 3 },
    rights: "Third-party copyright.",
  },
  {
    id: "riadhyet",
    label: "Riadhyet",
    index: "https://riadhyet.com/",
    host: "riadhyet.com",
    collector: "siteCrawl",
    mirror: true,
    crawlDelayMs: 1500,
    bucket: "devoirs",
    defaultCycle: "college",
    defaultSubject: "mathematiques",
    crawl: { deny: "\\?format=", maxPages: 200, maxDepth: 3 },
    rights: "Third-party copyright (Joomla site).",
  },
];

/** Anchor label on the ministry index → subject folder slug. */
export const SUBJECT_SLUGS = {
  "arabe": "arabe",
  "mathematique": "mathematiques",
  "mathematiques": "mathematiques",
  "technologie": "technologie",
  "technologies": "technologie",
  "education islamique": "education-islamique",
  "education musicale": "education-musicale",
  "education artistique": "education-artistique",
  "education civique": "education-civique",
  "sciences naturelles": "sciences-naturelles",
  "sciences physiques": "physique-chimie",
  "sciences de la vie et de la terre": "svt",
  "francais": "francais",
  "anglais": "anglais",
  "histoire et geographie": "histoire-geographie",
  "informatique": "informatique",
  "philosopie": "philosophie", // the ministry page has this typo
  "philosophie": "philosophie",
  "economie": "economie",
  "gestion": "gestion",
  "matiere optionnelle": "options",
  "3eme langues": "troisieme-langue",
};

/**
 * URL path fragment → where the document lives in the tree. Programmes are
 * written per *degré* (primaire) or per *cycle* (collège, lycée) rather than per
 * school year, so cycle-wide documents sit in a `_cycle` folder beside the year
 * folders; `appliesTo` in the manifest records the years each one governs.
 */
export const PLACEMENT = [
  { match: "/preparatoire/", cycle: "college", level: "_cycle", appliesTo: ["7eme", "8eme", "9eme"] },
  { match: "/secondaire/", cycle: "lycee", level: "_cycle", appliesTo: ["1ere", "2eme", "3eme", "bac"] },
  { match: "degre1", cycle: "primaire", level: "degre-1", appliesTo: ["1ere", "2eme"] },
  { match: "degre_1", cycle: "primaire", level: "degre-1", appliesTo: ["1ere", "2eme"] },
  { match: "degre2", cycle: "primaire", level: "degre-2", appliesTo: ["3eme", "4eme"] },
  // This one file is named for its degré without the usual "degre" fragment.
  { match: "educ_art_2_1", cycle: "primaire", level: "degre-2", appliesTo: ["3eme", "4eme"] },
  { match: "degre_2", cycle: "primaire", level: "degre-2", appliesTo: ["3eme", "4eme"] },
  { match: "degre3", cycle: "primaire", level: "degre-3", appliesTo: ["5eme", "6eme"] },
  { match: "3degre", cycle: "primaire", level: "degre-3", appliesTo: ["5eme", "6eme"] },
  { match: "/primaire/d1/", cycle: "primaire", level: "_cycle", appliesTo: ["1ere", "2eme", "3eme", "4eme", "5eme", "6eme"] },
];

/**
 * Buckets every subject folder carries — the original scaffold, past papers,
 * and `parascolaire` for the commercial revision series (Collection Pilote,
 * Kounouz Ennajeh, التيسير…), which are deliberately kept apart from `manuel`:
 * a manuel is the Ministry's prescribed textbook, a parascolaire is a
 * third-party revision book, and the two carry very different authority.
 */
export const BUCKETS = [
  "manuel", "parascolaire", "programme", "guide",
  "exercices", "devoirs", "corrections", "examens-nationaux",
];

/** Filename stem on the exam sites → subject folder slug. */
export const EXAM_SUBJECT_SLUGS = {
  math: "mathematiques", maths: "mathematiques", mathematiques: "mathematiques",
  svt: "svt", sn: "svt",
  physique: "physique-chimie", pc: "physique-chimie", sp: "physique-chimie",
  arabe: "arabe", ar: "arabe",
  francais: "francais", fr: "francais",
  anglais: "anglais", ang: "anglais", en: "anglais",
  allemand: "allemand", italien: "italien", espagnol: "espagnol", russe: "russe",
  info: "informatique", informatique: "informatique", algo: "informatique", sti: "informatique", stib: "informatique",
  tech: "technologie", technique: "technologie", technologie: "technologie",
  philo: "philosophie", philosophie: "philosophie", pensee: "philosophie",
  hist: "histoire-geographie", histoire: "histoire-geographie", hg: "histoire-geographie",
  eco: "economie", economie: "economie",
  gest: "gestion", gestion: "gestion",
  islam: "education-islamique", pensee_islamique: "education-islamique",
  pensee: "education-islamique", // bacweb names the Pensée islamique paper "pensee"
  sport: "education-physique", eps: "education-physique", bio: "education-physique",
  civique: "education-civique",
  his_geo: "histoire-geographie", hist_geo: "histoire-geographie",
  algorithme: "informatique", bd: "informatique",
  artistique: "education-artistique", education_artistique: "education-artistique",
  theatre: "education-artistique",
  musique: "education-musicale",
  exp_arabe: "arabe",
  chinois: "chinois", portugais: "portugais", turque: "turc",
};

/**
 * Suffixes bacweb appends to a paper's filename to mark a variant of the same
 * exam: `_ar` an Arabic-language version, `_nr` the "nouveau régime" syllabus.
 * They are stripped to find the subject and kept in the filename so the
 * variants sit side by side instead of overwriting each other.
 */
export const EXAM_VARIANTS = { ar: "arabe", nr: "nouveau-regime", a: "variante-a" };

/** Bac section folder on bacweb → level slug under lycee/. */
export const BAC_SECTIONS = {
  math: "bac-mathematiques",
  mathematiques: "bac-mathematiques",
  sciences: "bac-sciences-experimentales",
  sciences_exp: "bac-sciences-experimentales",
  sciences_ex: "bac-sciences-experimentales",
  lettres: "bac-lettres",
  lettre: "bac-lettres",
  economie_gestion: "bac-economie-gestion",
  informatique: "bac-informatique",
  technique: "bac-technique",
  sport: "bac-sport",
};
