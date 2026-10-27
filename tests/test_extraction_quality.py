from types import SimpleNamespace

from app.importer.router import calculate_package_scores, select_primary_teaching_source
from app.services.document_importer import ExtractedDocument, assess_extraction_quality


def document(pages, method='PDF_TEXT'):
    return ExtractedDocument(
        text='\n\n'.join(x for x in pages if x),
        pages=pages,
        page_count=len(pages),
        checksum='demo',
        extraction_method=method,
        warnings=[],
    )


def source(source_type, text, status, reliability=100, edition_match=100, row_id=1):
    return SimpleNamespace(
        id=row_id,
        source_type=source_type,
        extracted_text=text,
        status=status,
        reliability_score=reliability,
        edition_match_score=edition_match,
    )


def test_sparse_pdf_is_routed_to_vision_review():
    doc = document([
        'صفحة نصية تحتوي على شرح كافٍ للجهاز الهيكلي ووظائفه الأساسية في جسم الإنسان.',
        '', '', '', '',
    ])
    quality = assess_extraction_quality(doc)
    assert quality.text_page_count == 1
    assert quality.text_coverage_percent == 20.0
    assert quality.needs_vision is True


def test_text_rich_pdf_is_usable_without_vision_review():
    page = 'شرح علمي موثق من المنهاج الفلسطيني عن الجهاز الهيكلي ووظائفه ومكوناته الأساسية. ' * 3
    quality = assess_extraction_quality(document([page, page, page, page]))
    assert quality.text_coverage_percent == 100.0
    assert quality.average_characters_per_page >= 40
    assert quality.needs_vision is False


def test_plain_text_source_is_not_sent_to_vision_review_when_short():
    quality = assess_extraction_quality(document(['درس الجهاز الهيكلي'], method='UTF8_TEXT'))
    assert quality.needs_vision is False


def test_needs_vision_source_counts_for_coverage_but_not_verified_quality():
    scanned = source('OFFICIAL_PACKAGE', 'partial text', 'NEEDS_VISION', 100, 100)
    coverage, quality = calculate_package_scores([scanned])
    assert coverage == 20.0
    assert quality == 0.0


def test_needs_vision_official_package_cannot_override_usable_student_book():
    official_scan = source('OFFICIAL_PACKAGE', 'partial scan text', 'NEEDS_VISION', 100, 100, 10)
    student_book = source('STUDENT_BOOK', 'usable student book text', 'EXTRACTED', 90, 90, 20)
    assert select_primary_teaching_source([official_scan, student_book]) is student_book
