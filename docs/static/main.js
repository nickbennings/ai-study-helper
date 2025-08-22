// --- helpers
const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const outEl = $("output");
const apiParam = new URLSearchParams(location.search).get("api");
if (apiParam) localStorage.setItem("apiBase", apiParam);
let API = (localStorage.getItem("apiBase") || "").trim();

function setStatus(t=""){ statusEl.textContent = t; }
function setOut(t=""){ outEl.textContent = t; }
function isYouTube(u){ return /(?:youtu\.be|youtube\.com)/i.test(u); }

$("save-api").onclick = () => {
  const v = $("api-base").value.trim();
  if (v) localStorage.setItem("apiBase", v); else localStorage.removeItem("apiBase");
  API = (localStorage.getItem("apiBase") || "").trim();
  setStatus(API ? `API set: ${API}` : "API cleared");
};
$("api-base").value = API;

// tabs
const linkTab = $("mode-link"), textTab = $("mode-text");
const panelLink = $("panel-link"), panelText = $("panel-text");
function showLink(){ linkTab.classList.add("active"); textTab.classList.remove("active"); panelLink.classList.remove("hidden"); panelText.classList.add("hidden"); }
function showText(){ textTab.classList.add("active"); linkTab.classList.remove("active"); panelText.classList.remove("hidden"); panelLink.classList.add("hidden"); }
linkTab.onclick = showLink; textTab.onclick = showText;

// API call
async function post(endpoint, body){
  if (!API) throw new Error("No API set. Enter it in Settings.");
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  let data = null; try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error((data && (data.detail||data.error||data.message)) || `${res.status} ${res.statusText}`);
  return data || {};
}

// client-only text summary (fallback)
function clientSummarize(text){
  const t = (text||"").replace(/\s+/g," ").trim();
  if (!t) return "No text provided.";
  return t.split(/(?<=[.!?])\s+/).slice(0,5).join(" ").slice(0, 1200);
}

// actions
$("go-link").onclick = async () => {
  const url = $("input-link").value.trim();
  if (!url) return setStatus("Please paste a link.");
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
    if (!API) { setOut(clientSummarize(text)); setStatus("Done (client-only)."); return; }
    const { summary } = await post("/summarize/text", { text });
    setOut(summary || "(no summary)");
    setStatus("Done.");
  } catch (e){ setStatus("Error: "+e.message); }
};

// initial hint
setStatus(API ? `API: ${API}` : "No API set. Text mode works without it.");
