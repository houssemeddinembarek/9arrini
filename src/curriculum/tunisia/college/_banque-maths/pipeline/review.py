# -*- coding: utf-8 -*-
"""Relecture semantique des notions.

Cle stable = md5 de l'enonce (survit aux reconstructions de la banque).
Les lots sont ordonnes par incertitude croissante du classifieur : la marge
entre la notion retenue et la suivante. Les erreurs se concentrent en bas.
"""
import json,sys,collections,os,hashlib
import tree
def bkey(b): return hashlib.md5(b.encode()).hexdigest()[:12]
def load_rev(): return json.load(open("reviewed.json")) if os.path.exists("reviewed.json") else {}
def codes_txt(lv):
    return "\n".join("  %s-%s = %s > %s"%(l["ch"],l["les"],l["ch_fr"],l["les_fr"]) for l in tree.lessons(lv))
def pool(bank="bank.json",level=None,stable_only=False):
    B=json.load(open(bank)); rev=load_rev()
    U=[e for e in B if e["dup"]=="EXERCICE_DISTINCT"]
    if level: U=[e for e in U if e["level"]==level]
    if stable_only:
        tgt=set(json.load(open("ocr_targets_all.json")))
        U=[e for e in U if e["src"] not in tgt]
    U=[e for e in U if bkey(e["body"]) not in rev]
    for e in U:
        na=e.get("notions_all") or []
        e["_margin"]=(na[0]["hits"]-na[1]["hits"]) if len(na)>1 else 9
    U.sort(key=lambda e:(e["_margin"],e["level"],e["ch"],e["les"]))
    return U
def emit(lot,size=55,level=None,bank="bank.json",stable_only=False):
    U=pool(bank,level,stable_only)
    chunk=U[lot*size:(lot+1)*size]
    if not chunk: print("LOT VIDE"); return
    lvs=sorted(set(e["level"] for e in chunk))
    print("### LOT %d — %d exercices — restants a relire: %d"%(lot,len(chunk),len(U)))
    for lv in lvs:
        print("### CODES VALIDES %s"%lv); print(codes_txt(lv))
    print("### Reponse attendue: une ligne par exercice -> `<cle> OK` | `<cle> CHxx-Lyy` | `<cle> REJET`")
    for e in chunk:
        print("\n%s | %s | actuel=%s-%s | marge=%d"%(bkey(e["body"]),e["level"],e["ch"],e["les"],e["_margin"]))
        print("  %s"%e["body"][:300])
def apply_corr(path):
    rev=load_rev(); n=0
    for line in open(path):
        line=line.strip()
        if not line or line.startswith("#"): continue
        p=line.split()
        if len(p)<2: continue
        rev[p[0]]=p[1].upper(); n+=1
    json.dump(rev,open("reviewed.json","w"),ensure_ascii=False)
    c=collections.Counter("OK" if v=="OK" else("REJET" if v=="REJET" else "CORRIGE") for v in rev.values())
    print("lignes lues: %d | total relu: %d | %s"%(n,len(rev),dict(c)))
if __name__=="__main__":
    a=sys.argv
    if a[1]=="emit":
        emit(int(a[2]),int(a[3]) if len(a)>3 else 55,a[4] if len(a)>4 and a[4]!="-" else None,
             a[5] if len(a)>5 else "bank.json", "stable" in a)
    elif a[1]=="apply": apply_corr(a[2])
    elif a[1]=="stats":
        rev=load_rev(); print("relus:",len(rev))
        print(collections.Counter("OK" if v=="OK" else("REJET" if v=="REJET" else "CORRIGE") for v in rev.values()))
