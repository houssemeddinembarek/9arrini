# -*- coding: utf-8 -*-
"""Poids de specificite (IDF) des mots-cles : sans ceci, une lecon dotee de
mots-cles generiques (رباعي, المربع...) capte les exercices des lecons
a vocabulaire rare mais decisif (فيتاغور, طالس...)."""
import json,math,collections,os
import lib,tree
import extract_ex as X
from lib import ntext,BYREL
CACHE="kwidf.json"
def bodies():
    docs=json.load(open("docs.json")); out=collections.defaultdict(list)
    for d in docs:
        if d["statut"] not in("VALIDE","CONTENU_MATH_FAIBLE") or not d.get("level"): continue
        for s in X.segment(ntext(BYREL[d["rel"]])):
            if 40<=s["nchars"]<=6000: out[d["level"]].append(s["body"])
    return out
def build():
    B=bodies(); LES=tree.lessons(); idf={}
    for lv,bods in B.items():
        N=len(bods); prep=[(b,"".join(b.split())) for b in bods]
        kws=set()
        for l in LES:
            if l["level"]==lv: kws.update(l["kw_ar"]+l["kw_fr"])
        for k in kws:
            df=sum(1 for b,bc in prep if X._m(k,b,bc))
            idf["%s|%s"%(lv,k)]=round(math.log((N+1)/(df+1))+0.2,4)
        print(lv,"N=%d mots-cles=%d"%(N,len(kws)),flush=True)
    json.dump(idf,open(CACHE,"w"),ensure_ascii=False)
    return idf
def load():
    return json.load(open(CACHE)) if os.path.exists(CACHE) else build()
if __name__=="__main__":
    idf=build()
    for lv in ("7e","8e","9e"):
        it=sorted(((v,k.split("|")[1]) for k,v in idf.items() if k.startswith(lv+"|")))
        print("\n%s -- mots-cles les PLUS generiques (poids faible):"%lv)
        for v,k in it[:8]: print("   %.2f  %s"%(v,k))
        print("%s -- mots-cles les PLUS specifiques:"%lv)
        for v,k in it[-6:]: print("   %.2f  %s"%(v,k))
