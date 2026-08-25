# What the AI job market looks like right now, and how much to trust it

**Case study writeup**

> **TODO before submitting:** add your initial sketches (see "Process" below), paste the
> exact Kaggle dataset URL where marked, and delete these note blocks.

---

## Audience and their questions

**Audience:** someone weighing a move into AI. A career switcher, a new graduate, or an
adjacent engineer deciding which AI role to aim at.

They arrive with four practical questions and one they do not know to ask:

1. **What does each AI role actually pay?**
2. **Which roles are really hiring**, as opposed to looking busy?
3. **Where are those jobs?**
4. **What seniority do employers want?**

The unasked question is the one this project is built around: **how much of this can I
believe?** A scraped job board is a noisy, biased instrument. Someone making a career
decision on it deserves to see where it is weak. That is why trustworthiness is a
first-class part of the interface rather than a footnote.

## User tasks

- **Compare** median pay across role families within one country.
- **Judge the evidence** behind any comparison before acting on it (how many salaries,
  estimated or posted).
- **Filter** to one role family and follow it across pay, demand, location, and seniority.
- **Toggle** the data-hygiene rule to see how much of the apparent demand is an artifact.
- **Switch** country and see the whole picture re-scope.
- **Read exact values** via a table view on every chart.

## Dataset and source

- **Source:** Kaggle, `[PASTE EXACT DATASET NAME + URL HERE]`
- **Original collection:** aggregated from the **Adzuna** job-search API and **USAJobs**.
- **Snapshot:** February 2026. 5,773 live postings across the United States, United
  Kingdom, Canada, Australia, and Germany.
- **Raw fields:** job title, company, country, city, salary min/max, currency, remote
  type, experience level, required skills, posted date, source, job description.
- **Working file:** `ai_jobs_clean.csv`, produced from the raw export by `clean_jobs.py`
  (deterministic, re-runnable).

### What I derived, and why

The raw export could not answer the questions above on its own. `clean_jobs.py` adds
seven fields:

| Derived field | How | Why it was needed |
|---|---|---|
| `role_family` | keyword rules on job title | 5,700 free-text titles are not a category. Nothing can be compared without this. |
| `is_dup_req` | same employer + title + description | The same req is re-listed per city, inflating demand ~25%. |
| `is_intern` | `\bintern\b` on title | Internship pay would drag every median down. |
| `salary_mid` / `salary_is_point` / `salary_reliability` | from min/max | Distinguishes a real posted range from a single guessed number. |
| `skills_list` | from `required_skills` | To measure how often skills are absent (81%). |
| `city` (normalized) | placeholder + district rollup | See "Where the data lied" below. |

I also dropped `job_description` from the working file. The page never reads it and it
was 95% of the bytes (3.9 MB to 1.0 MB), which matters for a browser fetch.

## Design decisions

**Four coordinated views, one filter row.** Pay, Demand, Where, Who. Country and the
hygiene toggle scope everything; clicking a role family in Pay or Demand cross-filters
Where and Who. One shared scope means the numbers always agree.

**A dot plot, not a bar chart, for pay.** Salary is a distribution, not a magnitude from
zero. The dot is the median and the line spans the 25th to 75th percentile, so the reader
sees spread rather than a single authoritative-looking bar. Bars would have implied a
precision the data does not have.

**Sorted by value, not alphabetically.** Rank is the comparison the reader wants.

**One hue, used sequentially.** A single blue carries the marks. The only ramp is the
ordered blue used for experience level (Junior to Management), which is a genuinely
ordinal variable, so a light-to-dark sequence encodes its order. No categorical rainbow,
because no variable here is categorical in a way that needs one.

**Data-driven headlines.** Every chart title is generated from the current slice
("In the United States, AI Software Engineer pays the highest median at $171k"). Change
the country and the sentence rewrites itself, so the narrative can never drift from the
data underneath it.

## Treatment of uncertainty

This is where most of the design effort went.

- **`n` is exposed on every row**, under the heading "SALARIES BEHIND IT", because the
  number of postings and the number of *salaries* are different quantities.
- **Rows with fewer than 20 salaries are dimmed and tagged `THIN DATA`.** They are still
  shown, because hiding them would misrepresent the market. A median from 5 postings is
  displayed as visually weaker rather than deleted.
- **Salary provenance is stated.** 74% of figures are a single predicted number from
  Adzuna, not an employer-posted range. The caption says so, and the tooltip reports the
  share per role.
- **The hygiene filter is a visible toggle, not a silent cleaning step.** Turning it off
  shows the repeat listings as a pale extension on each bar, so the reader sees exactly
  what was removed and can disagree with the choice.
- **Coverage warnings fire automatically** where salary coverage is thin.

### Two comparisons I deliberately refused

**No time trend.** The data has a `posted_date`, so a postings-over-time line was easy
and tempting. It would have been wrong. Expired listings are already gone from a
snapshot, so counting by date measures *how long listings survive*, not hiring growth.
The apparent trend would be pure survivorship bias. I left it out and say why.

**No cross-country salary comparison.** The `currency` column labels every row USD, but
the non-US figures track local currency. Worse, salary coverage collapses outside the US
and UK:

| Country | Postings with a salary |
|---|---|
| United States | 900 of 904 (100%) |
| United Kingdom | 1,015 of 1,016 (100%) |
| Canada | 184 of 928 (20%) |
| Australia | 62 of 608 (10%) |
| Germany | 59 of 733 (8%) |

Country is therefore a *filter*, never a series. Putting German and US medians on one
axis would produce a clean, confident, meaningless chart.

## Process, testing, and revision

> **TODO:** insert your initial sketches here (photo or scan). Even rough paper sketches
> of the four-view layout satisfy this and are explicitly graded.

I tested the built page by driving it in a headless browser rather than by eyeballing it.
Four revisions came out of that, and they are the substance of the process:

**1. The cross-filter looked broken, and was not.** Clicking a role appeared to do
nothing. Instrumenting the page showed the filter firing correctly across all 138
role x country x hygiene combinations. The real problem was geometry: at a 1200x633
viewport the charts being filtered sat **three screens below the fold**, so every visible
pixel stayed the same. Fix: an active-filter chip in the filter row, a smooth scroll to
the affected cards, and a brief ring on them. *A correct state change that the user
cannot perceive is a broken feature.*

**2. The location chart was reporting a fiction.** The top "city" in the United States
was literally `US`, because the feed writes a country name into the city column when no
city is given. The same held for `UK` (178) and `Deutschland` (181). London was split
four ways across `London`, `The City`, `Farringdon`, and `Paddington`; Washington DC was
split across two spellings. After normalization London reads 661 instead of 514 and
Washington DC 35 instead of 21. The chart now excludes country-only rows and states the
count it dropped.

**3. The `n` column had no heading**, so `n = 21` read as an unexplained number. Added
"SALARIES BEHIND IT".

**4. The load animation could have shipped a blank page.** The entrance used
`animation-fill-mode: both`, which holds the opening frame (opacity 0) through the delay.
A test showed 0 of 4 cards opaque when animations did not tick. The classes are now
stripped after 1.8s, so the content is visible whether or not the animation runs.

## Accessibility and usability

- **Keyboard operable.** Every chart row is focusable with a visible focus ring and
  responds to Enter and Space.
- **A table view on every chart**, so no value is reachable only by hovering.
- **Screen-reader labels** on each row carry the role, median, range, and `n`, plus the
  thin-data flag.
- **Never color alone.** Thin data is marked by dimming *and* a `THIN DATA` text tag.
  Every bar carries a direct numeric label.
- **Light and dark themes**, each with its own palette rather than an inverted one.
- **`prefers-reduced-motion` is honored**: entrance animation, the flash, and the smooth
  scroll all collapse to instant.

**On the palette, honestly:** running the categorical validator against the blue ramp
returns FAIL on adjacent-pair separation. That result does not apply here, and the
validator says so in its own scope note: those checks are for categorical palettes, and
this ramp is used sequentially for an ordered variable, where its lightness is correctly
monotonic (0.905, 0.812, 0.717, ..., 0.433). The one finding that does apply is that the
darkest step sits at **2.15:1** against the dark surface, below the 3:1 threshold. That
obligates relief, which is present: every bar is directly labeled and a table view exists.

## Tools

| Purpose | Tool |
|---|---|
| Data cleaning and derivation | Python 3 (`csv`, `re`), no external libraries |
| Visualization | Hand-written HTML, CSS, and vanilla JavaScript; SVG drawn directly |
| Testing | Headless Chrome (DOM instrumentation, exhaustive state sweep, screenshots) |
| AI assistance | Claude (Claude Code) for the cleaning script, chart code, and debugging |
| Hosting | GitHub Pages |

No charting library. The dot plot with a thin-data treatment, the stacked
counted-vs-removed demand bar, and the generated headlines were all specific enough to
this dataset that writing the SVG directly was simpler than fighting a library's defaults.

## Known limitations

- Salary figures are Adzuna estimates, not employer-posted pay. Treat them as directional.
- Role families come from keyword rules on titles; **13.6% could not be classified** and
  are shown as "Other / Unclassified" rather than hidden.
- District rollup is partial. Only unambiguous names were folded in. Ambiguous ones
  (`Mitte`, `Five Points`) belong to several cities and were left alone, so `Mitte` still
  appears as its own 22-posting "city" in Germany.
- Experience level was inferred from the job title by the dataset author, not stated by
  employers.
- One February 2026 snapshot. Nothing here supports a claim about change over time.
