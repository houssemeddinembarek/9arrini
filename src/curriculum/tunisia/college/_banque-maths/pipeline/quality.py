# -*- coding: utf-8 -*-
"""Mesure de degradation d'un enonce. Les plages Unicode sont ecrites en
echappements explicites : des plages litterales se corrompent selon le shell."""
import re
PUA   = re.compile("[-￰-￿]")   # zone privee : polices cassees
GREEK = re.compile("[Ͱ-ϿЀ-ӿ]")   # grec/cyrillique parasites
LIG   = re.compile("اا")                   # ligature lam-alef inversee
SPLIT = re.compile(r"(?:^|\s)[ء-ي]\s[ء-ي]{2,}")  # mot coupe
def flags(b):
    f=[]
    if PUA.search(b): f.append("PUA")
    if GREEK.search(b): f.append("GREC")
    if len(LIG.findall(b))>=2: f.append("LIGATURE")
    if len(SPLIT.findall(b))>=3: f.append("MOTS_COUPES")
    return f
def sale(b): return bool(flags(b))
def score(t):
    """Taux de caracteres aberrants (0 = propre)."""
    if not t: return 1.0
    return (len(PUA.findall(t))+len(GREEK.findall(t)))/max(1,len(t))
