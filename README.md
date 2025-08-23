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

Frontend (GitHub Pages):
[https://nickbennings.github.io/ai-study-helper/](https://nickbennings.github.io/ai-study-helper/)

Optional backend API (FastAPI on Render, for developers):
[https://ai-study-helper-u06m.onrender.com/docs](https://ai-study-helper-u06m.onrender.com/docs)

---

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/nickbennings/ai-study-helper.git
   cd ai-study-helper
   ```

Install backend dependencies:

bash
Copy
Edit
pip install -r requirements.txt
Create a .env file in the project root and add:

ini
Copy
Edit
HF_API_TOKEN=your_huggingface_token
HF_MODEL=facebook/bart-large-cnn
Run the backend (FastAPI):

bash
Copy
Edit
uvicorn app.main:app --reload
The API will be available at http://127.0.0.1:8000.

Serve the frontend locally for testing:

bash
Copy
Edit
python -m http.server -d docs 5173
Then open http://127.0.0.1:5173 in your browser.

Deployment
Frontend: Deployed from the /docs folder using GitHub Pages.

Backend: Can be deployed to a hosting service such as Render, Railway, or Hugging Face Spaces.
Set environment variables (HF_API_TOKEN, HF_MODEL) on the host rather than committing secrets to the repository.

License
This project is licensed under the MIT License.
