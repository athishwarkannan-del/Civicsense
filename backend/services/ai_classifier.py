import re
import math
from typing import Tuple, List, Dict

# ─── Department → Officer mapping ─────────────────────────
DEPT_OFFICERS = {
    "Public Works Department (PWD)":     "Er. Rajesh Kumar",
    "Water Supply & Sanitation Board":   "Er. Anjali Singh",
    "Electricity Department":            "Er. Mohan Verma",
    "Municipal Corporation":             "Shri. Prakash Nair",
    "Health Department":                 "Dr. Priya Mehta",
    "Education Department":              "Dr. Sunita Rao",
    "Police Department":                 "SP Arvind Sharma",
    "Revenue Department":                "Shri. Ramesh Gupta",
    "Environment Department":            "Dr. Kavitha Iyer",
    "Social Welfare Department":         "Smt. Lalitha Devi",
    "Housing Board":                     "Er. Suresh Reddy",
    "Transport Department":              "Shri. Venkatesan M",
}

# Mapping full department names to the 6 government departments
DEPT_SHORT_NAMES = {
    "Public Works Department (PWD)":     "Public Works",
    "Water Supply & Sanitation Board":   "Health",
    "Electricity Department":            "Municipal",
    "Municipal Corporation":             "Municipal",
    "Health Department":                 "Health",
    "Education Department":              "Education",
    "Police Department":                 "Municipal",
    "Revenue Department":                "Revenue",
    "Environment Department":            "Municipal",
    "Social Welfare Department":         "Education",
    "Housing Board":                     "Public Works",
    "Transport Department":              "Transport",
}

# ─── Keyword → Department rules ───────────────────────────
CATEGORY_RULES = [
    (["pothole", "road", "highway", "bridge", "street", "path", "tar", "flyover", "divider"],
     "Roads & Transport", "Public Works Department (PWD)"),
    (["water", "pipeline", "drainage", "sewage", "sewer", "tap", "leak", "leakage", "tank", "supply", "chlorination", "drain"],
     "Water Supply", "Water Supply & Sanitation Board"),
    (["electricity", "power", "current", "electric", "voltage", "blackout", "outage", "wire", "transformer", "streetlight", "meter", "transformer"],
     "Electricity", "Electricity Department"),
    (["garbage", "waste", "dustbin", "litter", "sanitation", "hygiene", "mosquito", "dump", "cleaning", "fume", "stench"],
     "Sanitation", "Municipal Corporation"),
    (["hospital", "doctor", "medicine", "health", "clinic", "ambulance", "disease", "treatment", "vaccine", "pharmacy"],
     "Healthcare", "Health Department"),
    (["school", "teacher", "education", "college", "student", "tuition", "scholarship", "university", "faculty"],
     "Education", "Education Department"),
    (["police", "crime", "theft", "robbery", "harassm", "assault", "safety", "security", "violence", "theft", "drunk", "illegal"],
     "Public Safety", "Police Department"),
    (["land", "revenue", "property", "tax", "encroach", "patta", "document", "record", "survey", "boundary"],
     "Revenue", "Revenue Department"),
    (["house", "flat", "shelter", "building", "constr", "permit", "plan approval", "construction", "encroached"],
     "Housing", "Housing Board"),
    (["pollution", "environment", "tree", "fire", "air quality", "noise", "factory", "lake", "smoke", "chemical"],
     "Environment", "Environment Department"),
    (["pension", "welfare", "ration", "subsidy", "disability", "widow", "poor", "bpl", "card"],
     "Social Welfare", "Social Welfare Department"),
    (["bus", "auto", "transport", "route", "vehicle", "traffic", "parking", "signal"],
     "Roads & Transport", "Transport Department"),
]

# ─── Priority keyword scoring ──────────────────────────────
EMERGENCY_KEYWORDS   = ["emergency", "urgent", "critical", "immediate", "life", "death", "dying", "attack"]
DANGER_KEYWORDS      = ["accident", "danger", "fire", "explosion", "collapse", "flood", "injur"]
SENSITIVE_LOCATIONS  = ["hospital", "school", "college", "clinic", "orphan", "old age"]
MINOR_KEYWORDS       = ["minor", "small", "slight", "inconvenience", "request", "suggestion"]


# ─── Vector-based importance rating (1-100%) ───────────────
# Reference vectors: each dimension represents a severity axis
# The complaint text is vectorized against these axes using
# weighted keyword frequency (TF-IDF-like scoring)

SEVERITY_VECTORS: Dict[str, Dict[str, float]] = {
    "emergency": {
        "emergency": 1.0, "urgent": 0.95, "critical": 0.95, "immediate": 0.9,
        "life": 0.95, "death": 1.0, "dying": 1.0, "attack": 0.85,
        "accident": 0.85, "danger": 0.9, "fire": 0.9, "explosion": 0.95,
        "collapse": 0.9, "flood": 0.85, "injur": 0.9, "blood": 0.85,
        "trapped": 0.95, "helpless": 0.8, "rescue": 0.9, "ambulance": 0.9,
    },
    "infrastructure": {
        "pothole": 0.7, "road": 0.5, "bridge": 0.75, "collapse": 0.9,
        "broken": 0.65, "damage": 0.7, "crack": 0.6, "leak": 0.65,
        "burst": 0.8, "overflow": 0.7, "block": 0.5, "sewage": 0.7,
        "drain": 0.55, "wire": 0.6, "pole": 0.5, "transformer": 0.7,
        "blackout": 0.75, "outage": 0.65, "construction": 0.4, "building": 0.5,
    },
    "public_impact": {
        "hospital": 0.85, "school": 0.8, "college": 0.7, "children": 0.85,
        "elderly": 0.8, "disabled": 0.8, "crowd": 0.65, "public": 0.5,
        "residential": 0.6, "market": 0.55, "traffic": 0.5, "commuter": 0.5,
        "student": 0.7, "patient": 0.8, "pedestrian": 0.6, "community": 0.5,
        "village": 0.55, "slum": 0.7, "orphan": 0.85, "pregnant": 0.85,
    },
    "health_risk": {
        "disease": 0.9, "infection": 0.85, "contamination": 0.9, "pollution": 0.7,
        "toxic": 0.9, "chemical": 0.85, "garbage": 0.6, "waste": 0.55,
        "stench": 0.65, "mosquito": 0.7, "epidemic": 0.95, "hygiene": 0.6,
        "sanitation": 0.55, "drinking": 0.7, "contaminated": 0.9, "fume": 0.7,
        "smoke": 0.65, "hazard": 0.8, "unsafe": 0.75, "rotten": 0.7,
    },
}

# Weights for each severity dimension
DIMENSION_WEIGHTS = {
    "emergency": 0.40,
    "infrastructure": 0.20,
    "public_impact": 0.25,
    "health_risk": 0.15,
}


def _tokenize(text: str) -> List[str]:
    """Simple word tokenizer."""
    return re.findall(r'\b[a-z]+\b', text.lower())


def _cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Compute cosine similarity between two sparse vectors."""
    common_keys = set(vec_a.keys()) & set(vec_b.keys())
    if not common_keys:
        return 0.0
    dot = sum(vec_a[k] * vec_b[k] for k in common_keys)
    mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
    mag_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _compute_importance_vector(description: str) -> Tuple[int, Dict[str, float]]:
    """
    Compute a 1-100% importance score using vector classification.
    Returns (importance_pct, dimension_scores).
    """
    tokens = _tokenize(description)
    if not tokens:
        return 15, {d: 0.0 for d in SEVERITY_VECTORS}

    # Build a term-frequency vector for the input text
    tf: Dict[str, float] = {}
    for token in tokens:
        tf[token] = tf.get(token, 0) + 1.0
    # Normalize by max frequency (TF normalization)
    max_freq = max(tf.values())
    text_vector = {k: v / max_freq for k, v in tf.items()}

    # Compute similarity against each severity dimension
    dimension_scores: Dict[str, float] = {}
    for dim_name, ref_vector in SEVERITY_VECTORS.items():
        sim = _cosine_similarity(text_vector, ref_vector)
        # Amplify: cosine sim with sparse vectors is naturally low
        dimension_scores[dim_name] = round(min(100, sim * 250), 1)

    # Weighted combination
    weighted_score = sum(
        dimension_scores[dim] * DIMENSION_WEIGHTS[dim]
        for dim in SEVERITY_VECTORS
    )

    # Apply text length bonus (longer, more detailed complaints = slightly higher)
    word_count = len(tokens)
    length_bonus = min(15, word_count / 3)  # up to +15 for detailed descriptions

    # Apply keyword count bonus from category matching
    category_kw_count = 0
    for keywords, _, _ in CATEGORY_RULES:
        for kw in keywords:
            if kw in description.lower():
                category_kw_count += 1
    keyword_bonus = min(15, category_kw_count * 5)

    # Final importance: weighted similarity + bonuses, clamped to 1-100
    importance_pct = int(max(1, min(100, weighted_score + length_bonus + keyword_bonus)))

    return importance_pct, dimension_scores


def _compute_priority_score(description: str) -> Tuple[str, float]:
    text = description.lower()
    score = 3.0  # baseline

    for kw in EMERGENCY_KEYWORDS:
        if kw in text:
            score += 4.0
            break

    for kw in DANGER_KEYWORDS:
        if kw in text:
            score += 3.0
            break

    for kw in SENSITIVE_LOCATIONS:
        if kw in text:
            score += 2.0
            break

    for kw in MINOR_KEYWORDS:
        if kw in text:
            score -= 1.5
            break

    score = max(1.0, min(10.0, score))

    if score >= 7:
        priority = "high"
    elif score >= 4:
        priority = "medium"
    else:
        priority = "low"

    return priority, round(score, 1)

async def classify_grievance(description: str) -> dict:
    """
    Returns a dictionary of classification results, prioritized by first mention.
    """
    text = description.lower()
    
    # Track all matches and their first appearance index
    matches = []
    
    for keywords, category, dept in CATEGORY_RULES:
        hits = []
        first_idx = float('inf')
        
        for kw in keywords:
            # Use regex for whole word matching
            pattern = rf'\b{re.escape(kw)}\b'
            search = re.search(pattern, text)
            if search:
                hits.append(kw)
                if search.start() < first_idx:
                    first_idx = search.start()
        
        if hits:
            matches.append({
                "category": category,
                "department": dept,
                "hits": hits,
                "hit_count": len(hits),
                "first_mention_idx": first_idx
            })

    # Default if no matches
    if not matches:
        matches = [{
            "category": "Other",
            "department": "Municipal Corporation",
            "hits": [],
            "hit_count": 0,
            "first_mention_idx": 0
        }]

    # SORT BY POSITION: The problem mentioned first in the text is the Primary
    matches.sort(key=lambda x: x["first_mention_idx"])
    
    primary = matches[0]
    all_categories = list(dict.fromkeys([m["category"] for m in matches]))
    all_departments = list(dict.fromkeys([m["department"] for m in matches]))
    all_keywords = []
    for m in matches:
        all_keywords.extend(m["hits"])
    all_keywords = list(dict.fromkeys(all_keywords))[:8]

    priority, priority_score = _compute_priority_score(description)
    importance_pct, dimension_scores = _compute_importance_vector(description)
    officer = DEPT_OFFICERS.get(primary["department"], "Duty Officer")
    
    domains = []
    for m in matches:
        domains.append({
            "category": m["category"],
            "department": m["department"],
            "officer": DEPT_OFFICERS.get(m["department"], "Duty Officer"),
            "is_primary": m == primary
        })

    explanation = (
        f"AI detected {len(matches)} potential domains. "
        f"Primary focus: '{primary['category']}' (mentioned first). "
    )
    if len(matches) > 1:
        other_depts = [m["department"] for m in matches[1:3]]
        explanation += f"Also relevant: {', '.join(other_depts)}. "
    
    explanation += (
        f"Priority score: {priority_score}/10 ({priority.upper()}). "
        f"Vector importance: {importance_pct}%."
    )

    # Normalize department to dashboard-friendly names
    normalized_dept = DEPT_SHORT_NAMES.get(primary["department"], "Municipal")
    all_normalized_depts = list(dict.fromkeys([DEPT_SHORT_NAMES.get(m["department"], "Municipal") for m in matches]))

    return {
        "category": primary["category"],
        "department": normalized_dept,
        "officer": officer,
        "priority": priority,
        "priority_score": priority_score,
        "importance_pct": importance_pct,
        "importance_dimensions": dimension_scores,
        "keywords_found": all_keywords,
        "explanation": explanation,
        "all_categories": all_categories,
        "all_departments": all_normalized_depts,
        "domains": domains
    }


