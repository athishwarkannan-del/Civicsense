from typing import Tuple, Optional
from ..database.connection import db


def _simple_similarity(a: str, b: str) -> float:
    """Token overlap similarity (Jaccard)."""
    set_a = set(a.lower().split())
    set_b = set(b.lower().split())
    if not set_a or not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union)


async def check_duplicate(description: str, threshold: float = 0.55) -> Tuple[bool, Optional[str], float]:
    """
    Compare against recent complaints.
    Returns (is_duplicate, similar_complaint_id, similarity_score).
    """
    try:
        cursor = db.grievances.find({}, {"id": 1, "description": 1}).sort("created_at", -1).limit(100)
        recent = await cursor.to_list(length=100)

        best_id = None
        best_score = 0.0
        for g in recent:
            score = _simple_similarity(description, g.get("description", ""))
            if score > best_score:
                best_score = score
                best_id = g.get("id")

        if best_score >= threshold:
            return True, best_id, round(best_score, 3)
        return False, None, round(best_score, 3)
    except Exception:
        return False, None, 0.0
