# -*- coding: utf-8 -*-
"""Cache de texte fusionne.

Pour chaque document on retient la source la plus lisible entre l'extraction
native et l'OCR. Le critere n'est pas seulement l'absence de texte natif :
beaucoup de PDF ont un texte natif present mais rendu illisible par la police
(zone privee, grec parasite, ligature lam-alef inversee, mots coupes).
"""
import json,os,re,hashlib,collections
import lib,quality
def okey(rel): return hashlib.md5(rel.encode()).hexdigest()
def dirt(t):
    """Densite d'anomalies pour 1000 caracteres."""
    if not t or len(t)<50: return 999.0
    n=(len(quality.PUA.findall(t))+len(quality.GREEK.findall(t))
       +len(quality.LIG.findall(t))+len(quality.SPLIT.findall(t)))
    return 1000.0*n/len(t)
def arab(t): return sum(1 for c in t if "؀"<=c<="ۿ")
def run():
    META=json.load(open("meta.json")); os.makedirs("cache_merged",exist_ok=True)
    stat=collections.Counter(); src={}
    for r in META:
        nat=open("cache/%s.txt"%r["key"]).read()
        p="cache_ocr/%s.txt"%okey(r["rel"])
        ocr=open(p).read() if os.path.exists(p) else ""
        use,why=nat,"NATIF"
        if len(ocr.strip())>=200:
            dn,do=dirt(nat),dirt(ocr)
            if len(nat.strip())<200:
                use,why=ocr,"OCR_SCAN"
            elif do<dn*0.5 and arab(ocr)>=arab(nat)*0.6:
                # l'OCR est nettement plus propre sans perdre l'arabe
                use,why=ocr,"OCR_REPARATION"
        open("cache_merged/%s.txt"%r["key"],"w").write(use)
        stat[why]+=1; src[r["rel"]]=why
    json.dump(src,open("text_source.json","w"),ensure_ascii=False)
    for k,v in stat.most_common(): print("  %-18s %d"%(k,v))
    return stat
if __name__=="__main__": run()
