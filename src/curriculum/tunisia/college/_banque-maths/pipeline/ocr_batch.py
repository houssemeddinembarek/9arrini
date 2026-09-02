# -*- coding: utf-8 -*-
"""OCR par lot, parallelise et reprenable. Ecrit cache_ocr/<md5>.txt"""
import json,os,sys,hashlib,time
from multiprocessing import Pool
OUT="cache_ocr"; os.makedirs(OUT,exist_ok=True)
def key(rel): return hashlib.md5(rel.encode()).hexdigest()
def work(rel):
    p="%s/%s.txt"%(OUT,key(rel))
    if os.path.exists(p): return (rel,-1)
    try:
        import ocr
        t=ocr.ocr_pdf(rel,dpi=200,maxpages=12)
        open(p,"w").write(t or "")
        return (rel,len(t or ""))
    except Exception as e:
        open(p,"w").write("")
        return (rel,-2)
if __name__=="__main__":
    tgt=json.load(open("ocr_targets.json"))
    todo=[r for r in tgt if not os.path.exists("%s/%s.txt"%(OUT,key(r)))]
    print("a traiter:",len(todo),"/",len(tgt),flush=True)
    t0=time.time(); done=0
    with Pool(8) as pool:
        for rel,nl in pool.imap_unordered(work,todo,chunksize=2):
            done+=1
            if done%40==0:
                el=time.time()-t0
                print("%d/%d  %.0fs ecoulees  ~%.0fs restantes"%(done,len(todo),el,el/done*(len(todo)-done)),flush=True)
    print("TERMINE %d documents en %.0fs"%(len(todo),time.time()-t0),flush=True)
