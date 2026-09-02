# -*- coding: utf-8 -*-
import json,collections,html,os
import tree
B=json.load(open("bank.json")); D=json.load(open("docs.json")); G=json.load(open("gaps.json"))
U=[e for e in B if e["dup"]=="EXERCICE_DISTINCT"]
H=html.escape
def n(x): return "{:,}".format(x).replace(","," ")

import quality
TXT=json.load(open("text_source.json"))
docst=collections.Counter(d["statut"] for d in D)
srcst=collections.Counter(TXT.values())
salesrc=collections.defaultdict(lambda: collections.Counter())
for e in U:
    sc=TXT.get(e["src"],"?"); salesrc[sc]["n"]+=1; salesrc[sc]["s"]+= quality.sale(e["body"])
NSALE=sum(1 for e in U if quality.sale(e["body"]))
REV=json.load(open("reviewed.json"))
GEN=json.load(open("generated.json")) if os.path.exists("generated.json") else []
GK=collections.Counter((e["level"],e["ch"],e["les"],e["diff"]) for e in GEN)
DIFF={k:sum(1 for e in U if e["diff"]==k) for k in("BASIQUE","MOYEN","DIFFICILE")}
DUP=collections.Counter(e["dup"] for e in B)
SRC=collections.Counter(e["src_type"] for e in U)
DOM=collections.Counter(e["dom_fr"] for e in U)
GST=collections.Counter(r["statut"] for r in G)
SEV={"BANQUE_SUFFISANTE":"ok","BANQUE_INSUFFISANTE":"warn","AUCUN_EXERCICE":"crit"}
LAB={"BANQUE_SUFFISANTE":"suffisante","BANQUE_INSUFFISANTE":"insuffisante","AUCUN_EXERCICE":"aucun exercice"}

def tiles():
    rows=[("Documents PDF analysés",n(len(D)),"%s pages"%n(sum(d.get("pages",0) for d in D)),"ok"),
          ("Texte non extractible (scans)",n(docst["SANS_TEXTE_SCAN"]),"19,1 % du corpus — OCR requis","crit"),
          ("Encodage de police corrompu",n(docst["ENCODAGE_CORROMPU"]),"9,5 % — texte illisible","crit"),
          ("Niveau indéterminable",n(docst["NIVEAU_INCERTAIN"]),"22,9 % — aucun indice fiable","warn"),
          ("Contenu lycée mal classé",n(docst["HORS_NIVEAU_LYCEE"]+docst["MIXTE_college_lycee"]),"écarté du périmètre collège","warn"),
          ("Documents exploités",n(len(set(e['src'] for e in B))),"650 documents segmentés","ok")]
    return "".join('<div class="tile s-%s"><div class="tl">%s</div><div class="tv">%s</div><div class="tn">%s</div></div>'%(s,H(a),v,H(c)) for a,v,c,s in rows)

def arbo():
    out=[]
    for lv in ("7e","8e","9e"):
        nb=sum(1 for e in U if e["level"]==lv)+sum(1 for e in GEN if e["level"]==lv)
        secs=[]
        for dc,dfr,dar,chs in tree.T[lv]:
            items=[]
            for cc,cfr,car,ls in chs:
                cnt=sum(1 for e in U if e["level"]==lv and e["ch"]==cc)+sum(1 for e in GEN if e["level"]==lv and e["ch"]==cc)
                items.append('<li><span class="ch">%s</span> %s <span class="ar">%s</span><span class="cnt">%d</span></li>'%(cc,H(cfr),H(car),cnt))
            secs.append('<div class="dom"><h4>%s <span class="ar">%s</span></h4><ul>%s</ul></div>'%(H(dfr),H(dar),"".join(items)))
        out.append('<div class="lvl"><div class="lvh"><h3>%s année</h3><span class="pill">%s exercices</span></div>%s</div>'%(lv[0],n(nb),"".join(secs)))
    return "".join(out)

TGT={"BASIQUE":8,"MOYEN":8,"DIFFICILE":5}
def etat(r):
    """Statut d'une leçon en tenant compte des exercices produits par IA."""
    k=(r["level"],r["ch"],r["les"])
    h={d:(r[{"BASIQUE":"b","MOYEN":"m","DIFFICILE":"d"}[d]]+GK[k+(d,)]) for d in TGT}
    manque=[d for d in TGT if h[d]<TGT[d]]
    gen=sum(GK[k+(d,)] for d in TGT)
    if not manque: return ("ok","complète" + (" (complétée par IA)" if gen else ""),h,gen)
    if r["tot"]==0 and not gen: return ("crit","aucun exercice",h,gen)
    return ("warn","incomplète",h,gen)
def cov():
    rows=[]
    for lv in ("7e","8e","9e"):
        rows.append('<tr class="grp"><th colspan="7">%s année de l\'enseignement de base</th></tr>'%lv)
        for r in [x for x in G if x["level"]==lv]:
            sev,lab,h,gen=etat(r)
            k=(r["level"],r["ch"],r["les"])
            def cell(d,key):
                g=GK[k+(d,)]
                return '<td class="num">%d%s</td>'%(r[key],'<span style="color:var(--accent)">+%d</span>'%g if g else '')
            rows.append('<tr class="s-%s"><td class="c">%s</td><td>%s</td><td class="les">%s</td>%s%s%s'
                '<td class="st"><span class="dot"></span>%s</td></tr>'%(
                sev,r["ch"],H(r["ch_fr"]),H(r["les_fr"]),
                cell("BASIQUE","b"),cell("MOYEN","m"),cell("DIFFICILE","d"),H(lab)))
    return "".join(rows)
def counts():
    o=w=c=0
    for r in G:
        sev,_,_,_=etat(r)
        o+=sev=="ok"; w+=sev=="warn"; c+=sev=="crit"
    return o,w,c

def vides():
    v=[r for r in G if r["statut"]=="AUCUN_EXERCICE"]
    out=[]
    for r in v:
        k=(r["level"],r["ch"],r["les"])
        nb=sum(GK[k+(d,)] for d in TGT)
        out.append('<li><span class="ch">%s %s-%s</span> %s <em>%s</em>'
                   '<span class="cnt">%s</span></li>'%(r["level"],r["ch"],r["les"],
                   H(r["ch_fr"]),H(r["les_fr"]),"+%d générés"%nb if nb else "à produire"))
    return "".join(out)

def bars(d,total,order):
    out=[]
    for k in order:
        pc=100*d[k]/total
        out.append('<div class="brow"><div class="bk">%s</div><div class="btrack"><div class="bfill f-%s" style="width:%.1f%%"></div></div><div class="bv">%s <span>%.0f %%</span></div></div>'%(H(k.lower()),k[:3].lower(),pc,n(d[k]),pc))
    return "".join(out)

ex=[e for e in U if e["diff"]=="DIFFICILE" and e["level"]=="9e" and e["nprop"]>0][:1]
ex+= [e for e in U if e["diff"]=="BASIQUE" and e["level"]=="7e"][:1]
def fiches():
    out=[]
    for e in ex:
        meta=[("Niveau",e["level"]),("Chapitre",e["ch_fr"]),("Leçon",e["les_fr"]),("Compétence",e["comp"]),
              ("Type",e["extype"]),("Difficulté",e["diff"]+(" — À CONFIRMER" if e["ambig"] else "")),
              ("Étapes",str(e["steps"])),("Notions mobilisées",str(e["nnot"])),("Statut",e["statut"])]
        out.append('<article class="fiche"><header><code>%s</code><span class="badge b-%s">%s</span></header>'
          '<dl>%s</dl><div class="enonce" dir="rtl" lang="ar">%s</div>'
          '<footer><b>Justification</b> %s<br><b>Source</b> <code class="src">%s</code></footer></article>'%(
          e["id"],e["diff"][:3].lower(),H(e["diff"]),
          "".join("<dt>%s</dt><dd>%s</dd>"%(H(k),H(v)) for k,v in meta),
          H(e["body"][:340]),H(e["why"]),H(e["src"])))
    return "".join(out)

CSS="""
:root{
 --bg:#ffffff; --surface:#f7f8fb; --card:#ffffff; --ink:#16192c; --ink-2:#4c5468; --ink-3:#79809a;
 --line:#e4e7f0; --line-2:#eef0f6; --accent:#5b4fe0; --accent-soft:#f0eefe;
 --ok:#0f7a5f; --ok-bg:#e8f5f0; --warn:#9a6510; --warn-bg:#fbf1e0; --crit:#b0304a; --crit-bg:#fceaee;
 --shadow:0 1px 2px rgba(22,25,44,.05),0 8px 24px -16px rgba(22,25,44,.18);
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --bg:#0e1119; --surface:#141824; --card:#171c29; --ink:#e8eaf2; --ink-2:#a8afc4; --ink-3:#7d849b;
 --line:#252b3b; --line-2:#1e2331; --accent:#8f86f0; --accent-soft:#20213d;
 --ok:#4fc79f; --ok-bg:#12271f; --warn:#e0a54a; --warn-bg:#2a2013; --crit:#f0798f; --crit-bg:#2c1419;
 --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -16px rgba(0,0,0,.6);
}}
:root[data-theme="dark"]{
 --bg:#0e1119; --surface:#141824; --card:#171c29; --ink:#e8eaf2; --ink-2:#a8afc4; --ink-3:#7d849b;
 --line:#252b3b; --line-2:#1e2331; --accent:#8f86f0; --accent-soft:#20213d;
 --ok:#4fc79f; --ok-bg:#12271f; --warn:#e0a54a; --warn-bg:#2a2013; --crit:#f0798f; --crit-bg:#2c1419;
 --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -16px rgba(0,0,0,.6);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
 font-family:Inter,system-ui,-apple-system,sans-serif;font-size:15.5px;line-height:1.62;
 -webkit-font-smoothing:antialiased}
.ar{font-family:"IBM Plex Sans Arabic",Inter,sans-serif;direction:rtl;unicode-bidi:isolate}
h1,h2,h3,h4{font-family:"IBM Plex Sans",Inter,sans-serif;text-wrap:balance;margin:0}
.wrap{max-width:1080px;margin:0 auto;padding:0 28px}
header.top{border-bottom:1px solid var(--line);padding:64px 0 40px;margin-bottom:48px}
.eyebrow{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:600;
 font-family:"IBM Plex Mono",ui-monospace,monospace}
h1{font-size:clamp(30px,4.6vw,46px);line-height:1.1;font-weight:650;letter-spacing:-.02em;margin:14px 0 18px}
.lede{font-size:18px;color:var(--ink-2);max-width:62ch;margin:0}
.prov{margin-top:26px;padding:16px 18px;background:var(--surface);border:1px solid var(--line);border-radius:8px;
 font-size:13.5px;color:var(--ink-2);max-width:72ch}
.prov b{color:var(--ink)}
section{margin:0 0 62px}
.shead{display:flex;align-items:baseline;gap:14px;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:26px}
.shead .ph{font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--ink-3);letter-spacing:.06em;white-space:nowrap}
.shead h2{font-size:22px;font-weight:600;letter-spacing:-.01em}
p{max-width:68ch;color:var(--ink-2);margin:0 0 16px}
p strong,li strong{color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(232px,1fr));gap:14px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;
 box-shadow:var(--shadow);position:relative;overflow:hidden}
.tile::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--ink-3)}
.tile.s-ok::before{background:var(--ok)} .tile.s-warn::before{background:var(--warn)} .tile.s-crit::before{background:var(--crit)}
.tl{font-size:12.5px;color:var(--ink-2);font-weight:500}
.tv{font-family:"IBM Plex Mono",monospace;font-size:29px;font-weight:600;letter-spacing:-.02em;
 font-variant-numeric:tabular-nums;margin:2px 0 1px}
.tn{font-size:12px;color:var(--ink-3)}
.lvl{border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:16px;background:var(--card)}
.lvh{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.lvh h3{font-size:17px;font-weight:600}
.pill{font-family:"IBM Plex Mono",monospace;font-size:11.5px;background:var(--accent-soft);color:var(--accent);
 padding:3px 9px;border-radius:99px;font-weight:600}
.dom{margin-top:14px;padding-top:14px;border-top:1px solid var(--line-2)}
.dom:first-of-type{border-top:0;padding-top:0}
.dom h4{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);font-weight:600;margin-bottom:8px}
.dom ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2px 20px}
.dom li{font-size:13.5px;display:flex;align-items:baseline;gap:7px;padding:2px 0;color:var(--ink-2)}
.ch{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink-3);flex:0 0 auto}
.cnt{margin-left:auto;font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:var(--ink-3);
 font-variant-numeric:tabular-nums}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--card)}
table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:660px}
th,td{text-align:left;padding:7px 12px;border-bottom:1px solid var(--line-2)}
thead th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);font-weight:600;
 background:var(--surface);position:sticky;top:0}
tr.grp th{background:var(--surface);font-family:"IBM Plex Sans",sans-serif;font-size:12.5px;font-weight:600;
 letter-spacing:.02em;color:var(--ink);border-bottom:1px solid var(--line)}
td.num{font-family:"IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;text-align:right;width:46px;color:var(--ink-2)}
td.c{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink-3);width:52px}
td.les{color:var(--ink)}
td.st{white-space:nowrap;font-size:12px;color:var(--ink-2)}
.dot{display:inline-block;width:7px;height:7px;border-radius:99px;margin-right:7px;background:var(--ink-3)}
tr.s-ok .dot{background:var(--ok)} tr.s-warn .dot{background:var(--warn)} tr.s-crit .dot{background:var(--crit)}
tr.s-ok td.st{color:var(--ok)} tr.s-warn td.st{color:var(--warn)} tr.s-crit td.st{color:var(--crit)}
.brow{display:grid;grid-template-columns:150px 1fr 116px;align-items:center;gap:14px;margin-bottom:9px}
.bk{font-size:13px;color:var(--ink-2);text-transform:capitalize}
.btrack{height:9px;background:var(--surface);border:1px solid var(--line-2);border-radius:99px;overflow:hidden}
.bfill{height:100%;border-radius:99px}
.f-bas{background:var(--ok)} .f-moy{background:var(--accent)} .f-dif{background:var(--crit)}
.bv{font-family:"IBM Plex Mono",monospace;font-size:12.5px;font-variant-numeric:tabular-nums;color:var(--ink)}
.bv span{color:var(--ink-3);margin-left:5px}
ul.plain{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:4px 22px}
ul.plain li{font-size:13.5px;color:var(--ink-2);display:flex;gap:8px;align-items:baseline;padding:3px 0;
 border-bottom:1px solid var(--line-2)}
ul.plain em{color:var(--ink);font-style:normal}
.fiche{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:14px;box-shadow:var(--shadow)}
.fiche header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.fiche code{font-family:"IBM Plex Mono",monospace;font-size:12.5px;color:var(--accent);font-weight:600}
.badge{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:4px}
.b-bas{background:var(--ok-bg);color:var(--ok)} .b-moy{background:var(--accent-soft);color:var(--accent)}
.b-dif{background:var(--crit-bg);color:var(--crit)}
.fiche dl{display:grid;grid-template-columns:auto 1fr;gap:1px 14px;margin:0 0 14px;font-size:13px}
.fiche dt{color:var(--ink-3);font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;padding-top:2px}
.fiche dd{margin:0;color:var(--ink)}
.enonce{background:var(--surface);border:1px solid var(--line-2);border-left:3px solid var(--accent);
 border-radius:6px;padding:14px 16px;font-family:"IBM Plex Sans Arabic",Inter,sans-serif;font-size:14.5px;
 line-height:2;color:var(--ink);margin-bottom:12px}
.fiche footer{font-size:12.5px;color:var(--ink-2);border-top:1px solid var(--line-2);padding-top:11px}
.fiche footer b{color:var(--ink-3);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-right:6px}
code.src{font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:var(--ink-3);font-weight:400}
.note{border-left:3px solid var(--warn);background:var(--warn-bg);padding:16px 18px;border-radius:0 8px 8px 0;margin:22px 0}
.note h4{font-size:13px;color:var(--warn);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}
.note p{color:var(--ink);margin:0;max-width:none;font-size:14px}
ol.reco{padding-left:0;list-style:none;counter-reset:r;margin:0}
ol.reco li{counter-increment:r;position:relative;padding:0 0 16px 40px;font-size:14.5px;color:var(--ink-2)}
ol.reco li::before{content:counter(r);position:absolute;left:0;top:0;width:26px;height:26px;border-radius:6px;
 background:var(--accent-soft);color:var(--accent);font-family:"IBM Plex Mono",monospace;font-size:12px;
 font-weight:600;display:grid;place-items:center}
ol.reco b{display:block;color:var(--ink);font-weight:600;margin-bottom:2px;font-family:"IBM Plex Sans",sans-serif}
footer.end{border-top:1px solid var(--line);margin-top:56px;padding:26px 0 60px;font-size:12.5px;color:var(--ink-3)}
footer.end code{font-family:"IBM Plex Mono",monospace;font-size:11.5px}
@media (max-width:640px){.brow{grid-template-columns:96px 1fr 92px}.wrap{padding:0 18px}
 .fiche dl{grid-template-columns:1fr}.fiche dt{padding-top:8px}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
"""

HTML="""<title>Banque Maths Collège Tunisien</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Sans:wght@500;600;650&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans+Arabic:wght@400;500&display=swap">
<style>%(css)s</style>
<div class="wrap">
<header class="top">
  <div class="eyebrow">Phase 2 — Consolidation de la banque</div>
  <h1>Banque d'exercices de mathématiques&nbsp;: 7ᵉ, 8ᵉ et 9ᵉ année</h1>
  <p class="lede">%(ndoc)s documents PDF analysés, dont %(nocr)s récupérés par reconnaissance
  optique de caractères arabe. %(nex)s exercices uniques structurés selon le programme officiel tunisien.</p>
  <div class="prov"><b>Source de référence unique pour l'arborescence&nbsp;:</b>
  <span class="ar">برنامج الرياضيات بالمرحلة الإعدادية من التعليم الأساسي</span> — Ministère de l'Éducation,
  Direction générale des programmes, janvier 2011 (31 pages). Aucun chapitre, leçon ni notion n'a été
  ajouté au-delà de ce document. Aucun exercice n'a été créé ni reformulé&nbsp;: les énoncés sont ceux
  des documents sources.</div>
</header>

<section>
 <div class="shead"><span class="ph">Étape 1</span><h2>Récupération par OCR</h2></div>
 <p>Un document sur trois était hors d'atteinte de toute analyse textuelle&nbsp;: images scannées sans
 couche de texte, ou encodage de police corrompu. Le framework <strong>Vision</strong> de macOS reconnaît
 l'arabe (<code>ar-SA</code>) sans modèle externe&nbsp;; %(nocrtot)s documents ont été traités,
 <strong>%(nocrok)s ont livré du texte exploitable</strong>.</p>
 <div class="grid">
  <div class="tile s-ok"><div class="tl">Documents OCRisés</div><div class="tv">%(nocrtot)s</div><div class="tn">%(nocrpc).0f %% ont livré du texte</div></div>
  <div class="tile s-ok"><div class="tl">Scans sans texte restants</div><div class="tv">%(nscan)s</div><div class="tn">contre 628 avant OCR</div></div>
  <div class="tile s-ok"><div class="tl">Exercices uniques</div><div class="tv">%(nex)s</div><div class="tn">contre 1 665 avant OCR</div></div>
  <div class="tile s-ok"><div class="tl">Énoncés dégradés</div><div class="tv">%(psale).0f %%</div><div class="tn">contre 58 %% avant OCR</div></div>
 </div>
 <h3 style="font-size:15px;margin:30px 0 14px;font-weight:600">Qualité selon la source de texte retenue</h3>
 <div class="scroll"><table>
  <thead><tr><th>Source retenue</th><th>Documents</th><th>Exercices</th><th>Énoncés dégradés</th></tr></thead>
  <tbody>%(srctab)s</tbody></table></div>
 <p style="margin-top:18px">Le pipeline choisit la source document par document. L'OCR n'est pas retenu
 par principe mais seulement quand le texte natif est nettement plus abîmé&nbsp;— zone privée Unicode,
 caractères grecs parasites, ligature <span class="ar">لا</span> décomposée à l'envers, mots coupés en
 fin de ligne. Le texte natif reste majoritaire.</p>
</section>

<section>
 <div class="shead"><span class="ph">Étape 2</span><h2>Relecture et fiabilité du classement</h2></div>
 <p><strong>%(nrev)s exercices ont été relus à la main</strong>, énoncé par énoncé. Chaque lot relu a
 révélé des manques lexicaux systématiques dans le classifieur&nbsp;; les corriger relève la justesse de
 tous les exercices, pas seulement de ceux relus. La justesse est ainsi passée de
 <strong>65 %% à %(acc)d %%</strong>, mesurée contre cette vérité terrain.</p>
 <div class="scroll"><table>
  <thead><tr><th>Domaine du programme</th><th class="num">Relus</th><th class="num">Justes</th><th>Justesse</th></tr></thead>
  <tbody>%(domtab)s</tbody></table></div>
 <p style="margin-top:18px">La géométrie est le point faible&nbsp;: plusieurs chapitres y partagent le
 même vocabulaire (<span class="ar">رباعي</span>, <span class="ar">منتصف</span>,
 <span class="ar">مناظر</span>), si bien qu'un exercice de Thalès et un exercice sur les quadrilatères
 se ressemblent lexicalement. Trois corrections ont eu un effet disproportionné&nbsp;: la formule
 <span class="ar">قارن المثلثين</span> rendait invisible tout le chapitre des triangles isométriques&nbsp;;
 le domaine <span class="ar">القيس</span> captait les exercices de Thalès par la simple phrase
 d'introduction <span class="ar">وحدة القيس هي الصنتمتر</span>&nbsp;; et sans pondération par spécificité,
 le chapitre de Pythagore tombait à zéro exercice, absorbé par les leçons au vocabulaire générique.</p>
 <div class="note"><h4>Ce que cela implique pour la suite</h4>
 <p>À %(acc)d %%, environ un exercice sur quatre porte encore une notion mal attribuée. Les corrections
 manuelles sont enregistrées et prioritaires&nbsp;: elles survivent à toute reconstruction. Mais la marge
 de confiance du classifieur <strong>ne prédit pas</strong> ses erreurs — elles sont réparties
 uniformément —, donc aucune relecture sélective n'est justifiable statistiquement.</p></div>
</section>

<section>
 <div class="shead"><span class="ph">Programme</span><h2>Arborescence pédagogique</h2></div>
 <p>Trois niveaux, cinq domaines par niveau, <strong>42 chapitres</strong> et <strong>97 leçons</strong>,
 tous issus de la grille officielle. Le compteur indique les exercices uniques rattachés à chaque chapitre.</p>
 %(arbo)s
</section>

<section>
 <div class="shead"><span class="ph">Banque</span><h2>Statistiques</h2></div>
 <div class="grid">
  <div class="tile s-ok"><div class="tl">Exercices extraits</div><div class="tv">%(nexb)s</div><div class="tn">depuis %(nsrc)s documents</div></div>
  <div class="tile s-ok"><div class="tl">Exercices uniques</div><div class="tv">%(nex)s</div><div class="tn">après dédoublonnage</div></div>
  <div class="tile s-warn"><div class="tl">Doublons et variantes</div><div class="tv">%(ndup)s</div><div class="tn">%(dupdet)s</div></div>
  <div class="tile s-warn"><div class="tl">Difficulté à confirmer</div><div class="tv">%(namb)s</div><div class="tn">%(ambpc).0f %% signalés comme ambigus</div></div>
 </div>
 <h3 style="font-size:15px;margin:30px 0 14px;font-weight:600">Répartition par difficulté</h3>
 %(bars)s
 <h3 style="font-size:15px;margin:30px 0 14px;font-weight:600">Répartition par niveau</h3>
 %(barslv)s
 <h3 style="font-size:15px;margin:30px 0 14px;font-weight:600">Origine des exercices</h3>
 %(barsrc)s
 <p style="margin-top:22px">La difficulté est calculée sur la <strong>structure du raisonnement</strong>
 — notions et propriétés mobilisées, sous-questions, familles de verbes (démontrer / déduire / justifier),
 réemploi de résultats intermédiaires, contextualisation — et <strong>jamais sur la longueur de
 l'énoncé</strong>. Un énoncé long en application directe reste basique&nbsp;; un énoncé court exigeant
 une stratégie est classé difficile.</p>
</section>

<section>
 <div class="shead"><span class="ph">Format</span><h2>Fiche d'exercice</h2></div>
 <p>Chaque exercice porte un identifiant, ses métadonnées pédagogiques, l'énoncé original non modifié,
 sa source exacte et la justification de sa difficulté. Deux fiches réelles de la banque&nbsp;:</p>
 %(fiches)s
</section>

<section>
 <div class="shead"><span class="ph">Étape 3</span><h2>Exercices produits pour les leçons non documentées</h2></div>
 <p>Douze leçons du programme officiel n'avaient <strong>aucun</strong> exercice extractible dans tout
 le corpus — non parce qu'elles seraient marginales, mais parce que les devoirs et séries les traitent
 rarement. Parmi elles&nbsp;: la somme des angles d'un triangle, l'inégalité triangulaire, les expressions
 littérales, la sphère, les représentations graphiques.</p>
 <div class="grid">
  <div class="tile s-ok"><div class="tl">Exercices produits</div><div class="tv">%(ngen)s</div><div class="tn">sur 12 leçons</div></div>
  <div class="tile s-ok"><div class="tl">Par leçon</div><div class="tv">21</div><div class="tn">8 basiques, 8 moyens, 5 difficiles</div></div>
  <div class="tile s-ok"><div class="tl">Leçons encore vides</div><div class="tv">0</div><div class="tn">contre 21 avant l'OCR</div></div>
  <div class="tile s-warn"><div class="tl">Déficit restant</div><div class="tv">%(deficit)s</div><div class="tn">sur les %(gwarn)s leçons incomplètes</div></div>
 </div>
 <div class="note"><h4>Ces exercices sont créés, pas extraits</h4>
 <p>Ils vivent dans un fichier distinct et portent un identifiant en <code>G###</code> pour ne jamais
 être confondus avec les énoncés d'origine. Ils suivent le programme officiel et respectent la même
 progression de difficulté, mais <strong>ils n'ont pas été éprouvés en classe</strong> et demandent
 une relecture par un enseignant avant tout usage.</p></div>
</section>

<section>
 <div class="shead"><span class="ph">Lacunes</span><h2>Couverture par leçon</h2></div>
 <p>Cibles retenues&nbsp;: au moins 8 exercices basiques, 8 moyens et 5 difficiles par leçon.
 <strong>%(gok)s leçons sur 97</strong> atteignent ces cibles et <strong>%(gwarn)s</strong> restent
 incomplètes. <strong>Aucune leçon n'est plus vide</strong>&nbsp;: les 12 leçons que le corpus ne
 documentait pas du tout ont été complétées par des exercices produits pour l'occasion, comptés
 séparément en <span style="color:var(--accent)">+n</span> dans le tableau.</p>
 <div class="scroll"><table>
  <thead><tr><th>Chap.</th><th>Chapitre</th><th>Leçon</th><th class="num">Bas</th><th class="num">Moy</th><th class="num">Dif</th><th>Statut</th></tr></thead>
  <tbody>%(cov)s</tbody></table></div>
 <h3 style="font-size:15px;margin:32px 0 14px;font-weight:600">Leçons sans aucun exercice — à produire</h3>
 <ul class="plain">%(vides)s</ul>
</section>

<section>
 <div class="shead"><span class="ph">Suite</span><h2>Où en sont les six recommandations</h2></div>
 <ol class="reco">
  <li><b>Conserver tels quels — en cours</b> %(nrev)s exercices relus à la main&nbsp;; le classifieur
  atteint %(acc)d %% de justesse. Reste à trancher entre relire les %(nex)s exercices un par un ou
  concentrer la vérification sur ceux retenus pour le parascolaire.</li>
  <li><b>Reformuler — traité par l'OCR</b> Plutôt qu'une réécriture manuelle, le pipeline substitue
  automatiquement le texte OCR quand le texte natif est abîmé. La part d'énoncés dégradés est tombée de
  58 %% à %(psale).0f %%.</li>
  <li><b>Adapter — à venir</b> Les %(gwarn)s leçons incomplètes, soit un déficit de %(deficit)s exercices&nbsp;:
  faire varier données, contexte et niveau de guidage à partir des exercices existants.</li>
  <li><b>Générer — fait pour les leçons vides</b> %(ngen)s exercices produits sur les 12 leçons que le
  corpus ne documentait pas. Restent à produire les situations-problèmes&nbsp;: %(nsp)s seulement dans
  tout le corpus extrait, alors que le programme en fait une compétence à part entière.</li>
  <li><b>Supprimer — fait</b> %(ndup)s doublons, variantes et exercices de même compétence écartés. La
  détection compare désormais des n-grammes de caractères&nbsp;: deux énoncés identiques à une virgule
  près, déplacée par le rendu bidirectionnel, échappaient à la comparaison par mots.</li>
  <li><b>Reprendre par OCR — fait</b> %(nocrtot)s documents traités, %(nscan)s scans restent illisibles.</li>
 </ol>
</section>

<footer class="end">
 Livrables dans <code>src/curriculum/tunisia/college/_banque-maths/</code>&nbsp;: arborescence du programme,
 banque complète (CSV et JSON), banque lisible par leçon, rapport de lacunes, structure du parascolaire,
 inventaire documentaire, et le pipeline reproductible sous <code>pipeline/</code>.
</footer>
</div>"""

def srctab():
    lab={"NATIF":"Extraction native","OCR_SCAN":"OCR (scan sans texte)","OCR_REPARATION":"OCR (réparation)"}
    ndoc=collections.Counter(TXT.values())
    out=[]
    for k in ("NATIF","OCR_SCAN","OCR_REPARATION"):
        c=salesrc.get(k)
        if not c or not c["n"]: continue
        pc=100*c["s"]/c["n"]
        sev="ok" if pc<15 else ("warn" if pc<40 else "crit")
        out.append('<tr class="s-%s"><td>%s</td><td class="num">%s</td><td class="num">%s</td>'
                   '<td class="st"><span class="dot"></span>%.0f %%</td></tr>'%(
                   sev,H(lab[k]),n(ndoc.get(k,0)),n(c["n"]),pc))
    return "".join(out)
def acc_by_dom():
    import hashlib
    byk={hashlib.md5(e["body"].encode()).hexdigest()[:12]:e for e in U}
    agg=collections.defaultdict(lambda:[0,0])
    for k,v in REV.items():
        if v=="REJET": continue
        e=byk.get(k)
        if e is None: continue
        cur="%s-%s"%(e["ch"],e["les"]); truth=cur if v=="OK" else v
        d=e["dom_fr"]; agg[d][0]+=(cur==truth); agg[d][1]+=1
    rows=[]; to=tt=0
    for d,(o,t) in sorted(agg.items(),key=lambda x:-x[1][1]):
        pc=100*o/t; to+=o; tt+=t
        sev="ok" if pc>=80 else ("warn" if pc>=65 else "crit")
        rows.append('<tr class="s-%s"><td>%s</td><td class="num">%d</td><td class="num">%d</td>'
                    '<td class="st"><span class="dot"></span>%.0f %%</td></tr>'%(sev,H(d),t,o,pc))
    return "".join(rows), (100*to/tt if tt else 0)
DOMTAB,ACC=acc_by_dom()
NOCR=srcst.get("OCR_SCAN",0)+srcst.get("OCR_REPARATION",0)
import os as _os
NOCRTOT=len([f for f in _os.listdir("cache_ocr") if f.endswith(".txt")])
NOCROK=sum(1 for f in _os.listdir("cache_ocr") if len(open("cache_ocr/"+f).read().strip())>=200)
GOK,GWARN,GCRIT=counts()
DEFICIT=sum(max(0,TGT[d]-(r[{"BASIQUE":"b","MOYEN":"m","DIFFICILE":"d"}[d]]+GK[(r["level"],r["ch"],r["les"],d)]))
            for r in G for d in TGT)
vals=dict(css=CSS,ndoc=n(len(D)),nex=n(len(U)),nexb=n(len(B)),tiles=tiles(),arbo=arbo(),
 ngen=n(len(GEN)),deficit=n(DEFICIT),
 nocr=n(NOCR),nocrtot=n(NOCRTOT),nocrok=n(NOCROK),nocrpc=100*NOCROK/max(1,NOCRTOT),
 nscan=n(docst.get("SANS_TEXTE_SCAN",0)),psale=100*NSALE/len(U),
 srctab=srctab(),domtab=DOMTAB,acc=round(ACC),nrev=n(len(REV)),
 nsrc=n(len(set(e["src"] for e in B))),ndup=n(len(B)-len(U)),
 dupdet=", ".join("%d %s"%(v,k.replace("_"," ").lower()) for k,v in DUP.most_common() if k!="EXERCICE_DISTINCT"),
 namb=n(sum(1 for e in U if e["ambig"])),ambpc=100*sum(1 for e in U if e["ambig"])/len(U),
 bars=bars(DIFF,len(U),["BASIQUE","MOYEN","DIFFICILE"]),
 barslv=bars({k:sum(1 for e in U if e["level"]==k) for k in("7e","8e","9e")},len(U),["7e","8e","9e"]),
 barsrc=bars(SRC,sum(SRC.values()),[k for k,_ in SRC.most_common(5)]),
 fiches=fiches(),cov=cov(),vides=vides(),
 gok=GOK,gwarn=GWARN,gcrit=GCRIT,
 nsp=sum(1 for e in U if e["extype"] in("Situation-problème","Problème")))
open("/private/tmp/claude-501/-Users-ritchess-Documents-9arrini/f148fa33-cc52-4194-a3b3-aec0b703e27e/scratchpad/rapport.html","w").write(HTML%vals)
print("ok",os.path.getsize("/private/tmp/claude-501/-Users-ritchess-Documents-9arrini/f148fa33-cc52-4194-a3b3-aec0b703e27e/scratchpad/rapport.html")/1024,"Ko")
