# Design system

The visual language introduced with the landing-page redesign. Everything lives
in `src/app/globals.css`; components consume it through Tailwind utilities.

## Principles

1. **One hue.** Indigo (`--primary`) is the only brand colour. Tangerine
   (`--brand-warm`) is an accent used sparingly — the headline underline, the
   "new" callout, teacher badges. Never a third gradient stop.
2. **Hairlines over shadows.** Cards are a 1px border plus `--shadow-xs`.
   Depth (`--shadow-md/lg`) is reserved for things that genuinely float:
   hero proof cards, popovers, the highlighted pricing plan.
3. **Rhythm over decoration.** `.section` sets one vertical rhythm; alternating
   `bg-surface` bands separate sections instead of coloured backgrounds.
4. **Arabic is a first-class script.** `ar` is the default locale. Latin runs in
   Inter, Arabic in IBM Plex Sans Arabic; negative letter-spacing is disabled
   under `[dir="rtl"]` because Arabic must never be tracked.

## Tokens

Defined as HSL triples on `:root` / `.dark`, exposed to Tailwind via
`@theme inline`. Use the utility, not the raw variable:

| Utility | Token | Use |
| --- | --- | --- |
| `bg-background` | `--background` | page canvas |
| `bg-surface` | `--surface` | alternating section band |
| `bg-card` | `--card` | any raised surface |
| `bg-primary` / `text-primary` | `--primary` | brand actions, links, active nav |
| `bg-primary-soft` | `--primary-soft` | tinted fill behind primary text |
| `bg-warm-soft`, `text-warm` | `--brand-warm*` | accent callouts |
| `text-muted-foreground` | `--muted-foreground` | secondary copy |
| `border-border` | `--border` | every divider and card edge |

Shadows are applied with the arbitrary-value shadow utility over
`--shadow-xs` / `-sm` / `-md` / `-lg` / `-brand`. Radius scale is driven
by `--radius` (0.875rem): `rounded-lg` → `rounded-xl` → `rounded-2xl`.

## Layout & type classes

| Class | Purpose |
| --- | --- |
| `.container-page` | 76rem max width + responsive gutters |
| `.section` / `.section-tight` | standard vertical rhythm |
| `.display` / `.headline` / `.lead` | fluid type scale, RTL-corrected |
| `.eyebrow` | small caps section label with a leading rule |
| `.accent-word` | the one brand-coloured word in a headline |
| `.underline-sketch` | tangerine rule under the key phrase — once per page |
| `.surface-card` (+ `.is-interactive`) | standard card, optional hover lift |
| `.reveal` | one-shot fade-up; stagger with `--reveal-delay` |

## Section pattern

Every marketing section follows the same shape:

```tsx
<section className="section">            {/* add `border-y border-border bg-surface` to alternate */}
  <div className="container-page">
    <header className="max-w-2xl">
      <p className="eyebrow">{t.badge}</p>
      <h2 className="headline mt-4">
        {t.titleBefore} <span className="accent-word">{t.titleHighlight}</span>
      </h2>
      <p className="lead mt-4">{t.subtitle}</p>
    </header>
    …
  </div>
</section>
```

## RTL rules

- Use logical utilities: `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`.
- Mirror directional icons with `rtl:rotate-180` (arrows only, never logos).
- The navbar keeps `dir="ltr"` on purpose — only its labels translate.

## Legacy classes

`.gradient-bg`, `.gradient-text`, `.glass` and `.mesh-gradient` are referenced
in ~40 dashboard files. They were retuned to the new palette rather than
removed, so those screens inherited the refinement. When touching one of those
files, prefer replacing them with `bg-primary` / `text-foreground` / `bg-card`.
