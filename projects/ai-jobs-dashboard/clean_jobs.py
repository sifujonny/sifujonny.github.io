#!/usr/bin/env python3
"""
Build ai_jobs_clean.csv from ai_jobs_global.csv.

index.html reads 15 columns. Seven of them are derived and do not exist in the
raw export: role_family, skills_list, salary_mid, salary_is_point,
salary_reliability, is_intern, is_dup_req. This script derives them.

job_description is dropped: the page never reads it and it is ~95% of the bytes.
"""

import csv, re, sys
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "ai_jobs_global.csv")
DST = Path(sys.argv[2] if len(sys.argv) > 2 else "ai_jobs_clean.csv")

# Ordered rules: first match wins, so the specific ones come before the generic.
ROLE_RULES = [
    ("AI Training & Annotation",  r"\bai\s+(trainer|tutor|coach)|\btrainer\b.*\bai\b|annotat|\brlhf\b|\bphds\b|data label"),
    ("MLOps / ML Infrastructure", r"\bml\s*ops|\bmlops|\bllm\s*ops|\bllmops|machine learning operations|ml/llm operations|\bml\s+(platform|infrastructure|infra)|\bai\s+(platform|infrastructure|infra)"),
    ("AI / ML Research",          r"\bresearch|\bresearcher\b|applied scientist|research scientist|machine learning scientist|\bml\s+scientist|\bscientist,\s*(ai|ml)"),
    ("Computer Vision",           r"computer vision|\bcv\s+engineer|image (processing|recognition)|\bperception\b|autonomous driving"),
    ("NLP / LLM Engineering",     r"\bnlp\b|natural language|\bllm\b|large language|prompt engineer|conversational ai|\bspeech\b|\bchatbot"),
    ("Machine Learning Engineer", r"machine learning engineer|\bml\s+engineer|deep learning engineer|machine learning developer|\bml\s+developer|machine learning specialist"),
    ("Data Scientist",            r"data scientist|data science|decision scientist|\bdatascientist"),
    ("Data Engineer",             r"data engineer|analytics engineer|data architect|\betl\b|data pipeline|big data|data platform"),
    ("Data Analyst / BI",         r"data analyst|business intelligence|\bbi\s+(analyst|developer)|reporting analyst|\banalytics\b|\banalyst\b"),
    ("AI Engineer",               r"\bai\s+engineer|artificial intelligence engineer|\bgen\s*ai|generative ai|agentic ai|\bai/ml\b|\bai\s+developer|\bki\b|\bai\s+specialist|\b(ai|artificial intelligence)\b.{0,30}\bengineer\b|\bengineer\b.{0,30}\b(ai|artificial intelligence)\b"),
    ("AI Software Engineer",      r"software engineer|software developer|\bsde\b|back[\s-]?end|front[\s-]?end|full[\s-]?stack|platform engineer|cloud engineer|devops|\bdeveloper\b|technical lead"),
    ("AI Product & Program",      r"product manager|product owner|program manager|project manager|\bscrum\b|delivery manager|product lead"),
    ("AI Consulting / Solutions", r"consultant|consulting|\bberater\b|solutions? architect|solutions? engineer|pre[\s-]?sales|customer engineer|\badvisor\b|\barchitect\b"),
]
ROLE_RULES = [(name, re.compile(pat, re.I)) for name, pat in ROLE_RULES]
UNCLASSIFIED = "Other / Unclassified"

INTERN_RE = re.compile(r"\bintern\b|\binterns\b|\binternship\b|\bpraktik(um|ant)", re.I)

# The feed puts a country name in the city column when the posting has no city.
# Left alone these become the single biggest "city" in every country.
PLACEHOLDER_CITIES = {
    "us", "usa", "u.s.", "u.s.a.", "united states", "america",
    "uk", "u.k.", "united kingdom", "great britain", "britain", "england",
    "scotland", "wales", "northern ireland",
    "deutschland", "germany", "canada", "australia",
    "multiple locations", "various", "various locations", "nationwide",
    "remote", "anywhere", "home based", "work from home", "hybrid",
    "n/a", "na", "unspecified", "unknown", "tbd", "-",
}

# Districts folded into their parent city. Only unambiguous names are listed:
# "Mitte", "Five Points" and the like belong to several cities and are left alone.
DISTRICT_TO_CITY = {
    "the city": "London", "city of london": "London", "farringdon": "London",
    "paddington": "London", "shoreditch": "London", "holborn": "London",
    "canary wharf": "London", "westminster": "London", "mayfair": "London",
    "south east london": "London", "east london": "London",
    "west london": "London", "north london": "London", "central london": "London",
    "grand central": "New York City", "manhattan": "New York City",
    "midtown manhattan": "New York City", "brooklyn": "New York City",
    "altstadt-lehel": "München", "schwabing": "München", "maxvorstadt": "München",
    "washington, district of columbia": "Washington, D.C.",
    "washington, dist. of columbia": "Washington, D.C.",
    "washington dc": "Washington, D.C.", "washington d.c.": "Washington, D.C.",
    "seattle, washington": "Seattle",
}


def canon_city(raw):
    """Return a real city name, or "" when the field holds no usable location."""
    c = WS_RE.sub(" ", (raw or "").strip())
    if not c:
        return ""
    key = c.lower().strip(" .,")
    if key in PLACEHOLDER_CITIES:
        return ""
    return DISTRICT_TO_CITY.get(key, c)
WS_RE = re.compile(r"\s+")


def role_family(title):
    for name, rx in ROLE_RULES:
        if rx.search(title):
            return name
    return UNCLASSIFIED


def norm(s):
    return WS_RE.sub(" ", (s or "").strip().lower())


def num(s):
    s = (s or "").strip()
    if not s or s.lower() in {"na", "n/a", "nan", "null", "none", "-"}:
        return None
    try:
        v = float(s)
    except ValueError:
        return None
    return v if v > 0 else None


def main():
    with SRC.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    # A duplicate requisition is the same job reposted across cities:
    # same employer, same title, same description text.
    seen = set()
    for r in rows:
        key = (norm(r.get("company")), norm(r.get("job_title")), norm(r.get("job_description")))
        r["_dup"] = key in seen
        seen.add(key)

    out_cols = [
        "job_title", "role_family", "company", "country", "city",
        "salary_min", "salary_max", "salary_mid", "salary_is_point",
        "salary_reliability", "currency", "remote_type", "experience_level",
        "skills_list", "is_intern", "is_dup_req", "posted_date", "source",
    ]

    with DST.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=out_cols)
        w.writeheader()
        for r in rows:
            title = (r.get("job_title") or "").strip()
            lo, hi = num(r.get("salary_min")), num(r.get("salary_max"))
            if lo is not None and hi is not None and lo > hi:
                lo, hi = hi, lo

            if lo is None and hi is None:
                mid, is_point, rel = None, False, "none"
            else:
                a = lo if lo is not None else hi
                b = hi if hi is not None else lo
                mid = (a + b) / 2
                is_point = (a == b)
                rel = "point_estimate" if is_point else "range"

            w.writerow({
                "job_title": title,
                "role_family": role_family(title),
                "company": (r.get("company") or "").strip(),
                "country": (r.get("country") or "").strip(),
                "city": canon_city(r.get("city")),
                "salary_min": "" if lo is None else f"{lo:.0f}",
                "salary_max": "" if hi is None else f"{hi:.0f}",
                "salary_mid": "" if mid is None else f"{mid:.0f}",
                "salary_is_point": "true" if is_point else "false",
                "salary_reliability": rel,
                "currency": (r.get("currency") or "").strip(),
                "remote_type": (r.get("remote_type") or "").strip(),
                "experience_level": (r.get("experience_level") or "").strip(),
                "skills_list": (r.get("required_skills") or "").strip(),
                "is_intern": "true" if INTERN_RE.search(title) else "false",
                "is_dup_req": "true" if r["_dup"] else "false",
                "posted_date": (r.get("posted_date") or "").strip(),
                "source": (r.get("source") or "").strip(),
            })

    print(f"wrote {DST} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
