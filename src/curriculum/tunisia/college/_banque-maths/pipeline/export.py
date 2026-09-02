# -*- coding: utf-8 -*-
import json,csv,collections,os
import tree
OUT="/Users/ritchess/Documents/9arrini/src/curriculum/tunisia/college/_banque-maths"
B=json.load(open("bank.json")); D=json.load(open("docs.json")); G=json.load(open("gaps.json"))
GEN=json.load(open("generated.json")) if os.path.exists("generated.json") else []
U=[e for e in B if e["dup"]=="EXERCICE_DISTINCT"]
os.makedirs(OUT,exist_ok=True)

# identifiants des exercices generes : suffixe G pour ne jamais les confondre
_c=collections.Counter()
for e in sorted(GEN,key=lambda x:(x["level"],x["ch"],x["les"],x["diff"])):
    k=(e["level"],e["ch"],e["les"]); _c[k]+=1
    e["id"]="%sM-%s-%s-G%03d"%(e["level"][0],e["ch"],e["les"],_c[k])

# 1. arborescence officielle
with open(OUT+"/01-arborescence-programme.md","w") as f:
    f.write("# Arborescence du programme officiel de mathématiques — collège tunisien\n\n")
    f.write("> Source unique : *برنامج الرياضيات بالمرحلة الإعدادية من التعليم الأساسي*, Ministère de l'Éducation, janvier 2011\n")
    f.write("> (`_cycle/mathematiques/programme/math_college.pdf`, 31 pages).\n")
    f.write("> Aucun chapitre ni leçon n'a été ajouté au-delà de ce document.\n\n")
    for lv in ("7e","8e","9e"):
        f.write("## %s année de l'enseignement de base\n\n"%lv)
        for dc,dfr,dar,chs in tree.T[lv]:
            f.write("### %s — %s\n\n"%(dfr,dar))
            for cc,cfr,car,ls in chs:
                f.write("- **%s. %s** — %s\n"%(cc,cfr,car))
                for lc,lfr,lar,_,_ in ls:
                    n=sum(1 for e in U if e["level"]==lv and e["ch"]==cc and e["les"]==lc)
                    ng=sum(1 for e in GEN if e["level"]==lv and e["ch"]==cc and e["les"]==lc)
                    extra=" + %d générés"%ng if ng else ""
                    f.write("  - `%s` %s — %s *(%d extraits%s)*\n"%(lc,lfr,lar,n,extra))
            f.write("\n")

# 2. banque : CSV complet
cols=["id","level","dom_fr","ch","ch_fr","les","les_fr","notion_ar","comp","extype","diff",
      "ambig","score","steps","nnot","nsub","nprop","statut","dup","src","src_type","src_num","nchars","why","body"]
with open(OUT+"/02-banque-exercices.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore"); w.writeheader()
    for e in sorted(B,key=lambda x:x["id"]): w.writerow(e)
json.dump(B,open(OUT+"/02-banque-exercices.json","w"),ensure_ascii=False,indent=1)

# 3. banque lisible par lecon
with open(OUT+"/03-banque-par-lecon.md","w") as f:
    f.write("# Banque d'exercices structurée\n\n%d exercices extraits, %d uniques.\n"%(len(B),len(U)))
    f.write("\nChaque fiche suit le format demandé. `Statut` = résultat de la détection de doublons.\n")
    f.write("\n> **Avertissement de fiabilité.** Classement produit par extraction automatique puis\n")
    f.write("> vérification manuelle par échantillonnage : ~65-72 % des notions et ~85 % des\n")
    f.write("> difficultés sont correctes. Toute fiche doit être relue avant publication.\n\n")
    for lv in ("7e","8e","9e"):
        f.write("\n# %s année\n"%lv)
        for l in tree.lessons(lv):
            ex=[e for e in U if e["ch"]==l["ch"] and e["les"]==l["les"]]
            if not ex: continue
            f.write("\n## %s-%s %s > %s  (%d)\n"%(l["ch"],l["les"],l["ch_fr"],l["les_fr"],len(ex)))
            for d in ("BASIQUE","MOYEN","DIFFICILE"):
                sub=[e for e in ex if e["diff"]==d]
                if not sub: continue
                f.write("\n### %s (%d)\n\n"%(d,len(sub)))
                for e in sub:
                    f.write("```\nID : %s\nNiveau : %s\nChapitre : %s\nLeçon : %s\nNotion : %s\nCompétence : %s\n"%(
                        e["id"],e["level"],e["ch_fr"],e["les_fr"],e["notion"],e["comp"]))
                    f.write("Type : %s\nDifficulté : %s%s\nNombre d'étapes : %d\nNombre de notions mobilisées : %d\n"%(
                        e["extype"],e["diff"]," — DIFFICULTÉ À CONFIRMER" if e["ambig"] else "",e["steps"],e["nnot"]))
                    f.write("Énoncé : %s\nSource : %s (exercice n°%s, type %s)\nStatut : %s\nJustification de la difficulté : %s\n```\n\n"%(
                        e["body"],e["src"],e["src_num"],e["src_type"],e["statut"],e["why"]))

# 4. lacunes
with open(OUT+"/04-rapport-lacunes.md","w") as f:
    f.write("# Rapport des lacunes\n\nCibles : BASIQUE 8-15, MOYEN 8-15, DIFFICILE 5-10 par leçon.\n\n")
    c=collections.Counter(r["statut"] for r in G)
    f.write("| Statut | Leçons |\n|---|---|\n")
    for k,v in c.most_common(): f.write("| %s | %d / %d |\n"%(k,v,len(G)))
    gc=collections.Counter((e["level"],e["ch"],e["les"],e["diff"]) for e in GEN)
    f.write("\n`+n` = exercices produits par IA venant compléter la leçon.\n")
    f.write("\n## Détail par leçon\n\n| Niv | Chapitre | Leçon | BAS | MOY | DIF | Total | Statut | Manque |\n|---|---|---|--:|--:|--:|--:|---|---|\n")
    for r in G:
        k=(r["level"],r["ch"],r["les"])
        gb,gm,gd=gc[k+("BASIQUE",)],gc[k+("MOYEN",)],gc[k+("DIFFICILE",)]
        fm=lambda v,g:("%d+%d"%(v,g) if g else str(v))
        tot=r["tot"]+gb+gm+gd
        st=r["statut"]
        if st=="AUCUN_EXERCICE" and (gb+gm+gd): st="COMPLETEE_PAR_IA"
        TG={"BASIQUE":(8,r["b"]+gb),"MOYEN":(8,r["m"]+gm),"DIFFICILE":(5,r["d"]+gd)}
        manque=[d for d,(lo,hv) in TG.items() if hv<lo]
        if not manque and st in("AUCUN_EXERCICE","BANQUE_INSUFFISANTE"): st="BANQUE_SUFFISANTE"
        f.write("| %s | %s | %s | %s | %s | %s | %d | %s | %s |\n"%(r["level"],r["ch_fr"],r["les_fr"],
                fm(r["b"],gb),fm(r["m"],gm),fm(r["d"],gd),tot,st.replace("_"," ").lower(),
                ", ".join(manque) or "—"))
    vides=[r for r in G if r["statut"]=="AUCUN_EXERCICE"]
    gk=set((e["level"],e["ch"],e["les"]) for e in GEN)
    f.write("\n## Leçons sans aucun exercice extrait du corpus\n\n")
    if not vides: f.write("Aucune.\n")
    for r in vides:
        k=(r["level"],r["ch"],r["les"])
        nb=sum(1 for e in GEN if (e["level"],e["ch"],e["les"])==k)
        etat="**complétée par %d exercices produits par IA**"%nb if k in gk else "**reste à produire**"
        f.write("- %s `%s-%s` %s > %s — %s\n"%(r["level"],r["ch"],r["les"],r["ch_fr"],r["les_fr"],etat))
    f.write("\n## Leçons incomplètes restantes\n\n")
    gc2=collections.Counter((e["level"],e["ch"],e["les"],e["diff"]) for e in GEN)
    n_inc=0
    for r in G:
        k=(r["level"],r["ch"],r["les"])
        h={"BASIQUE":r["b"]+gc2[k+("BASIQUE",)],"MOYEN":r["m"]+gc2[k+("MOYEN",)],"DIFFICILE":r["d"]+gc2[k+("DIFFICILE",)]}
        need={d:max(0,t-h[d]) for d,t in (("BASIQUE",8),("MOYEN",8),("DIFFICILE",5))}
        if sum(need.values()):
            n_inc+=1
            f.write("- %s `%s-%s` %s > %s — manque B%d M%d D%d\n"%(r["level"],r["ch"],r["les"],
                    r["ch_fr"],r["les_fr"],need["BASIQUE"],need["MOYEN"],need["DIFFICILE"]))
    f.write("\n**%d leçons restent incomplètes.**\n"%n_inc)

# 5. squelette parascolaire
with open(OUT+"/05-structure-parascolaire.md","w") as f:
    f.write("# Structure du futur parascolaire\n\nProgression : Rappel → Basique → Moyen → Difficile → Situation-problème → Synthèse.\n")
    f.write("\n`[À CRÉER]` = aucun exercice disponible dans le corpus pour ce bloc.\n\n")
    for lv in ("7e","8e","9e"):
        f.write("\n## %s année\n"%lv)
        for dc,dfr,dar,chs in tree.T[lv]:
            for cc,cfr,car,ls in chs:
                f.write("\n### %s — %s\n"%(cc,cfr))
                for lc,lfr,lar,_,_ in ls:
                    ex=[e for e in U if e["level"]==lv and e["ch"]==cc and e["les"]==lc]
                    f.write("\n#### %s %s\n\n"%(lc,lfr))
                    f.write("- Rappel de cours — [À RÉDIGER]\n")
                    exg=[e for e in GEN if e["level"]==lv and e["ch"]==cc and e["les"]==lc]
                    for d,lab in (("BASIQUE","Exercices basiques"),("MOYEN","Exercices moyens"),("DIFFICILE","Exercices difficiles")):
                        n=sum(1 for e in ex if e["diff"]==d); ng=sum(1 for e in exg if e["diff"]==d)
                        if n or ng:
                            f.write("- %s — %d extraits%s\n"%(lab,n," + %d générés"%ng if ng else ""))
                        else:
                            f.write("- %s — [À CRÉER]\n"%lab)
                    sp=sum(1 for e in ex if e["extype"] in("Situation-problème","Problème"))
                    f.write("- Situation-problème — %s\n"%("%d disponible(s)"%sp if sp else "[À CRÉER]"))
                    f.write("- Synthèse — [À RÉDIGER]\n")

# 7. exercices generes par IA (jamais melanges aux originaux)
if GEN:
    json.dump(GEN,open(OUT+"/07-exercices-generes.json","w"),ensure_ascii=False,indent=1)
    with open(OUT+"/07-exercices-generes.md","w") as f:
        f.write("# Exercices produits par IA\n\n")
        f.write("%d exercices, couvrant les leçons du programme officiel pour lesquelles le corpus\n"%len(GEN))
        f.write("ne fournissait **aucun** exercice extractible.\n\n")
        f.write("> Ces exercices sont **créés**, pas extraits. Ils sont conservés dans un fichier séparé\n")
        f.write("> et portent un identifiant en `G###` afin de ne jamais être confondus avec les énoncés\n")
        f.write("> d'origine. Ils suivent le programme officiel mais n'ont pas été validés en classe.\n\n")
        for lv in ("7e","8e","9e"):
            sub=[e for e in GEN if e["level"]==lv]
            if not sub: continue
            f.write("\n# %s année\n"%lv)
            for l in tree.lessons(lv):
                ex=[e for e in sub if e["ch"]==l["ch"] and e["les"]==l["les"]]
                if not ex: continue
                f.write("\n## %s-%s %s > %s  (%d)\n"%(l["ch"],l["les"],l["ch_fr"],l["les_fr"],len(ex)))
                for d in ("BASIQUE","MOYEN","DIFFICILE"):
                    ss=[e for e in ex if e["diff"]==d]
                    if not ss: continue
                    f.write("\n### %s (%d)\n\n"%(d,len(ss)))
                    for e in ss:
                        f.write("```\nID : %s\nNiveau : %s\nChapitre : %s\nLeçon : %s\nNotion : %s\n"%(
                            e["id"],e["level"],e["ch_fr"],e["les_fr"],e["notion"]))
                        f.write("Compétence : %s\nType : %s\nDifficulté : %s\nNombre d'étapes : %d\n"%(
                            e["comp"],e["extype"],e["diff"],e["steps"]))
                        f.write("Nombre de notions mobilisées : %d\nÉnoncé : %s\nSource : %s\nStatut : %s\n"%(
                            e["nnot"],e["body"],e["src"],e["statut"]))
                        f.write("Justification de la difficulté : %s\n```\n\n"%e["why"])

# 6. inventaire documentaire
cols2=["rel","statut","level","level_conf","type","type_src","pages","chars","math_score","lycee_score","corrupt"]
with open(OUT+"/06-inventaire-documents.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=cols2,extrasaction="ignore"); w.writeheader()
    for d in sorted(D,key=lambda x:x["rel"]): w.writerow(d)
print("exporte dans",OUT)
for fn in sorted(os.listdir(OUT)): print("  %-34s %8.1f Ko"%(fn,os.path.getsize(OUT+"/"+fn)/1024))
