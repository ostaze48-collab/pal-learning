# Next stage — Textbook Visual Asset Extraction

After Visual Lesson Content V2 is merged, the importer must create approved visual asset records from verified textbook PDFs.

Target metadata per asset:

- source_file_id
- source_page
- asset_kind
- src
- low_data_src
- alt_text
- caption
- rights_status
- hotspots

Rules:

1. Extraction never grants rights automatically; new textbook visuals start as `REVIEW_REQUIRED`.
2. Only Admin-cleared assets enter generation packet `visual_assets`.
3. Assets are limited to pages already linked to the lesson's verified teaching source chunks.
4. AI cannot create or move hotspots; hotspot coordinates are reviewed visual metadata.
5. A learner-facing release is blocked while any IMAGE block has unresolved rights.
