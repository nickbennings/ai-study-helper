import os
import re
from typing import List, Optional

# Optional: load .env if present
try:
    from dotenv import load_dotenv  # pip install python-dotenv
    load_dotenv()
except Exception:
    pass

HF_API_TOKEN = os.getenv("HF_API_TOKEN", "").strip()

# If you want a different HF model, change this:
HF_MODEL = os.getenv("HF_MODEL", "facebook/bart-large-cnn").strip()

# We only import transformers if we need the local pipeline (faster start if using HF)
_local_pipeline = None

def _get_local_pipeline():
    """Lazily create the local summarization pipeline."""
    global _local_pipeline
    if _local_pipeline is None:
        # pip install transformers torch
        from transformers import pipeline  # lazy import
        # Your previous model choice is fine; you can swap it here if you like.
        _local_pipeline = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
    return _local_pipeline


# ---------- text utilities ----------

def clean_text(text: str) -> str:
    t = (text or "").replace("\xa0", " ").strip()
    t = re.sub(r"\[(?:[^\]]{1,40})\]", " ", t)  # [Music], [Applause], etc.
    t = re.sub(r"\(?\b\d{1,2}:\d{2}(?::\d{2})?\)?", " ", t)  # 00:12
    t = re.sub(r"https?://\S+", " ", t)  # URLs
    t = re.sub(r"\s+", " ", t)  # collapse whitespace
    return t.strip()

def chunk_text(text: str, max_chars: int = 1800) -> List[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks, curr = [], ""
    for s in sentences:
        if len(curr) + len(s) + 1 <= max_chars:
            curr += (s + " ")
        else:
            if curr:
                chunks.append(curr.strip())
            curr = s + " "
    if curr.strip():
        chunks.append(curr.strip())
    return chunks or [text[:max_chars]]

def bulletize(text: str, max_points: int = 5) -> List[str]:
    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    top = sents[:max_points]
    return [f"• {s}" for s in top]

def make_questions(text: str) -> List[str]:
    m = re.findall(r"\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b", text)
    topic = m[0] if m else "the topic"
    return [
        f"1) What problem does {topic} address, and why is it important?",
        f"2) List two key takeaways about {topic}.",
        f"3) How could you apply {topic} in a real scenario?",
    ]

def format_output(bullets: List[str], questions: List[str]) -> str:
    return (
        "Key Points:\n" + "\n".join(bullets) +
        "\n\nPractice Questions:\n" + "\n".join(questions)
    )


# ---------- Hugging Face Inference API ----------

def _hf_summarize_once(text: str, max_len: int = 200, min_len: int = 60) -> Optional[str]:
    """Call HF Inference API one time."""
    import requests  # pip install requests
    api_url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}
    payload = {"inputs": text, "parameters": {"max_length": max_len, "min_length": min_len, "do_sample": False}}
    r = requests.post(api_url, headers=headers, json=payload, timeout=60)
    if r.status_code != 200:
        # HF can return a 'loading' 503 while a model spins up; surface a readable error
        return None
    data = r.json()
    # bart-like models return [{"summary_text": "..."}]
    try:
        return data[0]["summary_text"]
    except Exception:
        # some models return a different shape
        return None


def _local_summarize_once(text: str, max_len: int = 200, min_len: int = 60) -> str:
    pipe = _get_local_pipeline()
    out = pipe(text, max_length=max_len, min_length=min_len, do_sample=False)
    return out[0]["summary_text"]


# ---------- main entry ----------

def _summarize_chunks(chunks: List[str]) -> List[str]:
    """Summarize each chunk using HF if token present, else local pipeline."""
    results: List[str] = []
    for ch in chunks:
        if HF_API_TOKEN:
            s = _hf_summarize_once(ch, max_len=160, min_len=60)
            if s is None:
                # fall back to local if HF failed (cold start, rate limit, etc.)
                s = _local_summarize_once(ch, max_len=160, min_len=60)
        else:
            s = _local_summarize_once(ch, max_len=160, min_len=60)
        results.append(s)
    return results


def summarize_text(raw_text: str) -> str:
    try:
        if not raw_text or raw_text.lower().startswith("error"):
            return raw_text or "Error summarizing: no text provided."

        text = clean_text(raw_text)
        if not text:
            return "Error summarizing: extracted text was empty after cleaning."

        pieces = chunk_text(text, max_chars=1800)
        piece_summaries = _summarize_chunks(pieces)

        combined = " ".join(piece_summaries)[:4000]
        # final pass to tighten
        if HF_API_TOKEN:
            final = _hf_summarize_once(combined, max_len=200, min_len=80) or _local_summarize_once(combined, max_len=200, min_len=80)
        else:
            final = _local_summarize_once(combined, max_len=200, min_len=80)

        bullets = bulletize(final, max_points=5)
        questions = make_questions(final)
        return format_output(bullets, questions)

    except Exception as e:
        return f"Error summarizing: {e}"
