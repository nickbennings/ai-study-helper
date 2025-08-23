from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .summarizer import summarize_text  # keep this; it lazy-loads transformers itself

app = FastAPI(title="AI Study Helper API")

# CORS (you can tighten later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # or ["https://nickbennings.github.io"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional: serve /app if you ever want to ship a UI from the API
WEB_DIR = os.path.join(os.getcwd(), "web")
STATIC_DIR = os.path.join(WEB_DIR, "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/app")
def app_page():
    index_path = os.path.join(WEB_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"message": "Web UI not found. Create /web/index.html to use it."}

class URLRequest(BaseModel):
    url: str

class TextRequest(BaseModel):
    text: str

@app.get("/")
def home():
    return {"message": "AI Study Helper API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/summarize/text")
def summarize_text_body(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="No text provided.")
    summary = summarize_text(req.text)
    if summary.lower().startswith("error"):
        raise HTTPException(status_code=500, detail=summary)
    return {"summary": summary}

@app.post("/summarize/youtube")
def summarize_youtube(request: URLRequest):
    # <-- lazy import here
    from .extractors import extract_youtube_transcript
    text = extract_youtube_transcript(request.url)
    if isinstance(text, str) and text.lower().startswith("error"):
        raise HTTPException(status_code=400, detail=text)
    summary = summarize_text(text)
    if summary.lower().startswith("error"):
        raise HTTPException(status_code=500, detail=summary)
    return {"summary": summary}

@app.post("/summarize/website")
def summarize_website(request: URLRequest):
    # <-- lazy import here
    from .extractors import extract_website_text
    text = extract_website_text(request.url)
    if isinstance(text, str) and text.lower().startswith("error"):
        raise HTTPException(status_code=400, detail=text)
    summary = summarize_text(text)
    if summary.lower().startswith("error"):
        raise HTTPException(status_code=500, detail=summary)
    return {"summary": summary}
