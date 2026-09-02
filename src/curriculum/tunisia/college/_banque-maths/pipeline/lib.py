# -*- coding: utf-8 -*-
import json,unicodedata,re,os,collections
META=json.load(open("meta.json"))
BYREL={r["rel"]:r for r in META}
DIAC=re.compile(r'[ً-ْـ​-‏ٰ]')
def norm(t):
    t=unicodedata.normalize("NFKC",t)
    t=DIAC.sub('',t)
    for a,b in [("أإآٱ","ا"),("ىیۍێ","ي"),("ةھۀ","ه"),("ؤ","و"),("ئ","ي"),("كکڪ","ك"),("گڤ","ك"),("ٹټ","ت")]:
        for c in a: t=t.replace(c,b)
    return t.lower()
def keyvars(k):
    """Variantes d'un mot-cle normalise :
    - ligature lam-alef decomposee en ordre visuel inverse (LAM+ALEF -> ALEF+LAM)
    - variantes orthographiques tunisiennes (جداء / جذاء)
    - forme sans article defini (les enonces flechissent : لارتفاعات vs الارتفاع)"""
    k=norm(k); out={k}
    for v in list(out):
        if "لا" in v: out.add(v.replace("لا","ال"))
    for v in list(out):
        if "جداء" in v: out.add(v.replace("جداء","جذاء"))
        if "جذاء" in v: out.add(v.replace("جذاء","جداء"))
    for v in list(out):
        if v.startswith("ال") and len(v)>=6: out.add(v[2:])
    return out
_VC={}
def kin(k,t):
    v=_VC.get(k)
    if v is None: v=_VC[k]=keyvars(k)
    return any(x in t for x in v)
import os as _os
CACHE_DIR="cache_merged" if _os.path.isdir("cache_merged") else "cache"
def text(r): return open("%s/%s.txt"%(CACHE_DIR,r["key"])).read()
def ntext(r): return norm(text(r))

# ---- lexique matiere ----
MATH_AR=["عدد","اعداد","حساب","مستقيم","دايره","مثلث","زاويه","مساحه","محيط","قسمه","جداء","معادله",
 "كسر","كسري","قوه","جذر","تربيعي","مجموعه","نقطه","مستوي","تناظر","متوازي","متعامد","حجم","قيس",
 "احصاي","تكرار","معدل","مربع","مستطيل","معين","موشور","اسطوانه","هرم","مخروط","كره","طالس","فيتاغور",
 "احداثي","متجه","تمرين","مجهول","عبارات","جبري","نسبي","طبيعي","عشري","حقيقي"]
MATH_FR=["exercice","calcul","nombre","droite","cercle","triangle","angle","aire","périmètre","division",
 "fraction","puissance","racine carrée","équation","symétrie","parallèle","perpendiculaire","volume",
 "statistique","effectif","moyenne","carré","rectangle","losange","prisme","cylindre","pyramide","cône",
 "sphère","thalès","pythagore","coordonnée","vecteur","inconnue","expression","démontrer","figure"]
OTHER={
 "arabe":["النص","الكاتب","اسلوب","بلاغ","نحو","الشرح","التعبير","قواعد اللغه","المحسنات"],
 "francais":["conjugaison","orthographe","grammaire","rédaction","vocabulaire","texte littéraire"],
 "svt":["خليه","نبات","تغذيه","تنفس","دم","هضم","photosynth","cellule","organisme"],
 "physique":["كثافه","تيار كهربايي","ضغط","دينامومتر","مقاومه","volt","ampère","intensité du courant","circuit électrique"],
 "histgeo":["الحرب العالميه","الاستعمار","الخريطه","السكان","المناخ","حضاره"],
 "islamique":["الحديث","السيره","الفقه","القران الكريم","العقيده"],
 "techno":["مقبس","رسم تقني","الاله","engrenage","mécanisme"],
 "info":["الحاسوب","برمجه","algorithme","tableur","excel","خوارزميه"],
}
LYCEE=["logarithme","dérivée","primitive","intégrale","asymptote","suite arithmétique","suite géométrique",
 "barycentre","nombre complexe","exponentielle","récurrence","produit scalaire","baccalauréat","bac ",
 "لوغاريتم","المشتقه","الاوليه","التكامل","مقارب","متتاليه","المرجح","العقديه","الاسيه","بالترجع","الجداء السلمي",
 "1ère année","2ème année secondaire","3ème année","4ème année","2e sc","3e m","4e sc","1re "]
def score(t,lex): return sum(1 for k in lex if kin(k,t))
def profile(r):
    t=ntext(r)
    d={"math":score(t,MATH_AR)+score(t,MATH_FR),"lycee":score(t,LYCEE)}
    for k,v in OTHER.items(): d[k]=score(t,v)
    d["other_max"]=max([d[k] for k in OTHER]+[0])
    d["other_which"]=max(OTHER,key=lambda k:d[k]) if d["other_max"]>0 else None
    return d
