// ─── Sommaire du manuel, par niveau ──────────────────────────────────────────
// Transcrit du programme officiel du Ministère de l'Éducation
// (src/curriculum/tunisia/college/_cycle/mathematiques/programme/math_college.pdf,
// section « المحتوى المعرفي » de chaque année).
//
// Le document distingue deux niveaux dans son contenu: les chapitres (puce ▪)
// et, sous chacun, les paragraphes (tirets). La même hiérarchie est reprise
// ici, pour que l'enseignant coche exactement le contenu de son devoir plutôt
// que de le décrire à la main.

export type Paragraph = { id: string; fr: string; ar: string };
export type Chapter = { id: string; fr: string; ar: string; paragraphs: Paragraph[] };
export type ChapterDomain = { fr: string; ar: string; chapters: Chapter[] };

const NUM = { fr: "Activités numériques", ar: "الأنشطة العددية" };
const ALG = { fr: "Calcul algébrique", ar: "الحساب الجبري" };
const STA = { fr: "Statistiques et probabilités", ar: "الإحصاء والاحتمالات" };
const GEO = { fr: "Activités géométriques", ar: "الأنشطة الهندسية" };
const MES = { fr: "Mesure", ar: "القيس" };

/** Raccourci d'écriture: p("id", "français", "عربي"). */
const p = (id: string, fr: string, ar: string): Paragraph => ({ id, fr, ar });

const SEPT: ChapterDomain[] = [
  { ...NUM, chapters: [
    { id: "7-arithmetique", fr: "Arithmétique et numération", ar: "علم الحساب والتعداد", paragraphs: [
      p("7-division-euclidienne", "Division euclidienne", "القسمة الإقليدية"),
      p("7-divisibilite", "Critères de divisibilité par 2, 3, 5, 9, 4 et 25", "قابلية قسمة عدد صحيح طبيعي على 2 و3 و5 و9 و4 و25"),
      p("7-premiers", "Nombres premiers", "الأعداد الأولية"),
      p("7-decomposition", "Décomposition en produit de facteurs premiers", "التفكيك إلى جداء عوامل أولية"),
      p("7-pgcd", "Plus grand commun diviseur (PGCD)", "القاسم المشترك الأكبر"),
      p("7-ppcm", "Plus petit commun multiple (PPCM)", "المضاعف المشترك الأصغر"),
      p("7-premiers-entre-eux", "Nombres premiers entre eux", "عددان أوليان فيما بينهما"),
      p("7-cardinal", "Cardinal d'un ensemble fini", "كم مجموعة منتهية"),
    ]},
    { id: "7-entiers-decimaux", fr: "Entiers naturels et décimaux positifs", ar: "الأعداد الصحيحة الطبيعية والأعداد العشرية الموجبة", paragraphs: [
      p("7-rationnels-positifs", "Nombres rationnels positifs", "الأعداد الكسرية الموجبة"),
      p("7-operations", "Opérations", "العمليات عليها"),
      p("7-comparaison", "Comparaison et ordre", "المقارنة والترتيب"),
      p("7-puissances", "Puissances", "القوى"),
      p("7-valeur-approchee", "Valeur approchée d'un rationnel", "القيمة التقريبية لعدد كسري"),
    ]},
    { id: "7-decimaux-relatifs", fr: "Nombres décimaux relatifs", ar: "الأعداد العشرية النسبية", paragraphs: [
      p("7-oppose", "Opposé d'un décimal relatif", "عدد عشري نسبي مقابل"),
      p("7-droite-graduee", "Droite graduée", "المستقيم المدرج"),
    ]},
  ]},
  { ...ALG, chapters: [
    { id: "7-expressions-litterales", fr: "Expressions littérales", ar: "العبارات الحرفية", paragraphs: [
      p("7-calcul-valeur", "Calcul de la valeur numérique d'une expression", "حساب القيمة العددية لعبارة حرفية"),
    ]},
    { id: "7-expressions-algebriques", fr: "Expressions algébriques ax + b", ar: "العبارات الجبرية من نوع ax + b", paragraphs: [
      p("7-developpement", "Développement et réduction", "النشر والاختصار"),
    ]},
    { id: "7-equations", fr: "Équations du type ax = b", ar: "معادلات من نوع ax = b", paragraphs: [
      p("7-resolution", "Résolution d'une équation ax = b", "حل معادلة من نوع ax = b"),
    ]},
  ]},
  { ...STA, chapters: [
    { id: "7-tableaux", fr: "Tableaux statistiques", ar: "الجداول الإحصائية", paragraphs: [
      p("7-quantitative", "Série à caractère quantitatif discret", "سلسلة ذات مميزة كمية منقطعة"),
      p("7-qualitative", "Série à caractère qualitatif", "سلسلة ذات مميزة كيفية"),
      p("7-vocabulaire", "Effectif, fréquence, moyenne", "التكرار والتواتر والمعدل"),
    ]},
    { id: "7-graphiques", fr: "Représentations graphiques", ar: "التمثيل البياني لسلسلة إحصائية", paragraphs: [
      p("7-batons", "Diagramme en bâtons", "مخطط العصيات"),
      p("7-circulaire", "Diagramme circulaire", "المخطط الدائري"),
    ]},
    { id: "7-aleatoire", fr: "Phénomènes aléatoires", ar: "الظواهر العشوائية", paragraphs: [
      p("7-evenements", "Événement certain, possible, impossible", "حدث أكيد وحدث ممكن وحدث مستحيل"),
    ]},
  ]},
  { ...GEO, chapters: [
    { id: "7-droites-angles", fr: "Droites et angles", ar: "المستقيمات والزوايا", paragraphs: [
      p("7-mediatrice", "Médiatrice d'un segment", "الموسط العمودي لقطعة مستقيم"),
      p("7-paralleles", "Droites parallèles", "المستقيمات المتوازية"),
      p("7-perpendiculaires", "Droites perpendiculaires", "المستقيمات المتعامدة"),
      p("7-distance", "Distance d'un point à une droite", "بعد نقطة عن مستقيم"),
      p("7-cercle-droite", "Position relative d'un cercle et d'une droite", "الوضعية النسبية لدائرة ومستقيم"),
      p("7-angles", "Angles adjacents, complémentaires, supplémentaires, opposés par le sommet", "زاويتان متجاورتان ومتتامتان ومتكاملتان ومتقابلتان بالرأس"),
      p("7-bissectrice", "Bissectrice d'un angle", "منصف زاوية"),
    ]},
    { id: "7-triangles", fr: "Triangles", ar: "المثلثات", paragraphs: [
      p("7-inegalite", "Inégalité triangulaire", "اللامساواة المثلثية"),
      p("7-somme-angles", "Somme des mesures des angles d'un triangle", "مجموع قيسات زوايا مثلث"),
      p("7-droites-remarquables", "Droites remarquables d'un triangle", "المستقيمات المعتبرة في المثلث"),
    ]},
    { id: "7-quadrilateres", fr: "Quadrilatères", ar: "رباعيات الأضلاع", paragraphs: [
      p("7-quadrilateres-particuliers", "Parallélogramme, rectangle, losange, carré", "متوازي الأضلاع والمستطيل والمعين والمربع"),
    ]},
    { id: "7-solides", fr: "Solides", ar: "المجسمات", paragraphs: [
      p("7-cube-pave", "Cube et pavé droit", "المكعب ومتوازي المستطيلات"),
      p("7-prisme", "Prisme droit", "المنشور القائم"),
    ]},
  ]},
  { ...MES, chapters: [
    { id: "7-unites", fr: "Unités de mesure", ar: "وحدات القيس", paragraphs: [
      p("7-unites-simples", "Unités simples: longueur, aire, volume, angle, masse, temps", "وحدات القيس الأساسية"),
      p("7-unites-composees", "Unités composées: vitesse, masse volumique", "وحدات القيس المركبة"),
      p("7-echelle", "Échelle", "السلم"),
    ]},
  ]},
];

const HUIT: ChapterDomain[] = [
  { ...NUM, chapters: [
    { id: "8-arithmetique", fr: "Arithmétique et numération", ar: "علم الحساب والتعداد", paragraphs: [
      p("8-divisibilite-8", "Critère de divisibilité par 8", "قابلية قسمة عدد صحيح طبيعي على 8"),
      p("8-cardinal", "Cardinal d'un ensemble fini", "كم مجموعة منتهية"),
    ]},
    { id: "8-entiers-relatifs", fr: "Nombres entiers relatifs", ar: "الأعداد الصحيحة النسبية", paragraphs: [
      p("8-operations-relatifs", "Opérations sur les entiers relatifs", "العمليات على الأعداد الصحيحة النسبية"),
    ]},
    { id: "8-rationnels-relatifs", fr: "Nombres rationnels relatifs", ar: "الأعداد الكسرية النسبية", paragraphs: [
      p("8-operations", "Opérations", "العمليات عليها"),
      p("8-comparaison", "Comparaison et ordre", "المقارنة والترتيب"),
      p("8-puissances", "Puissance d'exposant entier relatif", "قوة عدد دليلها عدد صحيح نسبي"),
      p("8-valeur-approchee", "Valeur approchée", "القيمة التقريبية لعدد كسري نسبي"),
      p("8-droite-graduee", "Graduation d'une droite", "تدريج مستقيم"),
      p("8-valeur-absolue", "Valeur absolue", "القيمة المطلقة لعدد كسري نسبي"),
    ]},
  ]},
  { ...ALG, chapters: [
    { id: "8-expressions", fr: "Expressions algébriques ax + b et ax² + bx + c", ar: "العبارات الجبرية من نوع ax + b و ax² + bx + c", paragraphs: [
      p("8-somme-difference", "Somme, différence et réduction", "الجمع والطرح والاختصار"),
      p("8-developpement", "Développement de (ax + b)(cx + d)", "نشر عبارة من نوع (ax + b)(cx + d)"),
      p("8-factorisation", "Factorisation par un facteur commun", "التفكيك بعامل مشترك"),
    ]},
    { id: "8-equations", fr: "Équations du type ax = b", ar: "معادلات من نوع ax = b", paragraphs: [
      p("8-resolution", "Résolution dans l'ensemble des rationnels relatifs", "الحل في مجموعة الأعداد الكسرية النسبية"),
    ]},
  ]},
  { ...STA, chapters: [
    { id: "8-series", fr: "Séries statistiques", ar: "السلاسل الإحصائية", paragraphs: [
      p("8-discrete", "Série quantitative discrète", "سلسلة ذات مميزة كمية منقطعة"),
      p("8-continue", "Série quantitative continue", "سلسلة ذات مميزة كمية مسترسلة"),
      p("8-qualitative", "Série qualitative", "سلسلة ذات مميزة كيفية"),
      p("8-indicateurs", "Effectif, fréquence, moyenne, médiane", "التكرار والتواتر والمعدل والموسط"),
    ]},
    { id: "8-graphiques", fr: "Représentations graphiques", ar: "التمثيل البياني لسلسلة إحصائية", paragraphs: [
      p("8-batons", "Diagramme en bâtons", "مخطط العصيات"),
      p("8-rectangles", "Diagramme en rectangles", "مخطط المستطيلات"),
      p("8-circulaire", "Diagramme circulaire", "المخطط الدائري"),
    ]},
    { id: "8-aleatoire", fr: "Phénomènes aléatoires", ar: "الظواهر العشوائية", paragraphs: [
      p("8-evenements", "Événement certain, possible, impossible", "حدث أكيد وحدث ممكن وحدث مستحيل"),
    ]},
  ]},
  { ...GEO, chapters: [
    { id: "8-plan", fr: "Géométrie du plan", ar: "الهندسة في المستوي", paragraphs: [
      p("8-symetrie-centrale", "Symétrie centrale", "التناظر المركزي"),
      p("8-triangles-isometriques", "Triangles isométriques", "تقايس المثلثات"),
      p("8-angles-secante", "Angles formés par deux droites et une sécante", "الزوايا الحاصلة عن قطع مستقيمين متوازيين بمستقيم ثالث"),
      p("8-quadrilateres", "Quadrilatères", "رباعيات الأضلاع"),
      p("8-reperage", "Repérage dans le plan", "التعيين في المستوي"),
    ]},
    { id: "8-espace", fr: "Géométrie dans l'espace", ar: "الهندسة في الفضاء", paragraphs: [
      p("8-pyramide", "Pyramide", "الهرم"),
      p("8-cone", "Cône", "المخروط"),
      p("8-sphere", "Sphère", "الكرة"),
      p("8-parallelisme", "Parallélisme dans l'espace", "التوازي في الفضاء"),
    ]},
  ]},
  { ...MES, chapters: [
    { id: "8-unites", fr: "Unités de mesure", ar: "وحدات القيس", paragraphs: [
      p("8-unites-simples", "Unités simples", "وحدات القيس البسيطة"),
      p("8-unites-composees", "Unités composées", "وحدات القيس المركبة"),
      p("8-echelle", "Échelle", "السلم"),
    ]},
  ]},
];

const NEUF: ChapterDomain[] = [
  { ...NUM, chapters: [
    { id: "9-arithmetique", fr: "Arithmétique et numération", ar: "علم الحساب والتعداد", paragraphs: [
      p("9-divisibilite", "Critères de divisibilité par 6, 12 et 15", "قابلية قسمة عدد صحيح طبيعي على 6 و12 و15"),
      p("9-cardinal", "Cardinal d'un ensemble fini", "كم مجموعة منتهية"),
    ]},
    { id: "9-reels", fr: "Nombres réels et opérations", ar: "الأعداد الحقيقية والعمليات عليها", paragraphs: [
      p("9-operations", "Somme, différence, produit et quotient dans ℝ", "الجمع والطرح والضرب والقسمة في مجموعة الأعداد الحقيقية"),
      p("9-puissances", "Puissance d'exposant entier relatif", "قوة عدد حقيقي دليلها عدد صحيح نسبي"),
      p("9-ecriture-scientifique", "Écriture scientifique d'un nombre", "الكتابة العلمية لعدد"),
      p("9-ordre", "Ordre et comparaison", "الترتيب والمقارنة"),
      p("9-racines", "Racines carrées et opérations", "الجذور التربيعية والعمليات عليها"),
      p("9-valeur-approchee", "Valeur approchée d'un réel", "القيمة التقريبية لعدد حقيقي"),
      p("9-valeur-absolue", "Valeur absolue d'un réel", "القيمة المطلقة لعدد حقيقي"),
      p("9-droite-graduee", "Graduation d'une droite et intervalles", "تدريج مستقيم والمجالات"),
    ]},
  ]},
  { ...ALG, chapters: [
    { id: "9-identites", fr: "Identités remarquables", ar: "الجداءات المعتبرة", paragraphs: [
      p("9-carre-somme", "(a + b)² et (a − b)²", "(a + b)² و (a − b)²"),
      p("9-difference-carres", "(a − b)(a + b)", "(a − b)(a + b)"),
    ]},
    { id: "9-expressions", fr: "Expressions algébriques ax² + bx + c", ar: "العبارات الجبرية من نوع ax² + bx + c", paragraphs: [
      p("9-developpement", "Développement et réduction", "النشر والاختصار"),
      p("9-factorisation", "Factorisation", "التفكيك"),
    ]},
    { id: "9-equations", fr: "Équations du premier degré à une inconnue", ar: "معادلات من الدرجة الأولى ذات مجهول واحد", paragraphs: [
      p("9-resolution-eq", "Résolution dans ℝ", "الحل في مجموعة الأعداد الحقيقية"),
    ]},
    { id: "9-inequations", fr: "Inéquations du premier degré à une inconnue", ar: "متراجحات من الدرجة الأولى ذات مجهول واحد", paragraphs: [
      p("9-resolution-ineq", "Résolution et représentation sur une droite", "الحل والتمثيل على مستقيم مدرج"),
    ]},
  ]},
  { ...STA, chapters: [
    { id: "9-series", fr: "Séries statistiques", ar: "السلاسل الإحصائية", paragraphs: [
      p("9-discrete", "Série quantitative discrète", "سلسلة ذات مميزة كمية منقطعة"),
      p("9-continue", "Série quantitative continue", "سلسلة ذات مميزة كمية مسترسلة"),
      p("9-qualitative", "Série qualitative", "سلسلة ذات مميزة كيفية"),
      p("9-cumulees", "Effectifs et fréquences cumulés", "التكرارات والتواترات التراكمية"),
      p("9-mediane", "Médiane d'une série continue", "موسط سلسلة ذات مميزة كمية مسترسلة"),
    ]},
    { id: "9-aleatoire", fr: "Phénomènes aléatoires", ar: "الظواهر العشوائية", paragraphs: [
      p("9-probabilites", "Probabilité d'un événement", "احتمال حدث"),
    ]},
  ]},
  { ...GEO, chapters: [
    { id: "9-plan", fr: "Géométrie du plan", ar: "الهندسة في المستوي", paragraphs: [
      p("9-quadrilateres", "Quadrilatères", "رباعيات الأضلاع"),
      p("9-reperage", "Repérage dans le plan", "التعيين في المستوي"),
      p("9-milieu", "Coordonnées du milieu d'un segment", "إحداثيات منتصف قطعة مستقيم"),
      p("9-projection", "Projection d'un point sur une droite", "مسقط نقطة على مستقيم وفقا لمستقيم مقدم"),
    ]},
    { id: "9-thales-pythagore", fr: "Thalès et Pythagore", ar: "مبرهنتا طالس وفيتاغور", paragraphs: [
      p("9-thales", "Théorème de Thalès et applications", "مبرهنة طالس وتطبيقاتها"),
      p("9-pythagore", "Théorème de Pythagore et sa réciproque", "مبرهنة فيتاغور وعكسها"),
      p("9-relations-metriques", "Relations métriques dans le triangle rectangle", "العلاقات القياسية في المثلث القائم"),
    ]},
    { id: "9-espace", fr: "Géométrie dans l'espace", ar: "الهندسة في الفضاء", paragraphs: [
      p("9-perpendicularite", "Perpendicularité d'une droite et d'un plan", "تعامد مستقيم ومستو"),
    ]},
  ]},
  { ...MES, chapters: [
    { id: "9-unites", fr: "Unités de mesure", ar: "وحدات القيس", paragraphs: [
      p("9-unites-simples", "Unités simples", "وحدات القيس البسيطة"),
      p("9-unites-composees", "Unités composées", "وحدات القيس المركبة"),
      p("9-echelle", "Échelle", "السلم"),
    ]},
  ]},
];

const MATHS_BY_LEVEL: Record<string, ChapterDomain[]> = {
  "7ème année de base": SEPT,
  "8ème année de base": HUIT,
  "9ème année de base": NEUF,
};

/**
 * Le sommaire pour ce couple (matière, niveau), ou null quand il n'est pas
 * encore transcrit — l'interface repasse alors à la saisie libre.
 */
export function chaptersFor(subject: string, level: string): ChapterDomain[] | null {
  if (subject !== "Mathématiques") return null;
  return MATHS_BY_LEVEL[level.trim()] ?? null;
}

const label = (item: { fr: string; ar: string }, lang: string) => (lang === "arabe" ? item.ar : item.fr);

export { label as chapterLabel };

/** Les paragraphes cochés, dans l'ordre du programme. */
export function selectedParagraphs(
  domains: ChapterDomain[],
  ids: Set<string>,
): { chapter: Chapter; paragraph: Paragraph }[] {
  const out: { chapter: Chapter; paragraph: Paragraph }[] = [];
  for (const domain of domains) {
    for (const chapter of domain.chapters) {
      for (const paragraph of chapter.paragraphs) {
        if (ids.has(paragraph.id)) out.push({ chapter, paragraph });
      }
    }
  }
  return out;
}

/**
 * Le titre du devoir déduit de la sélection: le chapitre quand tout vient du
 * même, sinon les chapitres concernés, séparés par « • ».
 */
export function titleFromSelection(domains: ChapterDomain[], ids: Set<string>, lang: string): string {
  const picked = selectedParagraphs(domains, ids);
  if (!picked.length) return "";
  const chapters = [...new Map(picked.map((x) => [x.chapter.id, x.chapter])).values()];
  if (chapters.length === 1) {
    const chapter = chapters[0];
    // Un seul paragraphe coché: il est plus précis que le nom du chapitre.
    return picked.length === 1 ? label(picked[0].paragraph, lang) : label(chapter, lang);
  }
  return chapters.map((c) => label(c, lang)).join(" • ");
}

/** Les notions cochées, telles qu'elles seront imposées au générateur. */
export function notionsFromSelection(domains: ChapterDomain[], ids: Set<string>, lang: string): string[] {
  return selectedParagraphs(domains, ids).map((x) => label(x.paragraph, lang));
}
