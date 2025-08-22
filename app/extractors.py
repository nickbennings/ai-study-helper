from urllib.parse import urlparse, parse_qs
from newspaper import Article
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)

# Optional TooManyRequests import (varies across versions)
try:
    from youtube_transcript_api._errors import TooManyRequests  # type: ignore
except Exception:
    class TooManyRequests(Exception):
        pass

def extract_video_id(url: str) -> str:
    u = urlparse(url)
    host = (u.hostname or "").lower()
    if "youtube.com" in host:
        qs = parse_qs(u.query)
        if "v" in qs and qs["v"]:
            return qs["v"][0]
    if "youtu.be" in host:
        return u.path.lstrip("/")
    raise ValueError("Invalid YouTube URL: couldn't find a video id")

def extract_youtube_transcript(url: str) -> str:
    """Fetch English transcript using get_transcript, trying common locale variants."""
    try:
        video_id = extract_video_id(url)
        langs = ["en", "en-US", "en-GB", "en-CA", "en-AU", "en-IN", "en-uk", "en-us"]
        data = YouTubeTranscriptApi.get_transcript(video_id, languages=langs)
        text = " ".join(d.get("text", "") for d in data if d.get("text"))
        return text.strip() if text.strip() else "Error extracting YouTube transcript: transcript was empty."
    except TranscriptsDisabled as e:
        return f"Error extracting YouTube transcript: transcripts are disabled for this video ({e})."
    except NoTranscriptFound:
        return "Error extracting YouTube transcript: no English transcript (manual or auto) was found."
    except VideoUnavailable:
        return "Error extracting YouTube transcript: the video is unavailable."
    except TooManyRequests:
        return "Error extracting YouTube transcript: rate-limited by YouTube. Try again in a bit."
    except Exception as e:
        return f"Error extracting YouTube transcript: {e}"

def extract_website_text(url: str) -> str:
    try:
        article = Article(url)
        article.download()
        article.parse()
        text = (article.text or "").strip()
        if not text:
            return "Error extracting website text: page returned no readable content."
        return text
    except Exception as e:
        return f"Error extracting website text: {e}"
