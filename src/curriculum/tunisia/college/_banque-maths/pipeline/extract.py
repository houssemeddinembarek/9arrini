import fitz, glob, os, json, sys, hashlib
fitz.TOOLS.mupdf_display_errors(False)
ROOT="/Users/ritchess/Documents/9arrini/src/curriculum/tunisia/college"
OUT="cache"; os.makedirs(OUT,exist_ok=True)
pdfs=sorted(p for p in glob.glob(ROOT+"/**/*.pdf",recursive=True) if "mathematiques" in p)
meta=[]
for i,p in enumerate(pdfs):
    rel=os.path.relpath(p,ROOT)
    key=hashlib.md5(rel.encode()).hexdigest()
    rec={"rel":rel,"key":key,"size":os.path.getsize(p)}
    try:
        d=fitz.open(p)
        rec["pages"]=d.page_count
        txt=[]; imgs=0
        for pg in d:
            txt.append(pg.get_text())
            imgs+=len(pg.get_images())
        t="\n".join(txt)
        d.close()
        rec["imgs"]=imgs; rec["chars"]=len(t.strip())
        rec["arab"]=sum(1 for c in t if '؀'<=c<='ۿ')
        rec["latin"]=sum(1 for c in t if c.isalpha() and ord(c)<0x250)
        rec["digits"]=sum(1 for c in t if c.isdigit())
        open(f"{OUT}/{key}.txt","w").write(t)
    except Exception as e:
        rec["error"]=str(e)[:120]
    meta.append(rec)
    if i%250==0: print(i,flush=True)
json.dump(meta,open("meta.json","w"))
print("DONE",len(meta))
