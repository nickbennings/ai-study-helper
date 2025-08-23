# AI Study Helper

AI Study Helper is a lightweight web application that generates concise summaries from three input types: YouTube videos, web articles, and plain text. It provides a simple interface and can be deployed with GitHub Pages for the frontend and FastAPI for the backend.

---

## Features

* Summarize YouTube videos (when transcripts are available)
* Summarize online articles
* Summarize plain text input
* Client-only summarization for text (works without a backend)
* Remote API integration for YouTube and website summarization
* Minimal, responsive single-page interface

---

## Live Demo

The frontend is deployed on GitHub Pages:

[https://nickbennings.github.io/ai-study-helper/](https://nickbennings.github.io/ai-study-helper/)

---

## Development Setup

1. Clone the repository:

   <pre class="overflow-visible!" data-start="982" data-end="1083"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"><span class="" data-state="closed"></span></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>git </span><span>clone</span><span> https://github.com/nickbennings/ai-study-helper.git
   </span><span>cd</span><span> ai-study-helper
   </span></span></code></div></div></pre>
2. Install backend dependencies:

   <pre class="overflow-visible!" data-start="1121" data-end="1170"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"><span class="" data-state="closed"></span></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>pip install -r requirements.txt
   </span></span></code></div></div></pre>
3. Create a `.env` file in the project root and add:

   <pre class="overflow-visible!" data-start="1228" data-end="1316"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"><span class="" data-state="closed"></span></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ini"><span><span>HF_API_TOKEN</span><span>=your_huggingface_token
   </span><span>HF_MODEL</span><span>=facebook/bart-large-cnn
   </span></span></code></div></div></pre>
4. Run the backend (FastAPI):

   <pre class="overflow-visible!" data-start="1351" data-end="1398"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"><span class="" data-state="closed"></span></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>uvicorn app.main:app --reload
   </span></span></code></div></div></pre>

   The API will be available at `http://127.0.0.1:8000`
5. Serve the frontend locally for testing:

   <pre class="overflow-visible!" data-start="1502" data-end="1554"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"><span class="" data-state="closed"></span></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>python -m http.server -d docs 5173
   </span></span></code></div></div></pre>

   Then open `http://127.0.0.1:5173` in your browser.

---

## Deployment

* **Frontend** : Deployed from the `/docs` folder using GitHub Pages.
* **Backend** : Can be deployed to a hosting service such as Render, Railway, or Hugging Face Spaces.

  Set environment variables (`HF_API_TOKEN`, `HF_MODEL`) on the host rather than committing secrets to the repository.

---

## License

This project is licensed under the MIT License
