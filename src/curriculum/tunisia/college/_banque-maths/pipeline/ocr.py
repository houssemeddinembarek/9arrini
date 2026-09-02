# -*- coding: utf-8 -*-
"""OCR arabe/francais via le framework Vision d'Apple (aucun modele externe)."""
import fitz, Vision, Quartz, Foundation, objc, sys, os, json, time
fitz.TOOLS.mupdf_display_errors(False)
ROOT="/Users/ritchess/Documents/9arrini/src/curriculum/tunisia/college/"
LANGS=["ar-SA","fr-FR"]
def ocr_png(png_bytes, langs=LANGS, fast=False):
    data=Foundation.NSData.dataWithBytes_length_(png_bytes,len(png_bytes))
    src=Quartz.CGImageSourceCreateWithData(data,None)
    if src is None: return None
    img=Quartz.CGImageSourceCreateImageAtIndex(src,0,None)
    if img is None: return None
    req=Vision.VNRecognizeTextRequest.alloc().init()
    req.setRecognitionLevel_(1 if fast else 0)      # 0 = accurate
    req.setRecognitionLanguages_(langs)
    req.setUsesLanguageCorrection_(True)
    handler=Vision.VNImageRequestHandler.alloc().initWithCGImage_options_(img,None)
    ok,err=handler.performRequests_error_([req],None)
    if not ok: return None
    out=[]
    for obs in (req.results() or []):
        c=obs.topCandidates_(1)
        if c and len(c): out.append(c[0].string())
    return "\n".join(out)
def ocr_pdf(rel, dpi=200, maxpages=12, fast=False):
    d=fitz.open(ROOT+rel); parts=[]
    for i in range(min(d.page_count,maxpages)):
        pix=d[i].get_pixmap(dpi=dpi)
        t=ocr_png(pix.tobytes("png"),fast=fast)
        if t: parts.append(t)
    d.close()
    return "\n".join(parts)
if __name__=="__main__":
    rel=sys.argv[1]; t0=time.time()
    txt=ocr_pdf(rel,maxpages=int(sys.argv[2]) if len(sys.argv)>2 else 3)
    print("### %s | %.1fs | %d caracteres"%(rel[-60:],time.time()-t0,len(txt)))
    print(txt[:1800])
