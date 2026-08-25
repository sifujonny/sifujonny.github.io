# What the AI job market looks like right now, and how much to trust it

An interactive dashboard of 5,773 AI job postings across five countries, built for
someone weighing a move into AI. Four coordinated views (Pay, Demand, Where, Who) share
a country filter, a data-hygiene toggle, and a role-family cross-filter.

**Live version:** `https://sifujonny.github.io/projects/ai-jobs-dashboard/`

See [CASE_STUDY.md](CASE_STUDY.md) for the full writeup: audience, design decisions,
uncertainty, and revisions.

## Files

| File | What it is |
|---|---|
| `index.html` | The visualization. Hand-written HTML/CSS/JS, no libraries. |
| `ai_jobs_clean.csv` | Working dataset the page loads (1.0 MB). |
| `clean_jobs.py` | Builds the working dataset from the raw Kaggle export. |
| `CASE_STUDY.md` | Writeup: audience, design decisions, uncertainty, revisions. |

The raw source export (`ai_jobs_global.csv`, 3.9 MB) is not included here to keep the
repo light; see "Data source" below for where to get it. `clean_jobs.py` regenerates
`ai_jobs_clean.csv` from it if you need to re-run the pipeline.

## Running it locally

The page loads its data with `fetch()`, so it **must be served over HTTP**. Opening
`index.html` by double-clicking it will fail with a `file://` error (the page tells you
so if this happens).

```bash
cd projects/ai-jobs-dashboard
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Regenerating the working dataset

```bash
python3 clean_jobs.py <raw_input.csv> ai_jobs_clean.csv
```

Output is deterministic: the same input produces a byte-identical file. See
`CASE_STUDY.md` for what the script derives and why.

## Data source

Kaggle: `[PASTE EXACT DATASET NAME + URL HERE]`, aggregated from the Adzuna job-search
API and USAJobs. February 2026 snapshot covering the United States, United Kingdom,
Canada, Australia, and Germany.

Salary figures are **Adzuna estimates, not employer-posted pay**; 74% are a single
predicted number rather than a posted range. See `CASE_STUDY.md` for the full treatment
of limitations.

## Browser support

Any current desktop browser. Uses `prefers-color-scheme` for theming and honors
`prefers-reduced-motion`.
