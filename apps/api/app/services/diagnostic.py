from __future__ import annotations


def find_root_gap(target_skill_id: int, prerequisite_edges: list[tuple[int, int]], mastery: dict[int, float], threshold: float = 0.65) -> dict:
    """Backtrack prerequisite graph to the deepest weak prerequisite.

    edges are (prerequisite, dependent). Cycles are safely ignored.
    """
    parents: dict[int, list[int]] = {}
    for prerequisite, dependent in prerequisite_edges:
        parents.setdefault(dependent, []).append(prerequisite)

    trace: list[dict] = []
    visited: set[int] = set()

    def walk(skill_id: int) -> int | None:
        if skill_id in visited:
            return None
        visited.add(skill_id)
        candidates = parents.get(skill_id, [])
        weak = sorted(candidates, key=lambda s: mastery.get(s, 0.0))
        for prereq in weak:
            score = mastery.get(prereq, 0.0)
            trace.append({'skill_id': prereq, 'mastery': score, 'weak': score < threshold})
            if score < threshold:
                deeper = walk(prereq)
                return deeper or prereq
        return None

    target_score = mastery.get(target_skill_id, 0.0)
    trace.append({'skill_id': target_skill_id, 'mastery': target_score, 'target': True})
    root = walk(target_skill_id)
    return {
        'target_skill_id': target_skill_id,
        'root_gap_skill_id': root if root is not None else (target_skill_id if target_score < threshold else None),
        'trace': trace,
        'threshold': threshold,
    }
