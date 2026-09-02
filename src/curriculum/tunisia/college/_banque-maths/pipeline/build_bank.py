# -*- coding: utf-8 -*-
import re,json,os,collections,hashlib,itertools
import lib,tree,detect
import extract_ex as X
from lib import ntext,BYREL,norm

BAD=re.compile(r'[Ͱ-ϿЀ-ӿ- -⁯]')
def corrupt_ratio(t):
    if not t: return 0.0
    return len(BAD.findall(t))/max(1,len(t))
HORS=["vecteur","fonction linéaire","fonction affine","logarithme","dérivée","asymptote",
      "barycentre","produit scalaire","polynôme","second degré","1ère année","2ème année",
      "3ème année","4ème année","suite arithmétique","suite géométrique","nier les propositions","algorithme","tableur","langage de programmation",
      "متجه","الدوال","المتتاليه","مشتق","كثير الحدود",
      "\u20d7","\u0362","vecteur","colinéaire","norme du vecteur"]
def HORS_PROG(b):
    """Ecarte les enonces hors programme du college (contenu secondaire residuel)."""
    lo=b.lower()
    if "\u20d7" in b and b.count("\u20d7")>=2: return True   # fleches vectorielles
    return sum(1 for k in HORS if k in lo)>=1 and sum(1 for c in lo if c.isalpha() and ord(c)<0x250)>len(lo)*0.3
COMP={ "algo":"Utiliser un algorithme, un procédé ou une technique de calcul",
       "repr":"Exploiter ou produire une représentation (graphique, tableau, symbolique)",
       "prob":"Résoudre des problèmes / modéliser une situation",
       "geo" :"Mettre en œuvre une technique ou un procédé dans une activité géométrique"}
GEO_CH={"CH07","CH08","CH09","CH10","CH11","CH12","CH13","CH14","CH15"}
def competence(dom,ch,extype):
    if extype in ("Situation-problème","Problème"): return COMP["prob"]
    if extype in ("Lecture graphique",) or dom=="D3": return COMP["repr"]
    if dom=="D4" or (dom=="D5" and ch in GEO_CH): return COMP["geo"]
    if extype in ("Construction géométrique",): return COMP["geo"]
    return COMP["algo"]
NUM=re.compile(r'\d+(?:[.,]\d+)?')
PUNCT=re.compile(r'[^\w؀-ۿ]+')
def sig_exact(b): return hashlib.md5(PUNCT.sub("",b).encode()).hexdigest()
def sig_var(b):   return hashlib.md5(PUNCT.sub("",NUM.sub("#",b)).encode()).hexdigest()
def shingles(b,k=4):
    w=[x for x in PUNCT.sub(" ",NUM.sub("#",b)).split() if x]
    return set(tuple(w[i:i+k]) for i in range(max(0,len(w)-k+1))) or set()
def cgrams(b,k=6):
    """N-grammes de caracteres : insensibles aux virgules et espaces deplaces
    par le rendu bidirectionnel, contrairement aux n-grammes de mots."""
    s=PUNCT.sub("",NUM.sub("#",b))
    return set(s[i:i+k] for i in range(max(0,len(s)-k+1))) or set()
def jac(a,b):
    if not a or not b: return 0.0
    i=len(a&b); return i/(len(a)+len(b)-i)

def build():
    docs=json.load(open("docs.json"))
    byrel={d["rel"]:d for d in docs}
    # flag encodage
    for d in docs:
        if d["statut"]=="SANS_TEXTE_SCAN": continue
        cr=corrupt_ratio(open("%s/%s.txt"%(lib.CACHE_DIR,d["key"])).read())
        d["corrupt"]=round(cr,3)
        if cr>0.06 and d["statut"] in("VALIDE","CONTENU_MATH_FAIBLE"): d["statut"]="ENCODAGE_CORROMPU"
    json.dump(docs,open("docs.json","w"),ensure_ascii=False)

    raw=[]
    for d in docs:
        if d["statut"] not in("VALIDE","CONTENU_MATH_FAIBLE") or not d.get("level"): continue
        lv=d["level"]; tn=ntext(BYREL[d["rel"]])
        for s in X.segment(tn):
            b=s["body"]; n=s["nchars"]
            if n<40 or n>6000: continue
            if HORS_PROG(b): continue
            nots=X.notions(b,lv)
            if not nots: continue
            # ecarter les fragments sans consigne exploitable
            if not (X.has(b,X.V_DIRECT) or X.has(b,X.V_RAIS) or X.has(b,X.V_CONSTR)): continue
            nsub=X.count_subq(b)
            rais=X.has(b,X.V_RAIS); constr=X.has(b,X.V_CONSTR); lect=X.has(b,X.V_LECT)
            ctx=X.has(b,X.CTX); qcm=X.has(b,X.QCM); direc=X.has(b,X.V_DIRECT)
            dedu=any(lib.kin(k,b) for k in ["استنتج","en déduire","déduire"])
            # une notion ne compte que si elle est attestee par >=2 mots-cles
            # (un seul mot-cle produit trop de faux positifs et gonfle la difficulte)
            strong=set((l["ch"],l["les"]) for k,l in nots if k>=2)
            ndist=max(1,len(strong))
            top=nots[0][1]
            et=X.ex_type(b,nsub,rais,constr,lect,ctx,qcm)
            fams=X.rais_families(b)
            nprop=sum(1 for k in X.PROPS if lib.kin(k,b))
            strat=sum(1 for k in X.STRAT if lib.kin(k,b))
            diff,why,steps,sc,amb=X.difficulty(ndist,nsub,rais,constr,ctx,qcm,dedu,fams,nprop,strat)
            raw.append(dict(level=lv,ch=top["ch"],ch_fr=top["ch_fr"],les=top["les"],les_fr=top["les_fr"],
                dom=top["dom"],dom_fr=top["dom_fr"],notion=top["les_fr"],notion_ar=top["les_ar"],
                comp=competence(top["dom"],top["ch"],et),extype=et,diff=diff,score=sc,ambig=amb,
                fams=fams,nprop=nprop,
                steps=steps,nnot=ndist,nsub=nsub,body=re.sub(r'\s+',' ',b).strip(),nchars=n,
                src=d["rel"],src_type=d["type"],src_num=s["num"],kind=s["kind"],
                notions_all=[{"ch":l["ch"],"les":l["les"],"fr":l["les_fr"],"hits":k} for k,l in nots[:5]],
                verbs=dict(rais=rais[:3],constr=constr[:2],lect=lect[:2],ctx=ctx[:3],qcm=qcm[:2],direct=direc[:3]),
                why=why))
    # ---- PHASE 4 : doublons ----
    ex_map=collections.defaultdict(list); var_map=collections.defaultdict(list)
    for i,e in enumerate(raw):
        ex_map[sig_exact(e["body"])].append(i); var_map[sig_var(e["body"])].append(i)
    for e in raw: e["dup"]="EXERCICE_DISTINCT"; e["dup_of"]=None
    for h,ids in ex_map.items():
        if len(ids)>1:
            keep=max(ids,key=lambda i:raw[i]["nchars"])
            for i in ids:
                if i!=keep: raw[i]["dup"]="DOUBLON_EXACT"; raw[i]["dup_of"]=keep
    for h,ids in var_map.items():
        if len(ids)>1:
            live=[i for i in ids if raw[i]["dup"]=="EXERCICE_DISTINCT"]
            if len(live)>1:
                keep=max(live,key=lambda i:raw[i]["nchars"])
                for i in live:
                    if i!=keep: raw[i]["dup"]="VARIANTE"; raw[i]["dup_of"]=keep
    # meme competence : jaccard dans le bucket (niveau, chapitre, lecon)
    buck=collections.defaultdict(list)
    for i,e in enumerate(raw):
        if e["dup"]=="EXERCICE_DISTINCT": buck[(e["level"],e["ch"],e["les"])].append(i)
    # bandes de similarite : quasi-identique / variante / meme competence
    for k,ids in buck.items():
        sh={i:shingles(raw[i]["body"]) for i in ids}
        cg={i:cgrams(raw[i]["body"]) for i in ids}
        for a,z in itertools.combinations(ids,2):
            if raw[z]["dup"]!="EXERCICE_DISTINCT" or raw[a]["dup"]!="EXERCICE_DISTINCT": continue
            jc=jac(cg[a],cg[z]); jw=jac(sh[a],sh[z])
            if   jc>=0.90: lab="DOUBLON_EXACT"
            elif jc>=0.75: lab="VARIANTE"
            elif jw>=0.60: lab="MÊME_COMPÉTENCE"
            else: continue
            keep,drop=(a,z) if raw[a]["nchars"]>=raw[z]["nchars"] else (z,a)
            raw[drop]["dup"]=lab; raw[drop]["dup_of"]=keep
    # ---- surcharge par la relecture manuelle (verite terrain, prioritaire) ----
    import hashlib
    revf="reviewed.json"
    if os.path.exists(revf):
        rev=json.load(open(revf)); L={ (l["level"],l["ch"],l["les"]):l for l in tree.lessons() }
        keep=[]; nrej=ncor=0
        for e in raw:
            k=hashlib.md5(e["body"].encode()).hexdigest()[:12]
            v=rev.get(k)
            if v=="REJET": nrej+=1; continue
            if v and v not in("OK",):
                try: ch,les=v.split("-")
                except ValueError: keep.append(e); continue
                l=L.get((e["level"],ch,les))
                if l:
                    e.update(ch=ch,les=les,ch_fr=l["ch_fr"],les_fr=l["les_fr"],dom=l["dom"],
                             dom_fr=l["dom_fr"],notion=l["les_fr"],notion_ar=l["les_ar"],
                             comp=competence(l["dom"],ch,e["extype"]))
                    ncor+=1
            e["relu"]=bool(v)
            keep.append(e)
        raw=keep
        print("relecture appliquee : %d corriges, %d rejetes"%(ncor,nrej))
    # ---- identifiants ----
    cnt=collections.Counter()
    for e in sorted(raw,key=lambda x:(x["level"],x["ch"],x["les"],x["src"],x["src_num"])):
        k=(e["level"],e["ch"],e["les"]); cnt[k]+=1
        e["id"]="%sM-%s-%s-EX%03d"%(e["level"][0],e["ch"],e["les"],cnt[k])
        e["statut"]="ORIGINAL_EXTRAIT" if e["dup"]=="EXERCICE_DISTINCT" else e["dup"]
    json.dump(raw,open("bank.json","w"),ensure_ascii=False)
    return raw
if __name__=="__main__":
    raw=build()
    print("exercices extraits:",len(raw))
    print("\nDOUBLONS:",dict(collections.Counter(e["dup"] for e in raw)))
    print("uniques (EXERCICE_DISTINCT):",sum(1 for e in raw if e["dup"]=="EXERCICE_DISTINCT"))
    print("\nDIFFICULTE:",dict(collections.Counter(e["diff"] for e in raw)))
    print("ambigus (DIFFICULTE A CONFIRMER):",sum(1 for e in raw if e["ambig"]))
    print("\nPAR NIVEAU:",dict(collections.Counter(e["level"] for e in raw)))
    print("\nTYPES D'EXERCICE:")
    for k,v in collections.Counter(e["extype"] for e in raw).most_common(): print("  %-28s %d"%(k,v))
    print("\nCOMPETENCES:")
    for k,v in collections.Counter(e["comp"] for e in raw).most_common(): print("  %-70s %d"%(k[:70],v))
