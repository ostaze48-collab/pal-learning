from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MasteryState:
    score: float = 0.0
    confidence: float = 0.0
    evidence_count: int = 0
    status: str = 'NOT_ASSESSED'


def evidence_value(correct: bool, difficulty: float = 0.5, used_hint: bool = False, used_ai_help: bool = False) -> float:
    difficulty = max(0.0, min(1.0, difficulty))
    if not correct:
        return 0.0
    value = 0.82 + (0.18 * difficulty)
    if used_hint:
        value -= 0.14
    if used_ai_help:
        value -= 0.10
    return round(max(0.0, min(1.0, value)), 4)


def status_for(score: float, confidence: float) -> str:
    if confidence < 0.12:
        return 'NOT_ASSESSED'
    if score < 0.35:
        return 'NEEDS_SUPPORT'
    if score < 0.55:
        return 'EMERGING'
    if score < 0.75:
        return 'DEVELOPING'
    if confidence < 0.65:
        return 'MASTERED'
    return 'STABLE'


def update_mastery(state: MasteryState, correct: bool, difficulty: float = 0.5, used_hint: bool = False, used_ai_help: bool = False) -> MasteryState:
    evidence = evidence_value(correct, difficulty, used_hint, used_ai_help)
    n = state.evidence_count
    # Recent evidence matters, but one item can never establish full mastery.
    if n == 0:
        score = evidence
    else:
        historical_weight = min(0.82, 0.55 + 0.04 * min(n, 7))
        score = (state.score * historical_weight) + (evidence * (1 - historical_weight))
    new_n = n + 1
    confidence = min(0.95, 0.16 + 0.11 * new_n)
    if new_n == 1:
        confidence = min(confidence, 0.27)
    score = round(max(0.0, min(1.0, score)), 4)
    confidence = round(confidence, 4)
    return MasteryState(score=score, confidence=confidence, evidence_count=new_n, status=status_for(score, confidence))
