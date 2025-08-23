// ---------- basics ----------
const $ = (id) => document.getElementById(id);
function setStatus(t=""){ $("status").textContent = t; }
function setOut(t=""){ $("output").textContent = t; }
function isYouTube(u){ return /(?:youtu\.be|youtube\.com)/i.test(u); }
function show(id){ $(id).classList.remove("hidden"); }
function hide(id){ $(id).classList.add("hidden"); }
function activate(btnId){
  document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
  $(btnId).classList.add("active");
}

// ---------- API base detection ----------
const isLocal = ["localhost","127.0.0.1"].includes(location.hostname);
const DEFAULT_API_BASE = isLocal
  ? "http://127.0.0.1:8000"
  : "https://ai-study-helper-u06m.onrender.com";   // your live API
let API = (DEFAULT_API_BASE || "").trim();
const hasApi = !!API;



// ---------- tab wiring ----------
$("tab-youtube").onclick = () => {
  activate("tab-youtube");
  show("panel-youtube"); hide("panel-website"); hide("panel-text");
};
$("tab-website").onclick = () => {
  activate("tab-website");
  show("panel-website"); hide("panel-youtube"); hide("panel-text");
};
$("tab-text").onclick = () => {
  activate("tab-text");
  show("panel-text"); hide("panel-youtube"); hide("panel-website");
};

// ---------- client-only text summarizer (fallback) ----------
function clientSummarize(text){
  const t = (text||"").replace(/\s+/g," ").trim();
  if (!t) return "No text provided.";
  // Simple frequency-based extractive summary (better than first-5-sentences)
  const sents = t.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0,120);
  const words = t.toLowerCase().match(/[a-z0-9']+/g) || [];
  const stop = new Set("the a an of and to in is it for on with this that as by from be are was were at or not have has had you they we i his her their our your but if then than which who what when where how".split(" "));
  const freq = Object.create(null);
  for (const w of words) if (!stop.has(w)) freq[w] = (freq[w]||0)+1;
  const scored = sents.map((s,i)=>{
    const ws = (s.toLowerCase().match(/[a-z0-9']+/g)||[]).filter(w=>!stop.has(w));
    const score = ws.reduce((a,w)=>a+(freq[w]||0),0)/Math.sqrt(ws.length+1)+(i<3?0.3:0);
    return {s,score};
  }).sort((a,b)=>b.score-a.score);
  const pick = scored.slice(0, Math.max(3, Math.ceil(scored.length*0.15)) ).map(x=>x.s);
  return pick.join(" ").slice(0, 1400) || t.slice(0, 1400);
}

// ---------- API call helper ----------
async function call(endpoint, body){
  if (!hasApi) throw new Error("Remote API not configured.");
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  let data = null; try{ data = await res.json(); }catch{}
  if (!res.ok) throw new Error((data && (data.detail||data.error||data.message)) || `${res.status} ${res.statusText}`);
  return data || {};
}

// ---------- actions ----------
$("yt-go").onclick = async () => {
  const url = $("yt-url").value.trim();
  if (!url) return setStatus("Enter a YouTube URL.");
  setStatus("Working…"); setOut("");
  try{
    const { summary } = await call("/summarize/youtube", { url });
    setOut(summary || "(no summary)");
    setStatus("Done.");
  }catch(e){ setStatus("Error: " + e.message); }
};

$("web-go").onclick = async () => {
  const url = $("web-url").value.trim();
  if (!url) return setStatus("Enter a website URL.");
  setStatus("Working…"); setOut("");
  try{
    const { summary } = await call("/summarize/website", { url });
    setOut(summary || "(no summary)");
    setStatus("Done.");
  }catch(e){ setStatus("Error: " + e.message); }
};

$("text-go").onclick = async () => {
  const text = $("raw-text").value.trim();
  if (!text) return setStatus("Paste some text.");
  setStatus("Working…"); setOut("");
  try{
    if (hasApi){
      const { summary } = await call("/summarize/text", { text });
      setOut(summary || "(no summary)");
      setStatus("Done.");
    }else{
      setOut(clientSummarize(text));
      setStatus("Done (client-only).");
    }
  }catch(e){ setStatus("Error: " + e.message); }
};

// ---------- hints ----------
function renderHints(){
  const msg = hasApi
    ? `API ready at ${API}`
    : "API not configured — YouTube/Website will activate once your API is online.";
  setStatus(msg);
  $("yt-tip")?.classList.toggle("hidden", hasApi);
  $("web-tip")?.classList.toggle("hidden", hasApi);
}
renderHints();

// default tab
$("tab-text").click();
