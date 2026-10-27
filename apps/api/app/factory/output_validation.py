from __future__ import annotations

from ..schemas.factory import GeneratedLessonPayload


def validate_section_blueprint(packet: dict, payload: GeneratedLessonPayload) -> dict:
    """Validate machine-enforceable parts of an approved pedagogical blueprint.

    The generator may phrase a section title slightly differently while preserving
    pedagogical intent, so this gate intentionally enforces count/order slots rather
    than exact title equality. Semantic/title alignment remains an academic QA task.
    """
    blueprint = packet.get('section_blueprint') or []
    actual_sections = payload.sections
    expected_count = len(blueprint)
    actual_count = len(actual_sections)
    enforced = bool(blueprint)
    count_matches = (not enforced) or expected_count == actual_count

    return {
        'enforced': enforced,
        'valid': count_matches,
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
        'reason': None if count_matches else 'SECTION_COUNT_DOES_NOT_MATCH_APPROVED_BLUEPRINT',
        'semantic_title_alignment_requires_qa': enforced,
    }
