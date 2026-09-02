# -*- coding: utf-8 -*-
import re,json,collections,os
import lib,tree,detect
from lib import norm,ntext,META

LV_CONTENT={
 "7e":["السنه السابعه","السابعه من التعليم","7 اساسي","سابعه اساسي","7eme","7ème","7 ème annee","7e annee","السابعة"],
 "8e":["السنه الثامنه","الثامنه من التعليم","8 اساسي","ثامنه اساسي","8eme","8ème","8 ème annee","8e annee"],
 "9e":["السنه التاسعه","التاسعه من التعليم","9 اساسي","تاسعه اساسي","9eme","9ème","9 ème annee","9e annee"],
}
LV_FNAME={"7e":[r'(?<!\d)7\s*eme',r'(?<!\d)7e(?!\d)',r'-7-'],"8e":[r'(?<!\d)8\s*eme',r'(?<!\d)8e(?!\d)',r'-8-'],
          "9e":[r'(?<!\d)9\s*eme',r'(?<!\d)9e(?!\d)',r'-9-']}
TYPES=[
 ("examen_national",["الاختبار الموحد","اختبار موحد","examen national","concours d'entree","مناظره","الموحد للسداسي"],[r'examen[- ]?national',r'concours']),
 ("corrige",["الاصلاح","اصلاح الفرض","correction","corrig"],[r'corrig',r'correction',r'islah']),
 ("devoir_synthese",["فرض تاليفي","الفرض التاليفي","devoir de synth"],[r'devoir[- ]?de[- ]?synth',r'^\d?-?s(ynth)?']),
 ("devoir_controle",["فرض مراقبه","الفرض المراقبه","فرض المراقبه","devoir de contr"],[r'devoir[- ]?de[- ]?contr']),
 ("devoir_maison",["فرض منزلي","devoir de maison"],[r'devoir[- ]?de[- ]?maison']),
 ("serie",["سلسله تمارين","سلسله في","serie d'exercices","série d'exercices","تمارين حول"],[r'serie[- ]?d',r's[eé]rie']),
 ("cours",["الدرس","درس","تعريف","خاصيه","مبرهنه","نشاط","resume","résumé","cours","l'essentiel du cours"],[r'^cours',r'-cours-',r'resume',r'r[eé]sum']),
 ("manuel",["الكتاب المدرسي","manuel"],[r'manuel']),
 ("parascolaire",["parascolaire"],[r'parascolaire']),
]
def detect_level(r):
    t=ntext(r); fn=norm(os.path.basename(r["rel"]).replace("_"," ").replace("-"," "))
    ev={}
    for lv,ks in LV_CONTENT.items():
        n=sum(1 for k in ks if lib.kin(k,t))
        if n: ev[lv]=ev.get(lv,0)+3*n
    fnl=norm(os.path.basename(r["rel"]))
    for lv,ps in LV_FNAME.items():
        if any(re.search(p,fnl) for p in ps): ev[lv]=ev.get(lv,0)+2
    folder=r["rel"].split("/")[0]
    fold={"7eme":"7e","8eme":"8e","9eme":"9e"}.get(folder)
    if fold: ev[fold]=ev.get(fold,0)+1
    if not ev: return None,"AUCUN_INDICE",ev
    best=max(ev,key=ev.get); mx=ev[best]
    ties=[k for k,v in ev.items() if v==mx]
    if len(ties)>1: return None,"CONFLIT:"+"/".join(sorted(ties)),ev
    conf="CERTAIN" if mx>=3 else ("PROBABLE" if mx>=2 else "INCERTAIN")
    if fold and best!=fold: conf="RECLASSE_depuis_"+folder
    return best,conf,ev
def detect_type(r):
    t=ntext(r)[:4000]; fn=norm(os.path.basename(r["rel"]))
    folder=r["rel"].split("/")[2] if len(r["rel"].split("/"))>2 else ""
    for name,kar,pfn in TYPES:
        if any(lib.kin(k,t) for k in kar) or any(re.search(p,fn) for p in pfn):
            return name
    return {"devoirs":"devoir_INDETERMINE","exercices":"serie","cours":"cours",
            "corrections":"corrige","manuel":"manuel","parascolaire":"parascolaire",
            "examens-nationaux":"examen_national","programme":"programme"}.get(folder,"INDETERMINE")
LESSONS=tree.lessons()
def detect_topics(txt_norm,level=None):
    hits=[]
    for l in LESSONS:
        if level and l["level"]!=level: continue
        n=sum(1 for k in l["kw_ar"] if lib.kin(k,txt_norm))+sum(1 for k in l["kw_fr"] if lib.kin(k,txt_norm))
        if n: hits.append((n,l))
    hits.sort(key=lambda x:-x[0])
    return hits
def run():
    docs=[]
    src=json.load(open("text_source.json")) if os.path.exists("text_source.json") else {}
    for r in META:
        t_merged=lib.text(r)
        r=dict(r); r["chars"]=len(t_merged.strip())   # compteur sur le texte reellement utilise
        d={"rel":r["rel"],"key":r["key"],"pages":r.get("pages",0),"chars":r["chars"],
           "texte":src.get(r["rel"],"NATIF")}
        if r["chars"]<200:
            lv,conf,ev=detect_level(r)
            d.update(statut="SANS_TEXTE_SCAN",level=lv,level_conf="NON_VERIFIABLE",topics=[])
            d["type"],d["type_src"]=detect.doc_type(r["rel"],"")
            docs.append(d); continue
        t=ntext(r); p=lib.profile(r)
        d["lycee_score"]=p["lycee"]; d["math_score"]=p["math"]
        d["other"]=p["other_which"]; d["other_score"]=p["other_max"]
        lv,conf,ev=detect_level(r)
        d["type"],d["type_src"]=detect.doc_type(r["rel"],t)
        if p["other_max"]>=3 and p["other_max"]>p["math"]:
            d.update(statut="HORS_MATIERE:"+str(p["other_which"]),level=lv,level_conf=conf,topics=[])
            docs.append(d); continue
        if p["lycee"]>=4 or (p["lycee"]>=2 and lv is None and p["math"]<6):
            d.update(statut="HORS_NIVEAU_LYCEE",level=None,level_conf=conf,topics=[])
            docs.append(d); continue
        tp=detect_topics(t,lv)
        d["level"]=lv; d["level_conf"]=conf; d["level_ev"]=ev
        d["topics"]=[{"code":l["code"],"ch":l["ch"],"ch_fr":l["ch_fr"],"les":l["les"],"les_fr":l["les_fr"],"hits":n} for n,l in tp[:8]]
        if lv is None: d["statut"]="NIVEAU_INCERTAIN"
        elif p["lycee"]>=2: d["statut"]="MIXTE_college_lycee"
        elif p["math"]<2: d["statut"]="CONTENU_MATH_FAIBLE"
        else: d["statut"]="VALIDE"
        docs.append(d)
    json.dump(docs,open("docs.json","w"),ensure_ascii=False)
    return docs
if __name__=="__main__":
    docs=run()
    print("documents:",len(docs))
    c=collections.Counter(d["statut"] for d in docs)
    for k,v in c.most_common(): print("  %-28s %d"%(k,v))
    print()
    print("NIVEAU x STATUT (docs exploitables)")
    cc=collections.Counter((d.get("level"),d["statut"]) for d in docs if d["statut"] in("VALIDE","MIXTE_college_lycee","CONTENU_MATH_FAIBLE"))
    for k,v in sorted(cc.items(),key=lambda x:str(x[0])): print("  ",k,v)
    print()
    print("TYPE (docs valides)")
    for k,v in collections.Counter(d["type"] for d in docs if d["statut"]=="VALIDE").most_common(): print("  %-24s %d"%(k,v))
    print()
    print("CONFIANCE NIVEAU")
    for k,v in collections.Counter(d.get("level_conf") for d in docs).most_common(): print("  %-30s %d"%(k,v))
