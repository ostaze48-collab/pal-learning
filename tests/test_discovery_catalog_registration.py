import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import SourceFile, SourcePackage
from app.importer.discovery_catalog import (
    S1_WORKSHEET_URL,
    register_verified_direct_discovery,
)


def _session():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    db.add(SourcePackage(book_id=999, package_code='PS-G05-SCI-S1-2026', status='DISCOVERED'))
    db.commit()
    return db


def test_verified_official_direct_file_can_be_registered_idempotently():
    with _session() as db:
        first = register_verified_direct_discovery('PS.G05.SCI.S1.U01.L01.WORKSHEET.2024.OFFICIAL', db)
        assert first['created'] is True
        assert first['source_type'] == 'WORKSHEET'
        assert first['source_url'] == S1_WORKSHEET_URL
        assert first['factual_grounding_authorized'] is False
        assert first['next_action'].endswith('/fetch-registered')

        second = register_verified_direct_discovery('PS.G05.SCI.S1.U01.L01.WORKSHEET.2024.OFFICIAL', db)
        assert second['created'] is False
        assert second['source_file_id'] == first['source_file_id']
        assert db.query(SourceFile).count() == 1


def test_secondary_index_student_book_cannot_be_auto_registered():
    with _session() as db:
        with pytest.raises(HTTPException) as exc:
            register_verified_direct_discovery('PS.G05.SCI.S1.STUDENT_BOOK.2020.DISCOVERY', db)
        assert exc.value.status_code == 409
        assert db.query(SourceFile).count() == 0


def test_unknown_discovery_source_is_not_registered():
    with _session() as db:
        with pytest.raises(HTTPException) as exc:
            register_verified_direct_discovery('UNKNOWN.SOURCE', db)
        assert exc.value.status_code == 404
