# Tunisian curriculum corpus

Reference material for the platform, laid out so a lesson, exercise sheet or past
paper can be found from a student's `(cycle, niveau, matière)` alone.

## Layout

```
src/curriculum/tunisia/
  <cycle>/<niveau>/<matière>/<bucket>/<file>.pdf
```

- **cycle** — `primaire`, `college`, `lycee`
- **niveau** — a school year (`7eme`, `9eme`, `6eme`), a Bac section
  (`bac-mathematiques`, `bac-lettres`, …), or one of two span folders:
  - `_cycle` — the document governs the whole cycle
  - `degre-1|2|3` — primary is legislated per *degré*, not per year
    (degré 1 = 1ère–2ème, degré 2 = 3ème–4ème, degré 3 = 5ème–6ème)
- **matière** — slug of the subject (`mathematiques`, `physique-chimie`, `svt`, …)
- **bucket** — one of:

  | bucket | holds |
  | --- | --- |
  | `programme` | official syllabus — what must be taught |
  | `manuel` | the Ministry's prescribed textbook (CNP) |
  | `parascolaire` | third-party revision books — Collection Pilote, Kounouz Ennajeh, التيسير… |
  | `guide` | teacher's guide |
  | `cours` | lesson material |
  | `exercices` | exercise sheets |
  | `devoirs` | devoirs de contrôle / de synthèse |
  | `examens-nationaux` | past national exam papers |
  | `corrections` | corrigés, mirroring the paper that they answer |

A corrigé always sits in `corrections/` under the **same** filename as its paper,
so the pair is found without a lookup: `…/examens-nationaux/2019-principale.pdf`
↔ `…/corrections/2019-principale.pdf`.

Bac papers exist in variants — an Arabic-language version, or the *nouveau
régime* syllabus. These are suffixed rather than overwritten:
`2021-principale-arabe.pdf`, `2019-controle-nouveau-regime.pdf`.

## The PDFs are not in git

`.gitignore` excludes `src/curriculum/**/*.pdf`. The corpus is well over 100 MB
and grows with every exam year, which does not belong in application history.
Committed instead are `manifest.json` (every document, its source URL and where
it lands) and `scripts/fetch-curriculum.mjs`. To rebuild the tree:

```bash
npm run curriculum:plan    # show what would be fetched, write nothing
npm run curriculum:fetch   # download what is missing
```

The fetcher is idempotent — a file already present with a sane size is left
alone, so a re-run only collects what is new or was interrupted.

## Sources and rights

Provenance matters here: the corpus mixes state publications with other
people's copyrighted work, and the two cannot be treated alike.

### Mirrored

| Source | What | Why it is reusable |
| --- | --- | --- |
| [Programmes Officiels](https://education.gov.tn/?p=500&lang=fr) (edunet.tn) | 55 syllabus documents, primaire → secondaire | Official curriculum published by the Ministry of Education |
| [BacWeb](http://www.bacweb.tn/) | Bac papers + corrigés, all sections, 2009→ | Ministry publishes them for revision |
| [9Web](http://www.9web.edunet.tn/) | 9ème national exam papers, 2001→ | Ministry (edunet.tn) |
| [6Web](http://www.6web.edunet.tn/) | 6ème concours papers, 2008→ | Ministry (edunet.tn) |

### Deep-linked, not copied

Recorded in `manifest.json` with their URL so the app can send a student to the
original page — which also sends the author their traffic.

| Source | Why not mirrored |
| --- | --- |
| [CNP — manuels scolaires](https://www.cnp.com.tn/CNP1/web/french/biblio/man-eleves.jsp) | **There is nothing to download.** The page is a sales catalogue (a search form over printed stock, linking to `/services-vente/`), not a PDF library. CNP sells these textbooks; distributing them needs a licence from CNP. |
| [ecoles.com.tn/concours](https://www.ecoles.com.tn/concours) | Private aggregator, not a Ministry site. Take the papers from BacWeb/9Web/6Web instead. |
| tunisiecollege.net, mathsplustn, mathezer.tn, mathforcollege.com, sigmaths.net, riadhyet.com | Each is one teacher's or small publisher's own exercise sheets and devoirs — their copyright, and mostly their livelihood. Several sell courses. Copying them wholesale into a subscription product is redistribution, not aggregation. |

To mirror one of the deep-linked sources, set `mirror: true` on its entry in
`scripts/curriculum-sources.mjs` — but get written permission from the owner
first, and keep the declared `crawlDelayMs` (tunisiecollege.net's robots.txt
asks for 5 s).

## Generated artefacts

Two files turn the corpus from a pile of PDFs into something the app can query.
Both are small and **committed**; the PDFs are not.

| File | Size | Purpose |
| --- | --- | --- |
| `index.json` | ~2.4 MB | Every document's metadata — cycle, niveau, matière, bucket, year, session, bytes — plus facet counts. Drives browsing, retrieval, and any public catalogue. |
| `syllabus.json` | ~1.9 MB | The 55 official programmes with their text extracted, keyed by (cycle, matière). This is what grounds AI generation. |
| `manifest.json` | ~4.5 MB | Fetch record: every source URL, where it landed, and its rights note. Provenance, not runtime data. |

Rebuild them after any fetch:

```bash
npm run curriculum:index
```

### Extraction reality

Only **21 of 55** programmes carry a text layer. The other 34 are scanned
images — all of primaire, and most Arabic-language documents. They are recorded
with `needsOcr: true` rather than dropped, so the gap is visible instead of
silently absent. The Bac exam papers are scans too.

Grounding is therefore available for:

- **collège** — mathématiques, français, anglais, informatique
- **lycée** — mathématiques, physique-chimie, SVT, informatique, français,
  anglais, philosophie, économie, gestion, technologie, éducation civique/islamique
- **primaire** — français only

Everything else needs an OCR pass before it can ground generation.

## How generation uses this

`src/lib/curriculum/index.ts` exposes `getSyllabusGrounding(subject, level, topic)`.
The AI content route calls it and quotes the Ministry's own programme into the
prompt for the exact class being generated for.

The corpus never enters a prompt wholesale — a lycée physique programme alone is
300 000 characters. Paragraphs are scored against the requested chapter and the
best ones returned in document order, within a ~6 000-character budget. When no
usable programme exists the block is simply omitted and generation proceeds as
before, so a missing corpus degrades quality rather than breaking the feature.

## Publishing these documents

The corpus is not one thing legally, and the split matters if any of it goes
public:

- **Publishable** — the Ministry material: programmes officiels, and the
  BacWeb/9Web/6Web past papers, which the Ministry puts online for revision.
- **Not publishable** — the ~4 100 files from TunisieCollège and riadhyet.
  These are individual teachers' own devoirs and exercises. Mirroring them for
  internal reference is one thing; republishing them to the public is
  redistribution of someone else's work. Link to the source instead — every
  record in `manifest.json` keeps its origin URL for exactly this.

## Books imported from a local folder

`scripts/import-livres.mjs` copies manuels and parascolaire out of a download
folder into the tree:

```bash
node scripts/import-livres.mjs ~/Downloads/livres --dry-run
node scripts/import-livres.mjs ~/Downloads/livres
```

CNP manuels arrive named by catalogue code (`102306P00.pdf`). The code reads
`<cycle><matière><classe><édition>` — 102306 is base / maths / 3ème année —
which was confirmed by reading the cover page of each of the 23 rather than
trusting the pattern. The mapping table in the script records what each file
actually is, so the codes never have to be decoded again.

`manuel` and `parascolaire` are kept apart on purpose: a manuel is the
prescribed textbook and can be cited as authority, a parascolaire is a
commercial revision book and cannot. Both are third-party copyright — they
ground generation internally, they do not get republished.

One trap worth knowing if you extend the importer: macOS stores filenames
decomposed (NFD), so an Arabic or accented name written composed (NFC) in source
code will not match the file on disk even though the two look identical. The
script indexes the directory by NFC-normalised name to resolve this.

## Adding a source

Add an entry to `SOURCES` in `scripts/curriculum-sources.mjs` with a `collector`
naming the parser that understands its page shape. Three exist:

- `ministryProgrammes` — the ministry index, placed by URL fragment
- `yearSubject` — a flat list of `/<year>/<subject>.pdf` (9Web, 6Web)
- `bacweb` — one page per subject, linking `bac/<year>/<session>/<section>/<subject>.pdf`

Unmapped subjects and levels are reported rather than guessed, so a run that
prints no `!` lines has placed everything it found.
