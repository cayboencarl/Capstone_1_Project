/* Questfinder web app (UI). Every data call goes through api.js. */

let me = { lat: 16.4150, lng: 120.6000 }; // map fallback (approx. Brgy. San Vicente), replaced by GPS if allowed
let user = null, pendingView = null, scope = "open", curQuest = null, curConv = null, moneyMode = "deposit";
let postLoc = null, postPhoto = "", postDraft = null;

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pesoC = (c) => "₱" + (c / 100).toLocaleString("en-PH", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 });
const peso2 = (c) => "₱" + (c / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtKm = (d) => (d == null ? "" : d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(1) + " km");
const initials = (n) => (n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const ago = (iso) => { const s = (Date.now() - new Date(iso)) / 1000; return s < 60 ? "Just now" : s < 3600 ? Math.floor(s / 60) + " min ago" : s < 86400 ? Math.floor(s / 3600) + " hr ago" : new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" }); };
const clock = (iso) => new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
const toast = (m) => { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2800); };
const av = (p, cls = "") => `<span class="avatar ${p.photo_url ? "has" : ""} ${cls}" data-ini="${esc(initials(p.name))}" style="${p.photo_url ? `background-image:url('${p.photo_url}')` : ""}"></span>`;
function shrink(file, max) { // resize a photo so it fits in storage / uploads quickly
  return new Promise((ok, no) => { const r = new FileReader(); r.onerror = no;
    r.onload = () => { const i = new Image(); i.onerror = no; i.onload = () => { const s = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = i.width * s; c.height = i.height * s; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", .82)); }; i.src = r.result; };
    r.readAsDataURL(file); });
}

/* ---------- form helpers ---------- */
const TYPOS = { "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gmail.co": "gmail.com", "yaho.com": "yahoo.com", "hotmial.com": "hotmail.com", "outlok.com": "outlook.com" };
function checkEmail(v) {
  if (!v) return "Please enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) || v.includes("..")) return "That doesn't look like a valid email address.";
  const d = v.split("@")[1].toLowerCase(); return TYPOS[d] ? `Did you mean ${v.split("@")[0]}@${TYPOS[d]}?` : ""; // proving a mailbox exists needs a verification email from the backend
}
const checkPass = (p) => !p ? "Please enter a password." : p.length < 8 ? "Password must be at least 8 characters." : !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p) ? "Use uppercase, lowercase and a number." : "";
function setErr(f, name, msg) { const i = f.elements[name]; if (!i) return !msg; i.closest("label").querySelector(".err").textContent = msg; i.classList.toggle("bad", !!msg); return !msg; }
function clearErrs(f) { $$(".err", f).forEach((e) => (e.textContent = "")); $$("input,textarea", f).forEach((i) => i.classList.remove("bad")); }
function showApiError(f, e) { if (!e?.error) throw e; let any = false; for (const [k, m] of Object.entries(e.error.fields || {})) if (f?.elements[k]) { setErr(f, k, m); any = true; } if (!any) toast(e.error.message); }
const tryApi = async (fn) => { try { return await fn(); } catch (e) { if (!e?.error) throw e; toast(e.error.message); return null; } };
const closeModals = () => $$(".modal").forEach((m) => (m.hidden = true));

/* ---------- navigation (guests only see Home) ---------- */
function go(v) {
  if (!user && v !== "home") { pendingView = v; toast("Please log in or sign up to continue."); openAuth("login"); return; }
  $$(".view").forEach((x) => x.classList.toggle("on", x.id === "v-" + v));
  const k = { chat: "msgs" }[v] || v; $$("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.go === k));
  ({ quests: renderQuests, wallet: renderWallet, tx: renderTx, msgs: renderConvs, profile: renderProfile })[v]?.();
  scrollTo(0, 0);
}
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go);
  if (e.target.closest("[data-close]") || e.target.classList.contains("modal")) { closeModals(); pendingView = null; }
  const q = e.target.closest("[data-qid]"); if (q) openQuest(q.dataset.qid);
  const c = e.target.closest("[data-conv]"); if (c) openChat(c.dataset.conv);
  const a = e.target.closest("[data-act]"); if (a) questAction(a.dataset.act, a.dataset.uid);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });
$(".brand").addEventListener("keydown", (e) => { if (e.key === "Enter") go("home"); });

/* ---------- log in / sign up ---------- */
function openAuth(tab) {
  $("#tabLogin").classList.toggle("on", tab === "login"); $("#tabSignup").classList.toggle("on", tab === "signup");
  $("#loginForm").hidden = tab !== "login"; $("#signupForm").hidden = tab !== "signup";
  clearErrs($("#loginForm")); clearErrs($("#signupForm")); $("#authModal").hidden = false;
  setTimeout(() => $(tab === "login" ? "#loginForm input" : "#signupForm input").focus(), 50);
}
$("#authBtn").onclick = () => { pendingView = null; openAuth("login"); };
$("#tabLogin").onclick = () => openAuth("login"); $("#tabSignup").onclick = () => openAuth("signup");
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target; clearErrs(f);
  const email = f.email.value.trim(), pw = f.password.value, em = checkEmail(email);
  const ok = [setErr(f, "email", em.startsWith("Did you") ? "" : em), setErr(f, "password", pw ? "" : "Please enter your password.")];
  if (ok.includes(false)) return;
  try { signIn(await api.auth.login({ email, password: pw })); f.reset(); } catch (er) { showApiError(f, er); }
});
$("#signupForm").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target; clearErrs(f);
  const name = f.name.value.trim(), email = f.email.value.trim(), pw = f.password.value;
  const ok = [setErr(f, "name", name.length < 2 ? "Please enter your full name." : ""), setErr(f, "email", checkEmail(email)), setErr(f, "password", checkPass(pw)), setErr(f, "confirm", f.confirm.value !== pw ? "Passwords do not match." : "")];
  if (ok.includes(false)) return;
  try { signIn(await api.auth.register({ name, email, password: pw }), true); f.reset(); } catch (er) { showApiError(f, er); }
});
function signIn(u, fresh) {
  user = u; closeModals(); paint(); const t = pendingView || "home"; pendingView = null;
  scope = "open"; $$("#scopes .chip").forEach((c) => c.classList.toggle("on", c.dataset.s === "open")); $("#search").value = ""; curQuest = curConv = null;
  go(t);
  toast(fresh ? "Account created. Welcome, " + u.name.split(" ")[0] + "!" : "Welcome back, " + u.name.split(" ")[0] + "!");
}
$("#logout").onclick = async () => { await api.auth.logout(); user = null; curQuest = curConv = null; paint(); go("home"); toast("You have been logged out."); };
function paint() {
  $("#authBtn").hidden = !!user; $("#meBtn").hidden = !user;
  $$("[data-avatar]").forEach((el) => { el.dataset.ini = initials(user?.name); el.classList.toggle("has", !!user?.photo_url); el.style.backgroundImage = user?.photo_url ? `url("${user.photo_url}")` : ""; });
  const h = new Date().getHours(); $("#greet").textContent = (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + (user ? ", " + user.name.split(" ")[0] : "");
}

/* ---------- post a quest (client) ---------- */
$("#useLoc").onclick = () => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => { postLoc = { lat: p.coords.latitude, lng: p.coords.longitude }; toast("Map pin set to your current location."); }, () => toast("Couldn't get your location. A default pin will be used."), { timeout: 8000 }) : toast("Location isn't available in this browser.");
$("#postForm").elements.photo.addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) { postPhoto = ""; $("#pPrev").hidden = true; return; }
  postPhoto = await shrink(f, 640); $("#pPrev").src = postPhoto; $("#pPrev").hidden = false;
});
$("#postForm").addEventListener("submit", (e) => {
  e.preventDefault(); const f = e.target; clearErrs(f);
  const d = { title: f.title.value, location: f.location.value, description: f.description.value, qualification: f.qualification.value, pay: Math.round(+f.pay.value * 100), duration_minutes: Math.round(+f.duration.value) };
  const ok = [setErr(f, "title", d.title.trim().length < 5 ? "Enter a title (at least 5 characters)." : ""), setErr(f, "location", d.location.trim() ? "" : "Enter the work location."),
    setErr(f, "description", d.description.trim().length < 10 ? "Describe the work (at least 10 characters)." : ""), setErr(f, "pay", d.pay >= 5000 ? "" : "Offered pay must be at least ₱50."),
    setErr(f, "duration", d.duration_minutes >= 5 ? "" : "Enter the duration in minutes (5 or more).")];
  if (ok.includes(false)) return;
  postDraft = d;
  $("#cSummary").innerHTML = `<div class="sum"><b>${esc(d.title.trim())}</b><br>${esc(d.location.trim())}<br>Pay <b>${pesoC(d.pay)}</b> · ${d.duration_minutes} min${postPhoto ? " · photo attached" : ""}</div>`;
  $("#confirmModal").hidden = false;
});
$("#cYes").onclick = async () => {
  const loc = postLoc || { lat: me.lat + (Math.random() - .5) * .01, lng: me.lng + (Math.random() - .5) * .01 }; // demo: the backend should geocode the address text
  const q = await tryApi(() => api.quests.create({ ...postDraft, ...loc, photo_url: postPhoto })); if (!q) return;
  closeModals(); const f = $("#postForm"); f.reset(); postLoc = null; postPhoto = ""; $("#pPrev").hidden = true;
  scope = "mine"; $$("#scopes .chip").forEach((c) => c.classList.toggle("on", c.dataset.s === "mine")); go("quests"); toast("Your quest has been published!");
};

/* ---------- quests (worker) ---------- */
async function renderQuests() {
  const key = me.lat.toFixed(3) + me.lng.toFixed(3); if ($("#qMap").dataset.k !== key) { $("#qMap").dataset.k = key; $("#qMap").src = `https://maps.google.com/maps?q=${me.lat},${me.lng}&z=14&output=embed`; }
  const list = await tryApi(() => api.quests.list({ lat: me.lat, lng: me.lng, scope, q: $("#search").value })); if (!list) return;
  const empty = { open: "No quests yet. When clients publish quests, they will show up here.", mine: "You haven't posted any quests yet.", jobs: "You haven't accepted any quests yet." }[scope];
  $("#qList").innerHTML = list.length ? list.map((q) => `<button class="qcard" data-qid="${q.id}"><div class="thumb" style="${q.photo_url ? `background-image:url('${q.photo_url}')` : ""}">${q.photo_url ? "" : "▣"}</div>
    <div class="qc-b"><div class="row"><b>${esc(q.title)}</b><span class="price">${pesoC(q.pay)}</span></div><small>${esc(q.description)}</small><small>Qualification: ${esc(q.qualification || "None")}</small>
    <small>${[fmtKm(q.distance_km), q.duration_minutes + " min", ago(q.created_at)].filter(Boolean).join(" · ")} ${scope === "open" ? "" : `<span class="pill st-${q.status}">${q.status}</span>`}</small></div></button>`).join("")
    : `<p class="empty" style="grid-column:1/-1">${empty}${scope === "open" ? "" : ""}</p>`;
}
$("#scopes").onclick = (e) => { const c = e.target.closest(".chip"); if (!c) return; scope = c.dataset.s; $$("#scopes .chip").forEach((x) => x.classList.toggle("on", x === c)); renderQuests(); };
$("#search").oninput = renderQuests;

async function openQuest(qid) {
  const q = await tryApi(() => api.quests.get(qid, { lat: me.lat, lng: me.lng })); if (!q) return; curQuest = q;
  const mine = q.client_id === user.id, mineJob = q.worker_id === user.id; let acts = "";
  if (!mine && q.status === "open") acts = `<button class="primary" data-act="accept">Accept Quest</button><button class="btn ghost full" data-act="msg" data-uid="${q.client_id}">Message client</button>`;
  else if (mine && q.status === "open") acts = `<button class="btn ghost full danger" data-act="cancel">Cancel quest</button>`;
  else if (mine && q.status === "accepted") acts = `<button class="primary" data-act="complete">Mark as completed and pay ${pesoC(q.pay)}</button><button class="btn ghost full" data-act="msg" data-uid="${q.worker_id}">Message worker</button>`;
  else if (mineJob && q.status === "accepted") acts = `<p class="hint">You accepted this quest. The client will mark it complete and your wallet will be paid.</p><button class="btn ghost full" data-act="msg" data-uid="${q.client_id}">Message client</button>`;
  $("#dCard").innerHTML = `${q.photo_url ? `<img class="qimg" src="${q.photo_url}" alt="Quest photo">` : ""}<small>Posted ${ago(q.created_at)} · <span class="pill st-${q.status}">${q.status}</span></small>
    <h2>${esc(q.title)}</h2><span class="price xl">${pesoC(q.pay)}</span>
    <div class="facts"><div><small>Duration</small>${q.duration_minutes} min</div><div><small>Distance</small>${fmtKm(q.distance_km) || "—"}</div><div><small>Location</small>${esc(q.location)}</div></div>
    <p class="body"><b>Description:</b> ${esc(q.description)}</p><p class="body"><b>Qualification:</b> ${esc(q.qualification || "None required")}</p>
    <div class="poster">${av(q.client)}<div><b style="font-size:13px">${esc(q.client.name)}</b><br><small>${mine ? "You posted this" : "Client"}</small></div></div><div class="pbtns">${acts}</div>`;
  const dest = q.lat != null ? `${q.lat},${q.lng}` : encodeURIComponent(q.location);
  $("#dMap").src = `https://maps.google.com/maps?saddr=${me.lat},${me.lng}&daddr=${dest}&output=embed`;
  $("#dCap").innerHTML = `${q.distance_km != null ? `The client is ${fmtKm(q.distance_km)} from you. ` : ""}<a class="link" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${me.lat},${me.lng}&destination=${dest}&travelmode=driving">Open in Google Maps</a>`;
  go("quest");
}
async function questAction(act, uid) {
  if (act === "msg") { const c = await tryApi(() => api.messages.open(uid, curQuest.id)); if (c) openChat(c.id); return; }
  const fn = { accept: api.quests.accept, complete: api.quests.complete, cancel: api.quests.cancel }[act];
  const r = await tryApi(() => fn(curQuest.id)); if (!r) return;
  toast({ accept: "Quest accepted. Say hello to the client in Messages.", complete: "Quest completed. The worker has been paid from your wallet.", cancel: "Quest cancelled." }[act]);
  openQuest(curQuest.id);
}

/* ---------- wallet + transactions ---------- */
async function renderWallet() { const w = await tryApi(() => api.wallet.get()); if (w) $("#wBal").textContent = peso2(w.balance); }
async function openMoney(mode) {
  moneyMode = mode; const f = $("#moneyForm"); clearErrs(f); f.reset(); const w = await tryApi(() => api.wallet.get()); if (!w) return;
  $("#mTitle").textContent = mode === "deposit" ? "Deposit funds" : "Withdraw funds"; $("#mGo").textContent = mode === "deposit" ? "Deposit" : "Withdraw";
  $("#mBal").textContent = peso2(w.balance); $("#gLbl").hidden = mode === "deposit"; f.gcash.value = user.gcash || ""; $("#moneyModal").hidden = false;
  setTimeout(() => (mode === "deposit" || user.gcash ? f.amount : f.gcash).focus(), 50);
}
$("#dpBtn").onclick = () => openMoney("deposit"); $("#wdBtn").onclick = () => openMoney("withdraw");
$("#moneyForm").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target; clearErrs(f); const amount = Math.round(+f.amount.value * 100);
  try {
    if (moneyMode === "deposit") await api.wallet.deposit(amount); else await api.wallet.withdraw({ amount, gcash: f.gcash.value });
    closeModals(); renderWallet(); toast(pesoC(amount) + (moneyMode === "deposit" ? " added to your wallet." : " withdrawal requested."));
    if (moneyMode === "withdraw") user.gcash = f.gcash.value.replace(/[\s-]/g, "");
  } catch (er) { showApiError(f, er); }
});
async function renderTx() {
  const t = await tryApi(() => api.wallet.transactions()); if (!t) return;
  const line = (x) => { const n = x.counterparty?.name || "Someone", a = peso2(Math.abs(x.amount)); return {
    quest_earning: `You finished a quest${x.quest_title ? ` “${esc(x.quest_title)}”` : ""}. <b>${a}</b> has been added to your wallet.`,
    quest_payment: `${esc(n)} completed a quest you posted. <b>${a}</b> has been deducted from your wallet as payment.`,
    deposit: `You deposited <b>${a}</b> to your wallet.`, withdrawal: `You withdrew <b>${a}</b> to GCash •••• ${esc((x.account || "").slice(-4))}.` }[x.type]; };
  $("#txList").innerHTML = t.length ? t.map((x) => `<div class="txr"><span class="sign ${x.amount < 0 ? "neg" : "pos"}">${x.amount < 0 ? "−" : "+"}</span><div><p>${line(x)}</p><small>${esc(x.id)} · ${ago(x.created_at)}</small></div></div>`).join("")
    : `<p class="empty">No transactions yet. Deposits, withdrawals and quest payments will appear here.</p>`;
}

/* ---------- messages ---------- */
async function renderConvs() {
  const c = await tryApi(() => api.messages.conversations()); if (!c) return;
  $("#cList").innerHTML = c.length ? c.map((x) => { const mineLast = x.last?.sender_id === user.id;
    const note = !x.last ? "No messages yet. Say hello!" : mineLast ? "You: " + x.last.body : (x.other_role ? `A ${x.other_role} messaged you` : "Messaged you") + " · " + x.last.body;
    return `<button class="qi conv" data-conv="${x.id}">${av(x.other)}<div><b>${esc(x.other.name)}</b><small>${esc(note)}</small></div></button>`; }).join("")
    : `<p class="empty">No conversations yet. Accept a quest or message a client to start chatting.</p>`;
}
async function openChat(cid) { curConv = cid; await refreshChat(true); go("chat"); }
async function refreshChat(force) {
  if (!curConv) return; const [convs, msgs] = await Promise.all([tryApi(() => api.messages.conversations()), tryApi(() => api.messages.list(curConv))]);
  const c = convs?.find((x) => x.id === curConv); if (!c || !msgs) return;
  $("#chName").textContent = c.other.name; $("#chAv").outerHTML = av(c.other).replace("<span", '<span id="chAv"');
  const log = $("#chLog"), sig = msgs.length + ":" + (msgs.at(-1)?.id || ""); if (!force && log.dataset.sig === sig) return; log.dataset.sig = sig;
  const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  log.innerHTML = msgs.length ? msgs.map((m) => m.sender_id === user.id ? `<div class="m me"><span class="b">${esc(m.body)}</span><small>${clock(m.created_at)}</small></div>`
    : `<div class="m">${av(c.other)}<span class="b">${esc(m.body)}</span><small>${clock(m.created_at)}</small></div>`).join("") : `<p class="empty">No messages yet. Write the first one below.</p>`;
  if (force || near) log.scrollTop = log.scrollHeight;
}
$("#chForm").addEventListener("submit", async (e) => {
  e.preventDefault(); const i = $("#chIn"); if (!i.value.trim()) return;
  const m = await tryApi(() => api.messages.send(curConv, i.value)); if (m) { i.value = ""; refreshChat(true); }
});
setInterval(() => { if (!user) return; if ($("#v-chat").classList.contains("on")) refreshChat(false); else if ($("#v-msgs").classList.contains("on")) renderConvs(); }, 3000);

/* ---------- profile ---------- */
function renderProfile() { $("#fName").value = user.name; $("#fLoc").value = user.location; $("#fBio").value = user.bio; $("#fSkills").value = user.skills; }
$("#profForm").addEventListener("submit", async (e) => {
  e.preventDefault(); const u = await tryApi(() => api.users.update({ name: $("#fName").value, location: $("#fLoc").value.trim(), bio: $("#fBio").value.trim(), skills: $("#fSkills").value.trim() }));
  if (u) { user = { ...user, ...u }; paint(); toast("Profile saved."); }
});
$("#avIn").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return; const u = await tryApi(async () => api.users.update({ photo_url: await shrink(f, 300) }));
  if (u) { user = { ...user, ...u }; paint(); toast("Photo updated."); }
});

/* ---------- install as an app (PWA) ---------- */
let installEv = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEv = e; $("#installBtn").hidden = false; });
$("#installBtn").onclick = async () => { if (!installEv) return; installEv.prompt(); await installEv.userChoice; installEv = null; $("#installBtn").hidden = true; };
addEventListener("appinstalled", () => toast("Questfinder was installed."));
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) $("#iosHint").hidden = false;
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});

/* ---------- start ---------- */
(async function boot() {
  user = await api.auth.me(); paint();
  navigator.geolocation?.getCurrentPosition((p) => { me = { lat: p.coords.latitude, lng: p.coords.longitude }; if ($("#v-quests").classList.contains("on")) renderQuests(); }, () => {}, { timeout: 8000 });
})();
