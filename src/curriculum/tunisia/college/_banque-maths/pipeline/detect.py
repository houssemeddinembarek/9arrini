import lib
# -*- coding: utf-8 -*-
import re,os
from lib import norm
AR={"SYNTHESE":["فرض تاليفي","الفرض التاليفي","تاليفي عدد","فرض توليفي"],
    "CONTROLE":["فرض مراقبه","فرض المراقبه","مراقبه عدد"],
    "MAISON":["فرض منزلي","عمل منزلي"],
    "EXAMEN_NATIONAL":["الاختبار الموحد","اختبار موحد","مناظره الدخول","الموحد للسداسي"],
    "CORRIGE":["الاصلاح النموذجي","اصلاح الفرض","الاصلاح","تصحيح الفرض"],
    "SERIE":["سلسله تمارين","سلسله عدد","تمارين حول","سلسله في"],
    "COURS":["ملخص الدرس","نشاط","مبرهنه","تعريف","خاصيه"]}
FR={"SYNTHESE":["devoir de synth"],"CONTROLE":["devoir de contr"],"MAISON":["devoir de maison"],
    "EXAMEN_NATIONAL":["examen national","concours d'entree"],
    "CORRIGE":["corrigé","corrige du devoir","correction du devoir"],
    "SERIE":["serie d'exercices","série d'exercices","fiche d'exercices"],
    "COURS":["l'essentiel du cours","résumé du cours","resume de cours"]}
FN=[("CORRIGE",[r'corrig',r'correction']),("SYNTHESE",[r'devoir[-_ ]?de[-_ ]?synthese']),
    ("CONTROLE",[r'devoir[-_ ]?de[-_ ]?controle']),("MAISON",[r'devoir[-_ ]?de[-_ ]?maison']),
    ("EXAMEN_NATIONAL",[r'examen[-_ ]?national',r'concours']),("SERIE",[r'serie[-_ ]?d[-_ ]?exercices']),
    ("COURS",[r'^cours',r'[-_]cours[-_]',r'resume']),("MANUEL",[r'manuel']),("PARASCOLAIRE",[r'parascolaire'])]
FOLDER={"devoirs":"DEVOIR_INDETERMINE","exercices":"SERIE","cours":"COURS","corrections":"CORRIGE",
        "manuel":"MANUEL","parascolaire":"PARASCOLAIRE","examens-nationaux":"EXAMEN_NATIONAL","programme":"PROGRAMME"}
def doc_type(rel,tn):
    head=tn[:6000]
    # 1. contenu explicite (source la plus fiable)
    for k in ("EXAMEN_NATIONAL","CORRIGE","SYNTHESE","CONTROLE","MAISON","SERIE"):
        if any(lib.kin(x,head) for x in AR.get(k,[])+FR.get(k,[])): return k,"CONTENU"
    # 2. nom de fichier
    fn=norm(os.path.basename(rel))
    for k,ps in FN:
        if any(re.search(p,fn) for p in ps): return k,"NOM_FICHIER"
    # 3. cours (contenu, moins discriminant -> apres nom de fichier)
    if sum(1 for x in AR["COURS"] if lib.kin(x,head))>=2: return "COURS","CONTENU_FAIBLE"
    parts=rel.split("/")
    return FOLDER.get(parts[2] if len(parts)>2 else "","INDETERMINE"),"DOSSIER"
