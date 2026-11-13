"""Daily scan of CanadaBuys open tenders for blackout and outage-endurance keywords.

Usage:  python3 tender_scan.py            (downloads today's open-tender feed)
        python3 tender_scan.py feed.csv   (scans a CSV you already downloaded)

The feed is CanadaBuys' open-data file of open tender notices (federal plus some
provincial/municipal postings). SEAO (Quebec) and bids&tenders / Biddingo (Ontario
municipalities) need their own saved-search email alerts; set those up with the same keywords.
"""
import csv
import io
import sys
import urllib.request

FEED = "https://canadabuys.canada.ca/opendata/pub/openTenderNotice-ouvertAvisAppelOffres.csv"

KEYWORDS = [
    # English
    "generator", "power station", "battery backup", "backup power", "emergency power",
    "uninterruptible", "ups ", "solar generator", "floodlight", "light tower", "lighting",
    "emergency kit", "preparedness", "warming centre", "warming center", "reception centre",
    "evacuation", "shelter", "cots", "blankets", "carbon monoxide", "charging station",
    "satellite terminal", "emergency supplies", "outage",
    # French
    "génératrice", "generatrice", "groupe électrogène", "alimentation de secours",
    "batterie", "éclairage", "trousse d'urgence", "mesures d'urgence", "sinistr",
    "hébergement", "centre de services", "panne", "monoxyde", "lits de camp", "couvertures",
]


def load(path=None):
    if path:
        with open(path, encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f))
    with urllib.request.urlopen(FEED, timeout=120) as r:
        text = r.read().decode("utf-8-sig", errors="replace")
    return list(csv.DictReader(io.StringIO(text)))


def pick(row, *needles):
    for key, value in row.items():
        k = (key or "").lower()
        if any(n in k for n in needles) and value:
            return value.strip()
    return ""


def main():
    rows = load(sys.argv[1] if len(sys.argv) > 1 else None)
    hits = []
    for row in rows:
        blob = " ".join(v for v in row.values() if isinstance(v, str)).lower()
        found = sorted({k.strip() for k in KEYWORDS if k in blob})
        if found:
            hits.append((pick(row, "closing", "fermeture"), pick(row, "title", "titre"),
                         pick(row, "organization", "organisation", "entity", "entité"),
                         pick(row, "reference", "référence", "solicitation"),
                         ", ".join(found[:5])))
    hits.sort()
    print(f"{len(hits)} matching open tenders out of {len(rows)}\n")
    for closing, title, org, ref, kw in hits:
        print(f"[{closing[:10]}] {title[:90]}\n    {org[:60]} | {ref} | keywords: {kw}\n")


if __name__ == "__main__":
    main()
