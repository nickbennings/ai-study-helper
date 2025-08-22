// -------- tiny helpers ----------
const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const outEl = $("output");
function setStatus(t=""){ statusEl.textContent = t; }
function setOut(t=""){ outEl.textContent = t; }
function isYouTube(u){ return /(?:youtu\.be|youtube\.com)/i.test(u); }

// -------- API base (no visible settings) ----------
// If you're developing locally, we'll assume your API is at localhost.
// On GitHub Pages (https), we default to NO API (Link tab is hidden).
const isLocal = ["localhost","127.0.0.1"].includes(location.hostname);
const DEFAULT_API_BASE = isLocal ? "http://127.0.0.1:8000" : ""; // <- put your hosted https API here later
const API = (DEFAULT_API_BASE || "").trim();
const hasApi = !!API;

// -------- tabs ----------
const linkTab = $("mode-link"), textTab = $("mode-text");
const panelLink = $("panel-link"), panelText = $("panel-text");
function showLink(){ linkTab.classList.add("active"); textTab.classList.remove("active"); panelLink.classList.remove("hidden"); panelText.classList.add("hidden"); }
function showText(){ textTab.classList.add("active"); linkTab.classList.remove("active"); panelText.classList.remove("hidden"); panelLink.classList.add("hidden"); }
linkTab.onclick = showLink; textTab.onclick = showText;

// Hide Link features entirely if no API (e.g., on GitHub Pages without a hosted backend)
if (!hasApi) { linkTab.classList.add("hidden"); panelLink.classList.add("hidden"); showText(); }

// -------- HTTP helper ----------
async function post(endpoint, body){
  if (!hasApi) throw new Error("No API available");
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  let data = null; try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error((data && (data.detail||data.error||data.message)) || `${res.status} ${res.statusText}`);
  return data || {};
}

// -------- client-only text summarizer (fallback) ----------
function clientSummarize(text){
  const t = (text||"").replace(/\s+/g," ").trim();
  if (!t) return "No text provided.";
  return t.split(/(?<=[.!?])\s+/).slice(0,5).join(" ").slice(0,1200);
}

// -------- actions ----------
$("go-link").onclick = async () => {
  const url = $("input-link").value.trim();
  if (!url) return setStatus("Please paste a link.");
  if (!hasApi) return setStatus("Link mode requires a backend API.");
  setStatus("Working…"); setOut("");
  try {
    const endpoint = isYouTube(url) ? "/summarize/youtube" : "/summarize/website";
    const { summary } = await post(endpoint, { url });
    setOut(summary || "(no summary)");
    setStatus("Done.");
  } catch (e){ setStatus("Error: "+e.message); }
};

$("go-text").onclick = async () => {
  const text = $("input-text").value.trim();
  if (!text) return setStatus("Please paste some text.");
  setStatus("Working…"); setOut("");
  try {
    if (hasApi) {
      const { summary } = await post("/summarize/text", { text });
      setOut(summary || "(no summary)");
      setStatus("Done.");
    } else {
      setOut(clientSummarize(text));
      setStatus("Done (client-only).");
    }
  } catch (e){ setStatus("Error: "+e.message); }
};

// initial hint
setStatus(hasApi ? `API detected at ${API}` : "API not configured — Link tab hidden. Text works.");
