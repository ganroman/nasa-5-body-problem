# Submission form draft (T15)

Draft text for the NASA Space Apps 2026 form. **Only facts that exist in this repo or the public Hantok README.** Items marked `TODO(Roman)` must come from the team, not from SI. Lengths of form fields are unknown: trim as needed.

## Name
Cargo Passport

## Team
Five-Body Problem · Challenge: Flame in Freefall

## Summary
A passport for space cargo: what it is made of, which NASA fire experiments apply where it is going, and what is still untested. Cargo Passport compares NASA PSI combustion evidence with the conditions of each stop on a cargo route and keeps gaps visible. It organises evidence for people to review; it is not a safety verdict.

## Detailed description
Flames behave differently in microgravity: hot gases do not rise, so oxygen, airflow and materials decide how a fire spreads. NASA has run hundreds of combustion experiments, but each result holds only for the conditions it was tested in. A bag tested on the ISS at 21% O₂ tells little about a lunar habitat scenario at 30% O₂ and 1/6 g. Today that gap is invisible to the people who pack, ship and store cargo.

Cargo Passport gives every shipment a passport behind one QR code:
- Each cargo item and its materials, matched to NASA PSI experiments (BASS, BASS-II, SAFFIRE, FLEX, SAME, ACME and more) and to curated NASA sources (NASA-STD-6001, NTRS papers).
- A route view (Earth, ISS, Moon, Mars) that compares oxygen, pressure and gravity at every stop.
- An evidence comparison per material: what matches the target environment, what differs, what is unknown. Where there is no evidence the passport says so.
- An SI explanation of the findings with sources. SI does not invent results and does not give emergency instructions.
- The same method works on Earth wherever cargo moves into new conditions: aircraft holds, submarines, battery storage, schools.

Not a safety verdict: Cargo Passport organises evidence for review and does not approve cargo for flight. The shipment in the video is illustrative. Unknown values stay "unknown" (for example the cabin atmosphere of a planned lunar base); the 30% O₂, about 0.69 atm lunar case is a scenario taken from the challenge brief, not a base specification.

How it works: (1) Evidence: NASA PSI experiments, drop-tower tests and material data. (2) SI assesses: compares test conditions with the cargo's journey and explains with sources. (3) People decide: how to ship, where to store, what to test next.

Hook / one-line pitch: `TODO(Roman)` (must come from the team)

## Links
- Demo video (30 s): `TODO(Roman)` upload link
- Final project link: https://github.com/Hantok/cargo-passport
- Live demo: https://cargo.qwadratic.me
- Team repo: https://github.com/ganroman/nasa-5-body-problem

## Use of SI (disclosure)
- The video narration is synthetic speech (Kokoro-82M text-to-speech). The video music is synthesized.
- The video visuals and the images in the README (hero image, team image) were produced with SI assistance. Every video frame and both images carry a visible "SI-assisted" watermark.
- The app's "Explain" feature uses an SI model (Eustella AI) to explain the computed evidence comparison with sources. The comparison itself is computed in code from NASA data.
- The idea, the concept and the claims come from the team. The hook line is written by the team.
- Parts of the code were written with SI coding assistants (Claude Code and others) and reviewed by the team. `TODO(Roman)`: confirm this sentence is accurate for the team.

## NASA data used
NASA Physical Sciences Informatics (PSI), https://psi.nasa.gov/ , 24 investigation records and 20 experimental tables (in `data/`):
- PSI-10 · ACME/Flame Design · https://doi.org/10.60555/w4zy-bt45
- PSI-20 · ACME BRE · https://doi.org/10.60555/vb93-3y72
- PSI-21 · ACME CLD Flame · https://doi.org/10.60555/23e1-9950
- PSI-22 · ACME E-FIELD Flames · https://doi.org/10.60555/se5a-8c73
- PSI-23 · ACME s-Flame · https://doi.org/10.60555/k57n-p030
- PSI-25 · BASS-II · https://doi.org/10.60555/4qc4-de67
- PSI-26 · BASS · https://doi.org/10.60555/58h4-dy80
- PSI-39 · CFI · https://doi.org/10.60555/m6pj-a914
- PSI-47 · DAFT / DAFT-2 · https://doi.org/10.60555/ztgj-d202
- PSI-60 · Computational and Experimental Analysis of SPICE Data Sets · https://doi.org/10.60555/mzjm-yv57
- PSI-62 · Concurrent Flame Spread Modeling using Flamelet Generated Ma · https://doi.org/10.60555/e9xp-ex83
- PSI-68 · FLEX-2 · https://doi.org/10.60555/byp8-h018
- PSI-69 · FLEX · https://doi.org/10.60555/mbq8-0451
- PSI-98 · SAFFIRE-I · https://doi.org/10.60555/0t15-1z43
- PSI-99 · SAFFIRE-II · https://doi.org/10.60555/2chp-m469
- PSI-100 · SAFFIRE-III · https://doi.org/10.60555/040q-4h36
- PSI-101 · SAME-R · https://doi.org/10.60555/2np7-jv14
- PSI-102 · SAME · https://doi.org/10.60555/gd4k-8h62
- PSI-106 · SLICE · https://doi.org/10.60555/pm12-rg61
- PSI-107 · SPICE · https://doi.org/10.60555/9kbh-e962
- PSI-115 · Utilization of the Smoke Aerosol Measurement Experiment Data · https://doi.org/10.60555/q0v5-1v28
- PSI-117 · Effect of External Thermo-Convective Perturbation on Cool Fl · https://doi.org/10.60555/gz0q-b577
- PSI-142 · Quantitative Studies of Cool Flame Transitions at Radiation  · https://doi.org/10.60555/80qf-vj95
- PSI-159 · ACME CFI-G · https://doi.org/10.60555/cyt1-kh64

Also: NASA-STD-6001, NASA MAPTIS (reference), NTRS papers (Hirsch 2006/2007/2010, Olson 2014, Urban & Ruff 2016, NTRS 20150022123), NASA TB 26-05, SSP 51721, JSC 20793 Rev D, OCHMO-TB-008. Exact URLs: `backend/seed/sources.yaml`.

## References and credits
- NASA PSI, https://psi.nasa.gov/physci/repo/search?q=combustion
- ZARM Bremen flame-spread dataset, https://zenodo.org/records/18479713
- NASA MAPTIS, https://maptis.nasa.gov/
- Kokoro-82M (text-to-speech)
- HyperFrames (video composition) and GSAP (animation)
- Fonts: Space Grotesk, JetBrains Mono
- Eustella AI (SI explanations)
- FastAPI, PostgreSQL (backend)

## Checkboxes
Terms and Originality: ticked by Roman's confirmation in chat, then submitted by Claude via the browser (T18).
