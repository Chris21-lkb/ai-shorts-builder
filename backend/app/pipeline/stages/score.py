import json
from pathlib import Path


HOOK_PHRASES = [
    "most people",
    "truth is",
    "you won't believe",
    "here's why",
    "no one tells you",
]

STRONG_WORDS = [
    "war", "secret", "money", "illegal",
    "scandal", "crisis", "power", "corruption"
]


def score_text(text: str, duration: float):

    t = text.lower()
    score = 0
    reasons = []

    # hook phrases
    for h in HOOK_PHRASES:
        if h in t:
            score += 3
            reasons.append("hook_phrase")
            break

    # question
    if "?" in text:
        score += 2
        reasons.append("question")

    # strong words
    strong_hits = sum(1 for w in STRONG_WORDS if w in t)
    if strong_hits:
        score += strong_hits
        reasons.append("strong_words")

    # duration sweet spot
    if 20 <= duration <= 50:
        score += 2
        reasons.append("good_length")

    if duration > 70:
        score -= 2
        reasons.append("too_long")

    return score, reasons


def run_scoring(job_dir: Path):

    cand_path = job_dir / "candidates.json"
    out_path = job_dir / "ranked.json"

    if not cand_path.exists():
        raise FileNotFoundError("candidates.json not found")

    data = json.loads(cand_path.read_text(encoding="utf-8"))

    ranked = []

    for c in data:
        score, reasons = score_text(c["text"], c["duration"])

        c2 = dict(c)
        c2["score"] = score
        c2["reasons"] = reasons

        ranked.append(c2)

    ranked.sort(key=lambda x: x["score"], reverse=True)

    out_path.write_text(json.dumps(ranked, indent=2), encoding="utf-8")

    return out_path