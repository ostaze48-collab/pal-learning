from __future__ import annotations

from ..schemas.factory import GeneratedLessonPayload


def _interaction_requirement(title: str | None) -> set[str]:
    """Infer only explicit interaction requirements encoded in approved stage labels.

    We intentionally keep this narrow: a blueprint stage that explicitly says
    "قارن وصنّف" must contain a compare/classify interaction. Other pedagogical
    wording remains an academic-QA concern rather than a brittle machine rule.
    """
    value = (title or '').replace('ّ', '')
    if 'قارن' in value and 'صنف' in value:
        return {'CLASSIFY', 'COMPARE_GRID'}
    return set()


def _validate_visual_assets(packet: dict, payload: GeneratedLessonPayload) -> dict:
    """Fail closed: AI may only reference visual assets supplied by the server.

    The model is never trusted to invent a textbook image URL, page number, source
    label, asset kind, or rights decision. An IMAGE block must exactly match a
    CLEARED asset from packet.visual_assets. Staging/admin tooling may keep
    REVIEW_REQUIRED assets separately, but they are not generation-authorized.
    """
    approved = packet.get('visual_assets') or []
    approved_keys = {
        (
            asset.get('src'),
            asset.get('source_page'),
            asset.get('source_label'),
            asset.get('asset_kind'),
        )
        for asset in approved
        if asset.get('rights_status') == 'CLEARED' and asset.get('src')
    }
    checks = []
    valid = True
    for section_index, section in enumerate(payload.sections):
        for block_index, block in enumerate(section.blocks):
            if block.block_type != 'IMAGE':
                continue
            content = block.content or {}
            key = (
                content.get('src'),
                content.get('source_page'),
                content.get('source_label'),
                content.get('asset_kind'),
            )
            passed = content.get('rights_status') == 'CLEARED' and key in approved_keys
            valid = valid and passed
            checks.append({
                'section_index': section_index,
                'block_index': block_index,
                'source_page': content.get('source_page'),
                'source_label': content.get('source_label'),
                'asset_kind': content.get('asset_kind'),
                'rights_status': content.get('rights_status'),
                'passed': passed,
            })
    return {
        'valid': valid,
        'image_block_count': len(checks),
        'approved_visual_asset_count': len(approved_keys),
        'checks': checks,
    }


def validate_section_blueprint(packet: dict, payload: GeneratedLessonPayload) -> dict:
    """Validate machine-enforceable parts of an approved pedagogical blueprint.

    The generator may phrase a section title slightly differently while preserving
    pedagogical intent, so this gate enforces slot count/order and any interaction
    requirement explicitly encoded in the approved blueprint label. Semantic/title
    alignment remains an academic QA task.
    """
    blueprint = packet.get('section_blueprint') or []
    actual_sections = payload.sections
    expected_count = len(blueprint)
    actual_count = len(actual_sections)
    enforced = bool(blueprint)
    count_matches = (not enforced) or expected_count == actual_count

    interaction_checks = []
    interactions_match = True
    for index, row in enumerate(blueprint):
        required = _interaction_requirement(row.get('title'))
        if not required:
            continue
        actual_types = {
            block.block_type
            for block in actual_sections[index].blocks
        } if index < actual_count else set()
        passed = bool(required & actual_types)
        interactions_match = interactions_match and passed
        interaction_checks.append({
            'section_index': index,
            'section_number': row.get('section_number'),
            'blueprint_title': row.get('title'),
            'allowed_block_types': sorted(required),
            'actual_block_types': sorted(actual_types),
            'passed': passed,
        })

    visual_assets = _validate_visual_assets(packet, payload)
    valid = count_matches and interactions_match and visual_assets['valid']
    if not count_matches:
        reason = 'SECTION_COUNT_DOES_NOT_MATCH_APPROVED_BLUEPRINT'
    elif not interactions_match:
        reason = 'REQUIRED_BLUEPRINT_INTERACTION_MISSING'
    elif not visual_assets['valid']:
        reason = 'IMAGE_BLOCK_NOT_BACKED_BY_APPROVED_VISUAL_ASSET'
    else:
        reason = None

    return {
        'enforced': enforced,
        'valid': valid,
        'expected_count': expected_count,
        'actual_count': actual_count,
        'expected_sections': [
            {
                'section_number': row.get('section_number'),
                'title': row.get('title'),
                'order_no': row.get('order_no'),
            }
            for row in blueprint
        ],
        'actual_titles': [section.title for section in actual_sections],
        'interaction_requirements': interaction_checks,
        'interaction_requirements_pass': interactions_match,
        'visual_assets': visual_assets,
        'reason': reason,
        'semantic_title_alignment_requires_qa': enforced,
    }
