# Cargo Passport v3 — adversarial video review

Reviewed: `brag-output/v3/brag.mp4` (30 seconds, 1920×1080, 30 fps).

## Verdict

Visually coherent concept trailer; weak demonstration of the product's core value. It names the team, challenge, product and roadmap, but never demonstrates a reviewer tracing one item-specific claim to an actual test. A skeptical judge could leave thinking this is a polished material inventory attached to a space map.

The strongest next version should prove one evidence comparison, rather than introduce more features.

## Findings, in priority order

### 1. The central evidence labels imply more than the evidence establishes — high

**14.6–20.2s:** green `TESTED` badges sit beside “Instrument case · PMMA” and “Stowage bag · SIBAL.” The experiments tested specimens; this does not establish that these illustrative assembled items were tested. Green also suggests acceptance before viewers can read the caveat at the bottom.

The same screen highlights only “No 1/6 g data” for those rows. That understates applicability questions: oxygen, pressure, airflow, geometry and configuration also matter. The repository research brief reports BASS-II at 14–22% oxygen, while this destination is 30% oxygen.

**Fix:** show one item with “Related material test,” its experiment/run identifier, test conditions, destination conditions and unresolved differences. Use neutral evidence labels. Keep the distinction between specimen evidence and item approval visible in the main content.

**Judge's challenge:** “Was this case tested, or did you find an experiment using acrylic?”

### 2. The video substitutes material inventory for the documented product — high

**5.2–10s:** “Every shipment lists each item, and what it's made of” could describe an ordinary manifest. `docs/cargo-passport.md` defines the value around a specific configuration, intended operation, ignition sources and traceable supporting evidence. None of those distinctions is demonstrated.

**Fix:** follow one battery-powered instrument into one environment. Show a concrete result: “Casing evidence found; battery propagation evidence still missing.” Show the source and the condition mismatch that produced that finding.

**Judge's challenge:** “What does your passport tell me that a spreadsheet of materials does not?”

### 3. Current capability and illustrative UI are not clearly separated — high

**10–14.6s:** the map is explicitly called “TEAM PROTOTYPE.” The more persuasive evidence dashboard that follows is an authored animation, yet receives no equally prominent “illustrative UI” label. The description labels the shipment illustrative, but that does not tell an audience whether matching and evidence retrieval actually work.

The product document states that no passport implementation or predictive model has been established. The video should state what is working today and what is proposed.

**Fix:** label the evidence view “Proposed evidence view,” unless the team can replace it with a verified capture of working behavior. Make one current achievement explicit.

**Judge's challenge:** “Which part can you demonstrate live?”

### 4. The decisive screen is too dense for its available time — medium

**14.6–20.2s:** four rows, three columns, experiment acronyms, atmospheric conditions and a disclaimer compete with narration. The last row finishes entering around 17.45s; fade-out starts at 19.9s, leaving about 2.45 seconds with the complete table fully revealed. At 640-pixel playback width, 22–24px source labels become roughly 7–8px.

**Fix:** reduce to one comparison and one large takeaway. Let secondary detail live in the linked project page. Make the important limitation readable without pausing.

### 5. The map demonstrates breadth, not a decision — medium

**10–14.6s:** a screenshot zooms toward the Moon base. The narration promises comparison at every stop, but no condition comparison or changed evidence finding is shown. The graph introduces many routes without establishing why one matters.

**Fix:** show Earth → Moon with two condition cards, then carry the changed conditions directly into the evidence comparison. Retain the graph only if navigation itself is the point.

### 6. The future model gets attention before the current value is proven — medium

**20.2–25.9s:** the blue flame is correctly labelled “Concept animation · hypothesis, not a result.” However, “predict the flame” becomes the most memorable technical promise. “Extend to Moon & Mars” compresses a separate validation problem into a roadmap step. Orbital microgravity validation does not validate partial-gravity predictions.

**Fix:** prioritize “Validate against held-out NASA runs.” Describe partial gravity as a separate research question, not an automatic extension. Shorten this beat if it buys time for the evidence demonstration.

### 7. Several small credibility gaps are easy to remove — medium

- **Battery row:** “Not in PSI” is a catalogue-wide assertion; the video does not establish an exhaustive search. Prefer “No matching evidence in selected datasets.”
- **QR graphics:** the composition generates random QR-like cells, rather than encoding a destination. Narration says “Scan it,” but no functioning scan is demonstrated. Use a real code if scanning is part of the claim, or avoid implying the decorative code works.
- **Opening:** “In space, there's no fire department” is memorable, but the team slate does not visually support the problem. Pair the hook with the actual decision: evidence from Earth or orbit may not cover the intended environment.
- **Closing:** “Know what flies” can suggest authority to accept cargo. “Know the evidence. See the gaps.” better reflects the documented scope.

## Keep

The consistent typography and palette, clear team/challenge attribution, actual prototype screenshot, explicit future/concept label, and refusal to invent numerical risk scores are worth retaining. The evidence-gap premise is stronger than the generic flame-prediction promise.

## Smallest useful revision

Keep the overall structure if submission rules require it. Replace the four-item inventory and four-row table with one continuous item story: identify the item → choose its destination → open a real source → expose a mismatch → name the missing evidence. Reallocate time from the map and future animation. Do not add more scenes.

## Verification and limits

Inspected fresh frames extracted from the supplied MP4, the existing scene snapshots, composition source, narration plan, voice-file durations, product document and research brief. Decoded the full MP4 successfully. Confirmed 30.00s video/audio duration, H.264/AAC, and embedded synthetic-media disclosure. Measured audio at approximately −18.1 LUFS integrated and −1.1 dBTP; those measurements do not establish speech intelligibility or subjective mix quality.

Voice-file timing fits the planned scenes; final speech file ends around 28.34s, before the mix fade starts at 28.5s. No listening-based judgment of delivery, pronunciation or music balance is claimed. No official submission guide was located, so compliance with its timing, attribution and disclosure rules remains unverified. Material/run applicability was challenged against repository documentation, not independently revalidated against NASA source records.

The requested `docs/brag-video-review` did not exist at review time; this Markdown file records the critique. The MP4 and composition were not changed.
