from app.services.document_importer import edition_match_score, normalize_heading


def test_exact_target_year_and_title_score_high():
    text = 'كتاب العلوم والحياة للصف الخامس - طبعة 2026'
    assert edition_match_score(text, '2026', 'العلوم والحياة') >= 90


def test_old_year_with_same_title_does_not_look_current():
    text = 'كتاب العلوم والحياة للصف الخامس - طبعة 2021'
    score = edition_match_score(text, '2026', 'العلوم والحياة')
    assert score <= 30


def test_arabic_indic_year_digits_are_normalized():
    text = 'العلوم والحياة - طبعة ٢٠٢٦'
    assert '2026' in normalize_heading(text)
    assert edition_match_score(text, '2026', 'العلوم والحياة') >= 90


def test_extractable_text_gets_no_automatic_edition_credit():
    assert edition_match_score('مادة تعليمية بلا سنة', '2026', None) == 0
