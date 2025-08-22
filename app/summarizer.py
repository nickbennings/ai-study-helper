import re
from typing import List
from transformers import pipeline

# Local summarizer (no API key). First run downloads weights (cached after).
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

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

def summarize_text(raw_text: str) -> str:
    try:
        if not raw_text or raw_text.lower().startswith("error"):
            return raw_text or "Error summarizing: no text provided."

        text = clean_text(raw_text)
        if not text:
            return "Error summarizing: extracted text was empty after cleaning."

        pieces = chunk_text(text, max_chars=1800)
        piece_summaries = []
        for ch in pieces:
            out = summarizer(ch, max_length=160, min_length=60, do_sample=False)
            piece_summaries.append(out[0]["summary_text"])

        combined = " ".join(piece_summaries)
        final = summarizer(combined, max_length=200, min_length=80, do_sample=False)[0]["summary_text"]

        bullets = bulletize(final, max_points=5)
        questions = make_questions(final)
        return format_output(bullets, questions)

    except Exception as e:
        return f"Error summarizing (local model): {e}"
