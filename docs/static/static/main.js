// --- API base detection & settings ---
const $ = (id) => document.getElementById(id);

// read from ?api=, localStorage, or data-attr (not used here)
const urlApi = new URLSearchParams(location.search).get("api");
if (urlApi) localStorage.setItem("apiBase", urlApi);
let API = (localStorage.getItem("apiBase") || "").trim();

const isApiEnabled = () => !!API;
function setApiBase(next) {
  API = (next || "").trim();
  if (API) localStorage.setItem("apiBase", API);
  else localStorage.removeItem("apiBase");
  renderApiHints();
}

// --- UI tab logic (matches your original IDs) ---
const panels = {
  youtube: $("panel-youtube"),
  website: $("panel-website"),
  text: $("panel-text"),
};
function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }
function setTab(name) {
  for (const key of Object.keys(panels)) {
    (key === name ? show : hide)(panels[key]);
  }
  document.querySelectorAll(".tab-btn").forEach(btn => {
    const active = btn.id === `tab-${name}`;
    btn.classList.toggle("bg-white", active);
    btn.classList.toggle("shadow", active);
  });
}
$("tab-youtube").onclick = () => setTab("youtube");
$("tab-website").onclick = () => setTab("website");
$("tab-text").onclick = () => setTab("text");

// --- Settings dialog ---
const dlg = $("settings");
$("open-settings").onclick = () => {
  $("api-base").value = API || "";
  dlg.showModal();
};
$("save-settings").onclick = (e) => {
  e.preventDefault();
  setApiBase($("api-base").value);
  dlg.close();
};

// --- Status/output helpers ---
function setStatus(msg=""){ $("status").textContent = msg; }
function setOutput(text=""){ $("output").textContent = text; }

// --- API call helper ---
async function call(endpoint, body) {
  if (!isApiEnabled()) throw new Error("No API base configured");
  setStatus("Working…"); setOutput("");
  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = typeof data?.detail === "string" ? data.detail : res.statusText;
      throw new Error(msg);
    }
    setStatus("Done."); return data;
  } finally { /* keep status for a moment */ }
}

// --- Client-only text summarizer (fallback) ---
function clientSummarize(text, advanced=false) {
  const t = (text || "").replace(/\s+/g," ").trim();
  if (!t) return "No text provided.";
  if (!advanced) {
    // naive: first ~5 sentences up to ~600 chars
    const sentences = t.split(/(?<=[.!?])\s+/).slice(0, 6).join(" ");
    return sentences.slice(0, 700);
  }
  // slightly smarter: score sentences by keyword frequency
  const sents = t.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 60);
  const words = t.toLowerCase().match(/[a-z0-9']+/g) || [];
  const stop = new Set("the a an of and to in is it for on with this that as by from be are was were at or not have has had you they we i his her their our your but if then than which who what when where how".split(" "));
  const freq = Object.create(null);
  for (const w of words) if (!stop.has(w)) freq[w] = (freq[w]||0)+1;
  const scored = sents.map((s,i) => {
    const ws = (s.toLowerCase().match(/[a-z0-9']+/g) || []).filter(w=>!stop.has(w));
    const score = ws.reduce((acc,w)=>acc+(freq[w]||0), 0) / Math.sqrt(ws.length+1) + (i<3?0.5:0);
    return { s, score };
  });
  scored.sort((a,b)=>b.score-a.score);
  const pick = scored.slice(0, Math.min(5, Math.ceil(scored.length*0.25)) ).map(x=>x.s);
  const summary = pick.join(" ").slice(0, 900);
  return summary || t.slice(0, 900);
}

// --- Wire buttons ---
$("yt-go").onclick = async () => {
  const url = $("yt-url").value.trim();
  if (!url) return setStatus("Please enter a YouTube URL.");
  if (!isApiEnabled()) {
    setStatus("YouTube requires a remote API (see Settings).");
    return;
  }
  try {
    const { summary } = await call("/summarize/youtube", { url });
    setOutput(summary);
  } catch(e){ setStatus("Error: " + e.message); }
};

$("web-go").onclick = async () => {
  const url = $("web-url").value.trim();
  if (!url) return setStatus("Please enter a website URL.");
  if (!isApiEnabled()) {
    setStatus("Website mode requires a remote API (see Settings).");
    return;
  }
  try {
    const { summary } = await call("/summarize/website", { url });
    setOutput(summary);
  } catch(e){ setStatus("Error: " + e.message); }
};

$("text-go").onclick = async () => {
  const text = $("raw-text").value.trim();
  if (!text) return setStatus("Please paste some text.");
  if (isApiEnabled()) {
    try {
      const { summary } = await call("/summarize/text", { text });
      setOutput(summary);
    } catch(e){ setStatus("Error: " + e.message); }
  } else {
    // client-only
    const advanced = $("client-advanced").checked;
    setOutput(clientSummarize(text, advanced));
    setStatus("Done (client-only).");
  }
};

// --- API tips/hints visibility ---
function renderApiHints() {
  const needApi = !isApiEnabled();
  const ytTip = $("yt-api-tip"), webTip = $("web-api-tip");
  if (ytTip) ytTip.classList.toggle("hidden", !needApi);
  if (webTip) webTip.classList.toggle("hidden", !needApi);
}
renderApiHints();

// default tab on load
setTab("youtube");
