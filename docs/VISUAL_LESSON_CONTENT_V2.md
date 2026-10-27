# Visual Lesson Content V2

## Goal
Move student lessons from text-card-heavy presentation to a visual-first learning experience grounded in the approved textbook/source material.

## Core rule
For a concept that is inherently visual, the preferred sequence is:

**Source visual → focused observation → concise explanation → interaction → check-for-understanding**

Long explanatory paragraphs are a fallback, not the default.

## Textbook image policy
Use textbook figures/images when reuse rights are verified for the platform. Do not republish whole textbook pages merely for convenience. Prefer figure-level crops with page/source attribution. If reuse rights are not verified, keep the source page as a private reference and use a redrawn/independently produced educational diagram instead.

Every visual asset must carry provenance metadata:

- `source_file_id`
- `source_page`
- `asset_kind`: `TEXTBOOK_FIGURE | TEXTBOOK_PHOTO | REDRAW | PLATFORM_ORIGINAL`
- `rights_status`: `VERIFIED_REUSE | INTERNAL_REFERENCE_ONLY | REDRAW_REQUIRED | PLATFORM_OWNED`
- `alt_text`
- `caption`
- `low_data_url` when available

## Student-facing visual block
An `IMAGE` block should support:

```json
{
  "url": "/assets/...",
  "low_data_url": "/assets/...",
  "alt_text": "...",
  "caption": "...",
  "source_label": "كتاب العلوم والحياة",
  "source_page": 12,
  "asset_kind": "TEXTBOOK_FIGURE",
  "rights_status": "VERIFIED_REUSE",
  "zoom_enabled": true,
  "hotspots": [
    {"x": 52, "y": 28, "label": "...", "explanation": "..."}
  ]
}
```

## Explanation standard
Every explanation card should answer, in this order:

1. **What am I looking at?** — one sentence.
2. **What should I notice?** — 1–3 visual cues.
3. **Why does it matter?** — one concise scientific explanation.
4. **Try it** — one interaction/question.

Target: 40–90 Arabic words per explanatory unit unless the concept genuinely needs more.

## Visual modes

### 1. Observe
Show the source image with no answer overlay first. Ask the learner to notice a feature.

### 2. Reveal
Add labels, arrows, highlights, or hotspots after the learner responds.

### 3. Compare
Place two source/redrawn visuals side-by-side and ask the learner to compare before showing the explanation.

### 4. Build
Reveal a diagram layer-by-layer rather than showing all labels at once.

### 5. Apply
Use the same visual in a classification, matching, hotspot, sequencing, or reasoning task.

## Science lesson default rhythm

1. Curiosity visual
2. Observe
3. Predict
4. Source figure / diagram
5. Short explanation
6. Interactive manipulation
7. Compare / classify
8. Visual summary
9. Mastery challenge

## Mobile design
- One dominant visual per screen.
- Image area may use 55–70% of the viewport when central to the concept.
- Pinch/zoom or tap-to-zoom for detailed textbook figures.
- Hotspots must be at least 44 px touch targets.
- Captions stay short; extended explanation opens progressively.
- Low-data mode loads compressed images and avoids autoplay media.

## AI generation contract
When approved visual assets are available for the lesson, the generator should prefer an `IMAGE`, `CLASSIFY`, `COMPARE_GRID`, `MATCHING`, or other visual interaction over a plain `TEXT` block for visual concepts.

The AI must never invent a textbook figure URL. Asset identifiers must come from the source-asset registry.

## Source ingestion roadmap
The current importer extracts PDF text. V2 must add a visual asset pipeline:

1. Render approved PDF pages to images.
2. Register page images privately with source provenance.
3. Identify candidate figures/diagrams/photos.
4. Crop or redraw according to rights status.
5. Create responsive WebP/AVIF derivatives.
6. Link assets to source chunks and lesson sections.
7. Human/admin preview before publication.

## Acceptance criteria
A science lesson is not considered Visual V2-ready unless:

- at least one meaningful visual exists for every visual concept;
- no long text block is used where a diagram or interaction communicates the idea better;
- every published image has alt text and provenance;
- textbook-derived visuals have an explicit rights status;
- low-data mode has a valid fallback;
- explanations are concise and tied directly to what the learner sees.
