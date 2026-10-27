from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth.deps import require_admin
from ..db.deps import get_db
from ..db.models import User
from ..db.visual_models import VisualAsset
from ..services.visual_asset_pipeline import extract_lesson_visual_assets, serialize_visual_asset
from ..services.visual_crop_service import create_or_refresh_figure_crop

router = APIRouter(prefix='/importer', tags=['visual-assets'])


class HotspotInput(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    label: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=500)


class VisualAssetReview(BaseModel):
    rights_status: Literal['REVIEW_REQUIRED', 'CLEARED', 'REDRAW_REQUIRED']
    alt_text: str | None = Field(default=None, max_length=600)
    caption: str | None = Field(default=None, max_length=1000)
    hotspots: list[HotspotInput] = Field(default_factory=list, max_length=30)


class FigureCropInput(BaseModel):
    x: float = Field(ge=0, le=95)
    y: float = Field(ge=0, le=95)
    width: float = Field(ge=5, le=100)
    height: float = Field(ge=5, le=100)


@router.post('/lessons/{lesson_id}/visual-assets/extract')
def extract_visual_assets(
    lesson_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    try:
        return extract_lesson_visual_assets(db, lesson_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(409, 'Verified source bytes are not available in configured storage') from exc


@router.get('/lessons/{lesson_id}/visual-assets')
def list_visual_assets(
    lesson_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    rows = db.query(VisualAsset).filter(
        VisualAsset.lesson_id == lesson_id
    ).order_by(VisualAsset.source_page, VisualAsset.parent_asset_id, VisualAsset.id).all()
    return {
        'lesson_id': lesson_id,
        'assets': [serialize_visual_asset(db, row, include_private=True) for row in rows],
    }


@router.post('/visual-assets/{asset_id}/figure-crops')
def create_figure_crop(
    asset_id: int,
    body: FigureCropInput,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    try:
        return create_or_refresh_figure_crop(db, asset_id, body.model_dump())
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(409, 'Parent visual bytes are not available in configured storage') from exc


@router.patch('/visual-assets/{asset_id}')
def review_visual_asset(
    asset_id: int,
    body: VisualAssetReview,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    asset = db.query(VisualAsset).filter(VisualAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(404, 'Visual asset not found')

    hotspot_ids = [spot.id for spot in body.hotspots]
    if len(set(hotspot_ids)) != len(hotspot_ids):
        raise HTTPException(422, 'Hotspot IDs must be unique')

    if body.rights_status == 'CLEARED':
        if not asset.public_url:
            raise HTTPException(409, 'A learner-deliverable public asset URL is required before rights clearance')
        if not body.alt_text or not body.alt_text.strip():
            raise HTTPException(422, 'alt_text is required before rights clearance')
        asset.status = 'APPROVED'
    elif body.rights_status == 'REDRAW_REQUIRED':
        asset.status = 'NEEDS_REDRAW'
    else:
        asset.status = 'EXTRACTED'

    asset.rights_status = body.rights_status
    asset.alt_text = body.alt_text.strip() if body.alt_text else None
    asset.caption = body.caption.strip() if body.caption else None
    asset.hotspots_json = [spot.model_dump() for spot in body.hotspots]
    db.commit()
    db.refresh(asset)
    return serialize_visual_asset(db, asset, include_private=True)
