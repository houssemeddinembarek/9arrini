# -*- coding: utf-8 -*-
"""Intégration des exercices produits par IA dans la banque.

Les exercices générés portent le même schéma que les exercices extraits, plus
`origine: IA`. Ils ne sont jamais mélangés aux exercices originaux dans les
livrables : les fichiers les distinguent explicitement.
"""
import json,os,re,collections
import tree,extract_ex as X,lib
GEN="generated.json"
COMP={"algo":"Utiliser un algorithme, un procédé ou une technique de calcul",
      "repr":"Exploiter ou produire une représentation (graphique, tableau, symbolique)",
      "prob":"Résoudre des problèmes / modéliser une situation",
      "geo" :"Mettre en œuvre une technique ou un procédé dans une activité géométrique"}
def load(): return json.load(open(GEN)) if os.path.exists(GEN) else []
def save(g): json.dump(g,open(GEN,"w"),ensure_ascii=False,indent=1)
LES={(l["level"],l["ch"],l["les"]):l for l in tree.lessons()}
def add(level,ch,les,diff,extype,body,why,steps,nnot,comp=None):
    l=LES[(level,ch,les)]
    return dict(level=level,ch=ch,les=les,ch_fr=l["ch_fr"],les_fr=l["les_fr"],dom=l["dom"],
        dom_fr=l["dom_fr"],notion=l["les_fr"],notion_ar=l["les_ar"],
        comp=comp or COMP["geo" if l["dom"]=="D4" else "algo"],
        extype=extype,diff=diff,why=why,steps=steps,nnot=nnot,nsub=steps,
        body=re.sub(r"\s+"," ",body).strip(),origine="IA",statut="GENERE_IA",
        dup="EXERCICE_DISTINCT",src="généré (programme officiel)",src_type="IA",ambig=False)
_FR=re.compile(r"[A-Za-zÀ-ÿ]{4,}")
_OK={"cos","sin","tan","octets","min","max","daL"}
def controle(g=None):
    """Vérifie qu'aucun énoncé arabe ne contient de fragment en français,
    qu'aucun doublon n'existe et qu'aucune fiche n'est incomplète."""
    import hashlib,itertools
    g=g if g is not None else load()
    pb=[]
    for e in g:
        mots=[w for w in _FR.findall(e["body"]) if w.lower() not in _OK and not w.isupper()]
        if mots: pb.append(("LANGUE",e.get("id","?"),mots[:3]))
        if not e.get("body") or not e.get("why"): pb.append(("INCOMPLET",e.get("id","?"),""))
    h=collections.Counter(hashlib.md5(e["body"].encode()).hexdigest() for e in g)
    for k,v in h.items():
        if v>1: pb.append(("DOUBLON",k[:8],v))
    return pb

def stats():
    g=load(); print("exercices generes :",len(g))
    c=collections.Counter((e["level"],e["ch"],e["les"]) for e in g)
    for k,v in sorted(c.items()): print("  %s %s-%s : %d"%(k[0],k[1],k[2],v))
    print(dict(collections.Counter(e["diff"] for e in g)))
def targets():
    """Lecons vides ou incompletes, avec le deficit par niveau de difficulte."""
    G=json.load(open("gaps.json")); g=load()
    add_=collections.Counter((e["level"],e["ch"],e["les"],e["diff"]) for e in g)
    TGT={"BASIQUE":8,"MOYEN":8,"DIFFICILE":5}
    out=[]
    for r in G:
        k=(r["level"],r["ch"],r["les"])
        have={"BASIQUE":r["b"]+add_[k+("BASIQUE",)],"MOYEN":r["m"]+add_[k+("MOYEN",)],
              "DIFFICILE":r["d"]+add_[k+("DIFFICILE",)]}
        need={d:max(0,TGT[d]-have[d]) for d in TGT}
        if sum(need.values()): out.append(dict(r,need=need,have=have))
    return out
if __name__=="__main__":
    import sys
    if len(sys.argv)>1 and sys.argv[1]=="targets":
        t=targets()
        vides=[r for r in t if r["tot"]==0]
        print("lecons a completer : %d (dont %d totalement vides)"%(len(t),len(vides)))
        print("\n=== LECONS VIDES ===")
        for r in vides:
            print("  %s %s-%s  %s > %s  | besoin B%d M%d D%d"%(r["level"],r["ch"],r["les"],
                  r["ch_fr"][:24],r["les_fr"][:34],r["need"]["BASIQUE"],r["need"]["MOYEN"],r["need"]["DIFFICILE"]))
        tot=sum(sum(r["need"].values()) for r in t)
        print("\ndeficit total : %d exercices"%tot)
    elif len(sys.argv)>1 and sys.argv[1]=="controle":
        pb=controle()
        print("anomalies :",len(pb))
        for t,i,d in pb[:15]: print("  %-10s %s %s"%(t,i,d))
    else: stats()
