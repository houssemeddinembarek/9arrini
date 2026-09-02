# -*- coding: utf-8 -*-
import json,collections,os
import tree
B=json.load(open("bank.json")); D=json.load(open("docs.json"))
U=[e for e in B if e["dup"]=="EXERCICE_DISTINCT"]
LES=tree.lessons()
TGT={"BASIQUE":(8,15),"MOYEN":(8,15),"DIFFICILE":(5,10)}
def key(e): return (e["level"],e["ch"],e["les"])
byl=collections.defaultdict(lambda: collections.Counter())
for e in U: byl[key(e)][e["diff"]]+=1
rows=[]
for l in LES:
    k=(l["level"],l["ch"],l["les"]); c=byl.get(k,collections.Counter())
    tot=sum(c.values())
    manque=[d for d,(lo,hi) in TGT.items() if c[d]<lo]
    if tot==0: st="AUCUN_EXERCICE"
    elif manque: st="BANQUE_INSUFFISANTE"
    else: st="BANQUE_SUFFISANTE"
    rows.append(dict(level=l["level"],ch=l["ch"],ch_fr=l["ch_fr"],les=l["les"],les_fr=l["les_fr"],
                     dom=l["dom_fr"],b=c["BASIQUE"],m=c["MOYEN"],d=c["DIFFICILE"],tot=tot,
                     statut=st,manque=manque))
json.dump(rows,open("gaps.json","w"),ensure_ascii=False)
if __name__=="__main__":
    print("=== PHASE 8/9 : COUVERTURE PAR LECON (exercices uniques) ===\n")
    print("%-4s %-6s %-44s %4s %4s %4s %5s  %s"%("niv","chap","leçon","BAS","MOY","DIF","tot","statut"))
    for lv in ("7e","8e","9e"):
        print("-"*112)
        for r in [x for x in rows if x["level"]==lv]:
            print("%-4s %-6s %-44s %4d %4d %4d %5d  %s"%(r["level"],r["ch"],r["les_fr"][:44],r["b"],r["m"],r["d"],r["tot"],r["statut"]))
    print("\n=== SYNTHESE ===")
    c=collections.Counter(r["statut"] for r in rows)
    for k,v in c.most_common(): print("  %-22s %d / %d leçons"%(k,v,len(rows)))
    print()
    for lv in ("7e","8e","9e"):
        rr=[r for r in rows if r["level"]==lv]
        print("  %s : %d leçons | %d exercices | suffisantes: %d | insuffisantes: %d | vides: %d"%(
            lv,len(rr),sum(r["tot"] for r in rr),
            sum(1 for r in rr if r["statut"]=="BANQUE_SUFFISANTE"),
            sum(1 for r in rr if r["statut"]=="BANQUE_INSUFFISANTE"),
            sum(1 for r in rr if r["statut"]=="AUCUN_EXERCICE")))
    print("\n=== LECONS SANS AUCUN EXERCICE (a generer par IA) ===")
    for r in rows:
        if r["statut"]=="AUCUN_EXERCICE": print("  %s %s-%s  %s > %s"%(r["level"],r["ch"],r["les"],r["ch_fr"],r["les_fr"]))
