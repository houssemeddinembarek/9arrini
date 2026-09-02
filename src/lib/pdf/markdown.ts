// ─── Markdown du document → HTML ─────────────────────────────────────────────
// The AI writes markdown with LaTeX; the preview, the print window and the
// content library all render it through here, so a document looks the same
// wherever it is shown. Deliberately small: it handles exactly what the
// generator is asked to produce, and escapes everything else.

/**
 * A line carrying nothing but mathematics — "$x^2-5x+6=0$". In an Arabic
 * paper these are laid out from the left, exactly as they appear on a French
 * one: the notation is Latin, so it reads left-to-right.
 */
function isMathOnly(text: string): boolean {
  if (!text.includes("$")) return false;
  const withoutMath = text.replace(/\$\$?[^$]*\$\$?/g, " ");
  return !/\p{L}/u.test(withoutMath);
}

/**
 * A run of consecutive list items becomes `<ol>` when the source numbered them
 * ("1. …"), `<ul>` when it bulleted them. The number itself is kept — a QCM
 * question is question 1, not a bullet.
 */
function wrapList(run: string): string {
  // The newlines separating the items would become <br> further down and open
  // a blank line between every question.
  const items = run.replace(/\n/g, "");
  // A list of nothing but equations is laid out left-to-right as a whole,
  // marker included — a lone right-aligned "1." above a formula reads wrong.
  const count = (items.match(/<li\b/g) ?? []).length;
  const mathCount = (items.match(/class="math-line"/g) ?? []).length;
  const cls = count > 0 && mathCount === count ? ' class="math-list"' : "";
  const first = items.match(/data-n="(\d+)"/);
  if (!first) return `<ul${cls}>${items}</ul>`;
  const start = Number(first[1]);
  return `<ol${cls}${start !== 1 ? ` start="${start}"` : ""}>${items}</ol>`;
}

/**
 * A line made only of QCM propositions ("☐ a) …  ☐ b) …") becomes one aligned
 * row of choices, each with a real drawn box rather than the ☐ glyph — bigger
 * and identical on every printer.
 */
function renderChoices(line: string): string {
  const parts = line.split(/[☐□]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return line;
  return `<div class="qcm-choices">${parts
    .map((p) => `<span class="qcm-choice"><span class="qcm-box"></span><span>${p}</span></span>`)
    .join("")}</div>`;
}

/**
 * `[[lignes:2]]` — the space the pupil answers in, on papers that are filled
 * in on the sheet itself. One or two ruled lines, as the question deserves.
 */
function renderAnswerLines(count: string): string {
  const n = Math.min(Math.max(parseInt(count, 10) || 1, 1), 6);
  return `<div class="answer-lines">${'<div class="answer-line"></div>'.repeat(n)}</div>`;
}

export function mdToHtml(text: string): string {
  return text
    .replace(/&(?![a-z#0-9]+;)/gi, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^---$/gm, "<hr>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[ \t]*[☐□][^\n]*$/gm, renderChoices)
    .replace(/\[\[\s*(?:lignes|أسطر)\s*:\s*(\d+)\s*\]\]/gi, (_m, n) => renderAnswerLines(n))
    .replace(/^[-*]\s+(.+)$/gm, (_m, body: string) =>
      `<li${isMathOnly(body) ? ' class="math-line"' : ""}>${body}</li>`)
    .replace(/^(\d+)\.\s+(.+)$/gm, (_m, n: string, body: string) =>
      `<li data-n="${n}"${isMathOnly(body) ? ' class="math-line"' : ""}>${body}</li>`)
    // A formula standing alone on its line, outside any list
    .replace(/^(?![<\s])(.+)$/gm, (line) =>
      isMathOnly(line) ? `<div class="math-line">${line}</div>` : line)
    .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/gm, wrapList)
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br>")
    // A block element brings its own spacing; the line break around it only
    // opens a hole (between a QCM question and its choices, for instance).
    .replace(/(<\/(?:h[1-4]|ul|ol|div|blockquote)>|<hr>)\s*<br>/g, "$1")
    .replace(/<br>\s*(<(?:h[1-4]|ul|ol|div|blockquote|hr)\b)/g, "$1");
}

/**
 * The exercise's own heading, when the model repeats it at the top of its
 * statement — the paper already prints "Exercice 1" above it, so writing it
 * again shows the number twice.
 */
const HEADING_PREFIX =
  /^\**\s*(?:exercice|exercise|probl[èe]me|activit[ée]|التمرين|تمرين|المسألة|مسألة|نشاط)\s*(?:n\s*°|no|عدد|رقم)?\s*(?:\d+|[IVX]+|الأول|الاول|الثاني|الثالث|الرابع|الخامس)?\s*(?:\([^)\n]*\))?\s*\**\s*[:：.\-–—]?\s*/i;

/** What may legitimately follow the heading and still be part of it. */
const TYPE_ONLY =
  /^\**\s*(?:qcm|probl[èe]me|activit[ée]|exercice|اختيار\s*(?:من)?\s*متعدد|مسألة|نشاط|تمرين)\s*\**\s*[:：.\-–—]?\s*$/i;

/**
 * Removes a repeated heading, keeping whatever real content shared its line:
 * "Exercice 1 : QCM" disappears entirely, while "Exercice 1 : Résoudre …"
 * keeps "Résoudre …".
 */
export function stripLeadingHeading(text: string): string {
  const nl = text.indexOf("\n");
  const firstLine = (nl === -1 ? text : text.slice(0, nl)).trim();
  const rest = nl === -1 ? "" : text.slice(nl + 1);

  const match = firstLine.match(HEADING_PREFIX);
  if (!match || !match[0].trim()) return text;

  let leftover = firstLine.slice(match[0].length).trim();
  // "**Exercice 2 :** Résoudre …" — the bold closes after the heading, so the
  // stray "**" belongs to the heading we just removed.
  if (match[0].trimStart().startsWith("**") && leftover.startsWith("**")) {
    leftover = leftover.slice(2).trim();
  }
  if (!leftover || TYPE_ONLY.test(leftover)) return rest.replace(/^\s*\n/, "");
  return nl === -1 ? leftover : `${leftover}\n${rest}`;
}

/**
 * Body of one exercise: the same markdown, minus the repeated heading and the
 * horizontal rules some models sprinkle between questions. A rule inside an
 * exercise cuts the question list in two on the printed paper.
 */
export function exerciseToHtml(text: string): string {
  return mdToHtml(
    stripLeadingHeading(text).replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "")
  );
}
