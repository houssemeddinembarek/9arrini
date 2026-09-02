# -*- coding: utf-8 -*-
"""Compare le classifieur a la verite terrain issue de la relecture manuelle."""
import json,collections,hashlib,sys
def bkey(b): return hashlib.md5(b.encode()).hexdigest()[:12]
B=json.load(open(sys.argv[1] if len(sys.argv)>1 else "bank.json"))
rev=json.load(open("reviewed.json"))
byk={bkey(e["body"]):e for e in B if e["dup"]=="EXERCICE_DISTINCT"}
ok=bad=miss=rej=0; err=collections.Counter()
for k,v in rev.items():
    e=byk.get(k)
    if e is None: miss+=1; continue
    cur="%s-%s"%(e["ch"],e["les"])
    if v=="REJET":
        rej+=1; continue
    truth=cur if v=="OK" else v
    if cur==truth: ok+=1
    else:
        bad+=1; err[(cur,truth)]+=1
tot=ok+bad
print("verite terrain: %d exercices relus (%d rejets, %d introuvables)"%(len(rev),rej,miss))
print("accord classifieur/relecture : %d/%d = %.0f%%"%(ok,tot,100*ok/max(1,tot)))
if err:
    print("\ndesaccords restants (classe -> devrait etre):")
    for (a,b_),n in err.most_common(12): print("   %-10s -> %-10s  x%d"%(a,b_,n))
