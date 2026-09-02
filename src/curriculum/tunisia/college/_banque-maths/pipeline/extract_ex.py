# -*- coding: utf-8 -*-
import re,json,os,collections
import lib,tree,detect
from lib import norm,ntext,BYREL

# racines des ordinaux: les PDF tronquent souvent la derniere lettre en fin de ligne
ORD=["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن","التاسع","العاشر"]
ORD_STEM=["الأو","الثان","الثال","الراب","الخام","الساد","الساب","الثام","التاس","العاش"]
# formes sans article : le ":" est parfois insere entre "ال" et la racine
ORD_NOART=["أول","ثان","ثال","راب","خام","ساد","ساب","ثام","تاس","عاش"]
NOART_RX="|".join(re.escape(v) for i,o in enumerate(ORD_NOART) for v in lib.keyvars(o))
NOART_MAP={v:i%10+1 for i,o in enumerate(ORD_NOART) for v in lib.keyvars(o)}
ORDV=[]           # (variante, rang)
for i,o in enumerate(ORD+ORD_STEM):
    for v in lib.keyvars(o): ORDV.append((v,i%10+1))
ORDMAP=dict(ORDV)
ORD_RX="|".join(re.escape(v) for v,_ in sorted(ORDV,key=lambda x:-len(x[0])))
TAM="|".join(re.escape(v) for k in ("التمرين","تمرين") for v in lib.keyvars(k))
# delimiteurs d'exercice -- appliques sur un flux SANS espaces (les PDF arabes
# coupent les mots en fin de ligne et deplacent les chiffres a cause du bidi)
AR_TAM="(?:"+TAM+")"
DELIMS=[
 ("AR_ORD", re.compile(AR_TAM+r'('+ORD_RX+r')')),
 ("AR_ORD2",re.compile(AR_TAM+r'(?:ال)?[:\-.()]{1,3}('+NOART_RX+r')')),
 ("AR_NUM", re.compile(AR_TAM+r'[عددرقمن°:\-.()\u0640]{0,6}(\d{1,2})(?!\d)')),
 ("AR_PTS", re.compile(AR_TAM+r'[^\d]{0,4}(\d{1,2})(?!\d)[^\d]{0,8}نقاط')),
 ("FR_NUM", re.compile(r'exercice(?:n°|n|no|numero)?[:\-.()]{0,3}(\d{1,2})(?!\d)')),
 ("AR_BARE",re.compile(AR_TAM+r'[:\-]')),
 ("FR_BARE",re.compile(r'exercice[:\-]')),
 ("FR_PROB",re.compile(r'probl[eè]me(?:n°)?[:\-.]?(\d{1,2})?')),
 ("AR_PROB",re.compile(r'(?:المسيله|مسيله)(?:عدد)?[:\-.]?(\d{1,2})?')),
]
WS=re.compile(r'\s+')
DOTS=re.compile(r'[.\u2026_\-]{4,}')
HEADER=[ "الاسم واللقب","الاسم و اللقب","المدرسه الاعداديه","المعهد","الاستاذ:","مده الانجاز",
         "فرض مراقبه عدد","فرض تاليفي عدد","nom et prenom","nom :","lycee","collège","durée" ]
def clean(b):
    """Retire les pointilles de reponse et coupe l'en-tete du document suivant."""
    b=DOTS.sub(" ",b)
    cut=len(b)
    for h in HEADER:
        for v in lib.keyvars(h):
            i=b.find(v)
            if i>60: cut=min(cut,i)
    return WS.sub(" ",b[:cut]).strip()
def compact(tn):
    """Retourne (texte sans espaces, table de correspondance vers les index d'origine)."""
    buf=[];idx=[]
    for i,c in enumerate(tn):
        if not c.isspace(): buf.append(c); idx.append(i)
    return "".join(buf),idx
def segment(tn):
    tc,idx=compact(tn)
    if not tc: return []
    marks=[]
    for kind,rx in DELIMS:
        for m in rx.finditer(tc):
            num=None
            if m.groups() and m.group(1):
                g=m.group(1)
                if kind=="AR_ORD": num=ORDMAP.get(g)
                elif kind=="AR_ORD2": num=NOART_MAP.get(g)
                else: num=int(g) if g.isdigit() else None
            marks.append((m.start(),m.end(),kind,num))
    if not marks: return []
    marks.sort()
    keep=[]
    for mk in marks:
        if keep and mk[0]-keep[-1][0]<10: continue
        keep.append(mk)
    segs=[]
    for i,(s,e,kind,num) in enumerate(keep):
        endc=keep[i+1][0] if i+1<len(keep) else len(tc)
        a=idx[e] if e<len(idx) else len(tn)
        b=idx[endc] if endc<len(idx) else len(tn)
        body=clean(tn[a:b])
        segs.append({"num":num if num else i+1,"kind":kind,"body":body,"nchars":len(body)})
    return segs

# ---------- analyse pedagogique ----------
SUBQ=[re.compile(r'(?:^|\s)(\d{1,2})\s*[\)\(\-.]'),      # 1)  1(  1-
      re.compile(r'[\)\(]\s*(\d{1,2})(?!\d)'),               # )1  (1   (bidi inverse)
      re.compile(r'(?:^|\s)([ابجدهو])\s*[\)\(\-]'),          # ا)  ب(
      re.compile(r'[\)\(]\s*([ابجدهو])(?![ءآ-ي])'),           # )ا  (ب
      re.compile(r'(?:^|\s)([a-f])\s*[\)\(\-]'),
      re.compile(r'(?:^|\s)[\-\u2022]\s')]
V_RAIS=["برهن","بين ان","بي ان","اثبت","استنتج","علل","معللا","بين انه","الاستنتاج","استخرج","حقق ان","تحقق",
        "démontrer","démontre","montrer","montre que","justifier","justifie","déduire","en déduire",
        "prouver","expliquer pourquoi","conclure"]
V_DIRECT=["احسب","اتمم","اعط","حدد","اكتب","عين","انسخ","اذكر","ارسم","احصر","قارن","رتب","اختصر","انشر","فكك","حل",
          "calculer","calcule","compléter","complète","donner","donne","écrire","écris","déterminer","détermine",
          "simplifier","développer","factoriser","résoudre","résous","comparer","ranger","citer","recopier"]
V_CONSTR=["انشي","ارسم","اعمل انشاء","اكمل الرسم","اسقط",
          "construire","construis","tracer","trace","placer","place le point","reproduire","dessiner"]
V_LECT=["اقرا","استغل الرسم","من الرسم","استنتج من المخطط","lire le graphique","d'après la figure","d'après le graphique","à l'aide du graphique"]
CTX=["دينار","مليم","تاجر","معمل","حرفي","ملعب","حديقه","سياره","قطار","تلميذ","فلاح","سعر","تخفيض","ربح","خسران","حوض","خزان","صهريج",
     "dinars","millimes","commerçant","usine","artisan","terrain","jardin","voiture","train","élève","agriculteur","prix","remise","bénéfice","bassin","citerne"]
QCM=["احط بدايره","اختر الاجابه الصحيحه","الاجابه الصحيحه الوحيده","اجب بصحيح او خطا","صحيح او خطا",
     "entourer la bonne réponse","cocher","qcm","vrai ou faux","répondre par vrai ou faux"]
def count_subq(b):
    """Nombre de sous-questions distinctes (numerotation latine ou arabe,
    parentheses eventuellement inversees par le rendu bidirectionnel)."""
    n=0
    for rx in SUBQ[:-1]:
        n=max(n,len(set(rx.findall(b))))
    n=max(n,len(SUBQ[-1].findall(b)))
    return n
def has(b,lst): return [k for k in lst if lib.kin(k,b)]
LESSONS=tree.lessons()
def _m(k,b,bc):
    """Mot-cle present dans l'enonce, espaces conserves ou non (mots coupes en fin de ligne)."""
    for v in lib.keyvars(k):
        if v in b: return True
        if len(v)>=5 and v.replace(" ","") in bc: return True
    return False
_IDF=None
def _idf(lv,k):
    global _IDF
    if _IDF is None:
        try:
            import weights; _IDF=weights.load()
        except Exception: _IDF={}
    return _IDF.get("%s|%s"%(lv,k),1.0)
_CARRE=re.compile(r'\)\s*p?\s*2(?!\d)|(?<![\d,.])2\s*p?\s*\)')
_VERB=re.compile(r'\u0627\u0646\u0634\u0631|\u0641\u0643\u0643|\u0627\u062e\u062a\u0635\u0631')
def _identite(b):
    """Jadaa's memorables : un binome au carre (rendu de plusieurs facons selon
    la police) accompagne d'une consigne de developpement ou de factorisation."""
    return len(_CARRE.findall(b))>=2 and bool(_VERB.search(b))
def _thales(b):
    """Configuration de Thales / droite des milieux : une parallele a un cote
    qui coupe un autre cote, avec un milieu en jeu."""
    return ("\u0627\u0644\u0645\u0648\u0627\u0632\u064a \u0644" in b and "\u0645\u0646\u062a\u0635\u0641" in b
            and "\u064a\u0642\u0637\u0639" in b)
def _metrique(b):
    """Relations metriques : projete orthogonal sur l'hypotenuse d'un triangle rectangle."""
    return ("\u0627\u0644\u0645\u0633\u0642\u0637 \u0627\u0644\u0639\u0645\u0648\u062f\u064a" in b
            and "\u0642\u0627\u064a\u0645" in b)
BOOST=[  # (niveau, chapitre, lecon, test structurel, poids)
 ("9e","CH12","L01", _thales, 4.0),
 ("9e","CH14","L01", _metrique, 3.0),
 ("9e","CH02","L02", lambda b: b.count("\u221a")>=3 and "\u0641\u0643\u0643" not in b, 4.0),
 ("9e","CH03","L01", lambda b: _identite(b), 3.0),
]
def notions(b,level,weighted=True):
    """Notions detectees, triees par score de specificite (IDF) puis par nombre
    de mots-cles. Retourne [(nb_mots_cles, lecon)] pour rester compatible."""
    bc="".join(b.split()); out=[]
    for l in LESSONS:
        if l["level"]!=level: continue
        hit=[k for k in l["kw_ar"]+l["kw_fr"] if _m(k,b,bc)]
        bonus=sum(bo for lv,ch,les,test,bo in BOOST
                  if lv==level and l["ch"]==ch and l["les"]==les and test(b))
        if not hit and not bonus: continue
        w=(sum(_idf(level,k) for k in hit) if weighted else len(hit))+bonus
        out.append((max(len(hit),1 if bonus else 0),l,w))
    out.sort(key=lambda x:(-x[2],-x[0]))
    return [(n,l) for n,l,w in out]
def ex_type(b,nsub,rais,constr,lect,ctx,qcm):
    if qcm: return "QCM"
    if any(lib.kin(x,b) for x in ["صحيح او خطا","vrai ou faux"]): return "Vrai/Faux justifié"
    if lect: return "Lecture graphique"
    if constr and not rais: return "Construction géométrique"
    if ctx and nsub>=3: return "Situation-problème"
    if ctx: return "Problème"
    if rais and len(rais)>=2: return "Démonstration"
    if rais: return "Raisonnement"
    if nsub>=3: return "Application indirecte"
    return "Application directe"
RAIS_FAM={
 "prouver":["برهن","بر هن","بين ان","بي ان","بين انه","اثبت","اث بت","حقق ان","تحقق","ما هي طبيعه",
            "démontrer","démontre","montrer","montre que","prouver"],
 "deduire":["استنتج","الاستنتاج","déduire","en déduire","conclure"],
 "justifier":["علل","معللا","علل جوابك","justifier","justifie","expliquer pourquoi"],
}
PROPS=["مبرهنه","نظريه","عكس مبرهنه","خاصيه","الخاصيه","طالس","فيتاغور","بيتاغور","تقايس",
       "théorème","propriété","réciproque","thalès","pythagore"]
STRAT=["استنتج ان","بين ان","ماذا تستنتج","اثبت ان","que peut-on en déduire","en déduire que"]
def rais_families(b):
    import lib as _l
    return [f for f,ks in RAIS_FAM.items() if any(_l.kin(k,b) for k in ks)]
def difficulty(nnot,nsub,rais,constr,ctx,qcm,dedu,fams=(),nprop=0,strat=0):
    """Niveau de difficulte selon les criteres du programme officiel.
    Jamais fonde sur la longueur : uniquement sur la structure du raisonnement,
    le nombre de notions/proprietes mobilisees et le nombre d'etapes."""
    steps=max(1,nsub)
    sc=0; why=[]
    if nnot<=1: why.append("une seule notion principale mobilisée")
    elif nnot==2: sc+=1; why.append("deux notions combinées")
    else: sc+=2; why.append("%d notions mobilisées"%nnot)
    if nprop>=2: sc+=1; why.append("%d propriétés ou théorèmes invoqués"%nprop)
    elif nprop==1: why.append("une propriété explicitement invoquée")
    if nsub<=2: why.append("procédure courte (%d sous-question(s))"%nsub)
    elif nsub<=4: sc+=1; why.append("plusieurs étapes (%d sous-questions)"%nsub)
    else: sc+=2; why.append("enchaînement long (%d sous-questions)"%nsub)
    nf=len(fams)
    if nf>=2: sc+=2; why.append("raisonnement développé : %s"%(" + ".join(fams)))
    elif nf==1: sc+=1; why.append("exige une justification (%s)"%fams[0])
    if strat>=2: sc+=1; why.append("résultats intermédiaires réutilisés (stratégie à construire)")
    if constr and nf: sc+=1; why.append("construction puis démonstration sur la figure obtenue")
    if ctx: sc+=1; why.append("énoncé contextualisé nécessitant une modélisation")
    if qcm: sc-=2; why.append("format QCM à réponse immédiate")
    if constr and not nf: sc-=1; why.append("construction guidée sans raisonnement à produire")
    if sc<=1: lvl="BASIQUE"
    elif sc<=3: lvl="MOYEN"
    else: lvl="DIFFICILE"
    amb=(sc in (1,2,4)) and nf==0 and nnot<=1 and nprop==0
    return lvl,"; ".join(why),steps,sc,amb
