/* Questfinder v2 (frontend demo: data is kept in this browser's localStorage) */

// Demo admin account. In the real system this lives in the database, never in the page.
const ADMIN = { email: "admin@questfinder.ph", pass: "Admin@1234" };
let me = { lat: 16.4150, lng: 120.6000 }; // fallback "worker" location, replaced by GPS if allowed

const SEED = []; // no sample quests: every quest is posted by a user

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const peso = (n) => "₱" + Number(n).toLocaleString("en-PH");
const db = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { toast("Storage is full. Try a smaller photo."); } } };
const sha = async (s) => { if (!window.crypto?.subtle) return btoa(s); const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); };
const toast = (m) => { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600); };

let users = db.get("qf-users", []), user = null, posted = db.get("qf-posted", []);
let wal = { txns: [], gcash: "" }, pendingView = null, selTx = null, wFilter = "All";
let act = { doing: [], posted: [] }, actTab = "doing", cat = "All", selId = null, postCat = "", aFilter = "All";
const allQuests = () => [...posted, ...SEED];
const initials = (n) => (n || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/* ---------- distance (km) ---------- */
const km = (a, b) => { const r = (d) => d * Math.PI / 180, h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const fmtKm = (d) => (d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(1) + " km");

/* ---------- navigation ---------- */
function go(v) {
  const admin = user?.role === "admin";
  if (admin && !["admin", "profile"].includes(v)) v = "admin";
  if (v === "admin" && !admin) v = "home";
  // Everything except Home needs an account. Guests get the log in / sign up pop-up instead.
  if (!user && v !== "home") { pendingView = v; toast("Please log in or sign up to continue."); openAuth("login"); return; }
  $$(".view").forEach((x) => x.classList.toggle("on", x.id === "v-" + v));
  $$(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.go === v || (v === "quest2" && b.dataset.go === "quests")));
  if (v === "activity") renderAct(); if (v === "profile") renderProfile(); if (v === "admin") renderAdmin(); if (v === "wallet") renderWallet();
  closePanel(); scrollTo(0, 0);
}
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go);
  if (e.target.closest("[data-close]") || e.target.classList.contains("modal")) { $$(".modal").forEach((m) => (m.hidden = true)); pendingView = null; }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $$(".modal").forEach((m) => (m.hidden = true)); closePanel(); } });
$(".brand").addEventListener("keydown", (e) => { if (e.key === "Enter") go("home"); });

/* ---------- auth ---------- */
const TYPOS = { "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gmail.co": "gmail.com", "yaho.com": "yahoo.com", "hotmial.com": "hotmail.com", "outlok.com": "outlook.com" };
function checkEmail(v) {
  if (!v) return "Please enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) || v.includes("..")) return "That doesn't look like a valid email address.";
  const d = v.split("@")[1].toLowerCase(); if (TYPOS[d]) return `Did you mean ${v.split("@")[0]}@${TYPOS[d]}?`;
  return ""; // Confirming the mailbox really exists needs a verification email sent by the backend.
}
const checkPass = (p) => !p ? "Please enter a password." : p.length < 8 ? "Password must be at least 8 characters." : !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p) ? "Use uppercase, lowercase and a number." : "";
function setErr(form, name, msg) { const i = form.elements[name], e = i.closest("label").querySelector(".err"); e.textContent = msg; i.classList.toggle("bad", !!msg); return !msg; }
function clearErrs(form) { $$(".err", form).forEach((e) => (e.textContent = "")); $$("input", form).forEach((i) => i.classList.remove("bad")); }
function openAuth(tab = "login") {
  $("#tabLogin").classList.toggle("on", tab === "login"); $("#tabSignup").classList.toggle("on", tab === "signup");
  $("#loginForm").hidden = tab !== "login"; $("#signupForm").hidden = tab !== "signup";
  clearErrs($("#loginForm")); clearErrs($("#signupForm")); $("#authModal").hidden = false;
  setTimeout(() => $(tab === "login" ? "#loginForm input" : "#signupForm input").focus(), 50);
}
$("#authBtn").onclick = () => { pendingView = null; openAuth("login"); };
$("#tabLogin").onclick = () => openAuth("login"); $("#tabSignup").onclick = () => openAuth("signup");
const needLogin = () => { if (user) return false; toast("Please log in or sign up first."); openAuth("login"); return true; };

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target; clearErrs(f);
  const email = f.email.value.trim().toLowerCase(), pw = f.password.value;
  if (!setErr(f, "email", checkEmail(email).startsWith("Did you") ? "" : checkEmail(email)) | !setErr(f, "password", pw ? "" : "Please enter your password.")) return;
  const u = users.find((x) => x.email === email);
  if (!u) return setErr(f, "email", "No account found for this email. Try signing up.");
  if ((await sha(pw)) !== u.hash) return setErr(f, "password", "Incorrect password. Please try again.");
  if (u.status === "Suspended") return setErr(f, "email", "This account has been suspended. Contact the barangay admin.");
  signIn(u); $("#authModal").hidden = true; f.reset(); toast(u.role === "admin" ? "Welcome back, admin." : "Welcome back, " + u.name.split(" ")[0] + "!");
});
$("#signupForm").addEventListener("submit", async (e) => {
  e.preventDefault(); const f = e.target; clearErrs(f);
  const name = f.name.value.trim(), email = f.email.value.trim().toLowerCase(), pw = f.password.value;
  const ok = [setErr(f, "name", name.length < 2 ? "Please enter your full name." : ""), setErr(f, "email", checkEmail(email)), setErr(f, "password", checkPass(pw)), setErr(f, "confirm", f.confirm.value !== pw ? "Passwords do not match." : "")];
  if (ok.includes(false)) return;
  if (users.some((x) => x.email === email)) return setErr(f, "email", "This email is already registered. Try logging in.");
  const u = { email, hash: await sha(pw), name, role: "user", status: "Needs review", loc: "", bio: "", skills: "", photo: "", checks: { id: 0, ph: 0, bg: 0 }, joined: Date.now() };
  users.push(u); db.set("qf-users", users); signIn(u); $("#authModal").hidden = true; f.reset(); toast("Account created. Welcome, " + name.split(" ")[0] + "!");
});
function signIn(u) {
  user = u; act = db.get("qf-act-" + u.email, { doing: [], posted: [] }); wal = db.get("qf-wallet-" + u.email, { txns: [], gcash: "" }); db.set("qf-session", u.email);
  const target = u.role === "admin" ? "admin" : pendingView || "home"; pendingView = null;
  paintAuth(); renderAll(); go(target);
}
$("#logout").onclick = () => { user = null; localStorage.removeItem("qf-session"); act = { doing: [], posted: [] }; wal = { txns: [], gcash: "" }; paintAuth(); renderAll(); go("home"); toast("You have been logged out."); };
$("#meBtn").onclick = () => go("profile");
function paintAuth() {
  const a = user?.role === "admin";
  $("#authBtn").hidden = !!user; $("#meBtn").hidden = !user; $("#logout").hidden = !user;
  $("#nav").hidden = a; $("#adminNav").hidden = !a; $("#adminTag").hidden = !a;
  $$("[data-avatar]").forEach((el) => { el.dataset.ini = initials(user?.name); el.classList.toggle("has", !!user?.photo); el.style.backgroundImage = user?.photo ? `url("${user.photo}")` : ""; });
  $("#recentWrap").hidden = !user; renderRecent();
  const h = new Date().getHours(); $("#greet").textContent = (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + (user ? ", " + user.name.split(" ")[0] : "");
}

/* ---------- quests ---------- */
function renderAll() { renderQuests(); renderRecent(); }
function renderRecent() {
  const q = allQuests().slice(0, 5);
  $("#recent").innerHTML = !q.length ? `<p class="empty">No quests yet. Be the first to post one.</p>` : q.map((x) => `<button class="qc" data-open="${x.id}"><div class="r"><small>${esc(x.cat)}</small><span class="price" style="font-size:16px">${peso(x.price)}</span></div><b>${esc(x.title)}</b><small>${fmtKm(km(me, x))} · ${esc(x.client)} · ${esc(x.posted)}</small></button>`).join("");
  $("#openN").textContent = user && allQuests().length ? `Browse paid quests around you. ${allQuests().length} open nearby.` : "Browse paid quests around you and pick the ones that fit your schedule.";
}
function renderQuests() {
  const term = $("#search").value.trim().toLowerCase(), sort = $("#sort").value;
  const list = allQuests().filter((q) => (cat === "All" || q.cat === cat) && (q.title + q.cat + q.details).toLowerCase().includes(term))
    .sort((a, b) => (sort === "pay" ? b.price - a.price : km(me, a) - km(me, b)));
  $("#qSub").textContent = `${list.length} open quest${list.length === 1 ? "" : "s"} near you`;
  $("#qList").innerHTML = list.length ? list.map((q) => `<button class="qi ${q.id === selId ? "sel" : ""}" data-id="${q.id}"><small>${esc(q.cat)} · ${esc(q.posted)}</small><div class="row"><span>${esc(q.title)}</span><span class="price">${peso(q.price)}</span></div><small>${fmtKm(km(me, q))} away · ${esc(q.takes)} · ${esc(q.when)}</small></button>`).join("") : `<p class="empty">${allQuests().length ? "No quests match your search." : "No quests have been posted yet. Be the first to post one!"}</p>`;
}
$("#search").oninput = renderQuests; $("#sort").onchange = renderQuests;
$("#filters").onclick = (e) => { const c = e.target.closest(".chip"); if (!c) return; cat = c.dataset.cat; $$("#filters .chip").forEach((x) => x.classList.toggle("on", x === c)); renderQuests(); };
const hoverOK = () => matchMedia("(hover:hover) and (min-width:901px)").matches;
$("#qList").addEventListener("mouseover", (e) => { const i = e.target.closest(".qi"); if (i && hoverOK() && +i.dataset.id !== selId) select(+i.dataset.id); });
$("#qList").addEventListener("click", (e) => { const i = e.target.closest(".qi"); if (i) select(+i.dataset.id, true); });
document.addEventListener("click", (e) => { const o = e.target.closest("[data-open]"); if (o) openQuest2(+o.dataset.open); });
const closePanel = () => $("#qPanel").classList.remove("open");

function select(id, click) {
  const q = allQuests().find((x) => x.id === id); if (!q) return; selId = id;
  $$(".qi").forEach((x) => x.classList.toggle("sel", +x.dataset.id === id));
  $("#qPanel").innerHTML = `<button class="pclose" aria-label="Close" onclick="closePanel()">×</button>
    <small>${esc(q.cat)} · Posted ${esc(q.posted)}</small><h2>${esc(q.title)}</h2><span class="price">${peso(q.price)}</span>
    <div class="facts"><div><small>When</small>${esc(q.when)}</div><div><small>Takes</small>${esc(q.takes)}</div><div><small>Distance</small>${fmtKm(km(me, q))}</div></div>
    <p style="font-size:14px;line-height:1.6">${esc(q.details)}</p>
    <div class="poster"><div class="avatar" style="background:var(--peach)">${esc(initials(q.client))}</div><div><b style="font-size:13px">${esc(q.client)}</b><br><small>Verified neighbour</small></div></div>
    <button class="primary" data-open="${q.id}">Offer to help for ${peso(q.price)}</button>`;
  if (click || !hoverOK()) $("#qPanel").classList.add("open");
}

/* ---------- Quest page 2: details + route map + accept ---------- */
function openQuest2(id) {
  const q = allQuests().find((x) => x.id === id); if (!q) return; const d = fmtKm(km(me, q));
  $("#q2Card").innerHTML = `<small>${esc(q.cat)} · Posted ${esc(q.posted)}</small><h2>${esc(q.title)}</h2><span class="price xl">${peso(q.price)}</span>
    <div class="facts"><div><small>When</small>${esc(q.when)}</div><div><small>Takes</small>${esc(q.takes)}</div><div><small>Distance</small>${d}</div></div>
    <p style="font-size:14px;line-height:1.6">${esc(q.details)}</p>
    <div class="poster"><div class="avatar" style="background:var(--peach)">${esc(initials(q.client))}</div><div><b style="font-size:13px">${esc(q.client)}</b><br><small>Verified neighbour</small></div></div>
    <button class="primary" id="acceptBtn">Accept Task</button>`;
  $("#q2Map").src = `https://maps.google.com/maps?saddr=${me.lat},${me.lng}&daddr=${q.lat},${q.lng}&output=embed`;
  $("#q2Cap").innerHTML = `You are ${d} from the client. <a class="link" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${me.lat},${me.lng}&destination=${q.lat},${q.lng}&travelmode=driving">Open in Google Maps</a>`;
  $("#acceptBtn").onclick = () => {
    if (needLogin()) return;
    if (q.owner === user.email) return toast("You can't accept your own quest.");
    if (!act.doing.some((a) => a.id === q.id)) {
      act.doing.unshift({ id: q.id, title: q.title, client: q.client, date: dateStr(), amount: q.price, status: "In progress" });
      wal.txns.unshift(newTxn({ type: "Quest payment", title: q.title, amount: q.price, status: "Pending", quest: q.title, questId: q.id, via: "Questfinder escrow", note: `Released once ${q.client} confirms the quest is complete.` })); saveWal();
    }
    saveAct(); actTab = "doing"; go("activity"); toast("Task accepted! Check Activity for progress.");
  };
  go("quest2");
}
const dateStr = () => new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric" });
const saveAct = () => user && db.set("qf-act-" + user.email, act);

/* ---------- post a quest ---------- */
$("#pCats").onclick = (e) => { const c = e.target.closest(".chip"); if (!c) return; postCat = c.dataset.cat; $$("#pCats .chip").forEach((x) => x.classList.toggle("on", x === c)); $("#catErr").textContent = ""; };
$("#postForm").addEventListener("submit", (e) => {
  e.preventDefault(); if (needLogin()) return;
  const t = $("#pTitle"), r = $("#pReward"); let ok = true;
  const bad = (el, m) => { el.classList.add("bad"); (el.closest("label").querySelector(".err")).textContent = m; ok = false; };
  [t, r].forEach((el) => { el.classList.remove("bad"); el.closest("label").querySelector(".err").textContent = ""; });
  if (t.value.trim().length < 5) bad(t, "Please describe the task (at least 5 characters).");
  if (!postCat) { $("#catErr").textContent = "Please choose a category."; ok = false; }
  if (!(+r.value >= 50)) bad(r, "Enter a reward of at least ₱50.");
  if (!ok) return;
  $("#cSummary").innerHTML = `<div class="sum"><b>${esc(t.value.trim())}</b><br>${esc(postCat)} · Reward <b>${peso(r.value)}</b><br>${esc($("#pDuration").value || "Flexible")} · ${esc($("#pWhen").value || "Flexible timing")}</div>`;
  $("#confirmModal").hidden = false;
});
$("#cYes").onclick = () => {
  const q = { id: Date.now(), owner: user.email, title: $("#pTitle").value.trim(), cat: postCat, price: +$("#pReward").value, posted: "Just now", takes: $("#pDuration").value.trim() || "Flexible", when: $("#pWhen").value.trim() || "Flexible timing", client: user.name, details: $("#pDetails").value.trim() || "No extra details.",
    lat: me.lat + (Math.random() - .5) * .01, lng: me.lng + (Math.random() - .5) * .01 }; // demo only: replace with a real address/pin picker
  posted.unshift(q); db.set("qf-posted", posted);
  act.posted.unshift({ id: q.id, title: q.title, client: "Open for offers", date: dateStr(), amount: q.price, status: "Open" }); saveAct();
  $("#confirmModal").hidden = true; $("#postForm").reset(); postCat = ""; $$("#pCats .chip").forEach((x) => x.classList.remove("on"));
  renderAll(); go("quests"); toast("Your quest has been posted! You can also find it in Activity.");
};

/* ---------- activity ---------- */
function renderAct() {
  const rows = act[actTab], doneSum = (l) => l.filter((a) => a.status === "Completed").reduce((s, a) => s + a.amount, 0);
  $("#earnLbl").textContent = "Earned in " + new Date().toLocaleString("en-PH", { month: "long" });
  $("#sEarn").textContent = peso(doneSum(act.doing)); $("#sSpent").textContent = peso(doneSum(act.posted));
  $("#sDone").textContent = act.doing.filter((a) => a.status === "Completed").length; $("#nDoing").textContent = act.doing.length; $("#nPosted").textContent = act.posted.length;
  $("#tDoing").classList.toggle("on", actTab === "doing"); $("#tPosted").classList.toggle("on", actTab === "posted");
  $("#aList").innerHTML = !user ? `<p class="empty">Log in to see your activity.</p>` : rows.length ? rows.map((a, i) => `<div class="arow"><div><b>${esc(a.title)}</b><small>${actTab === "doing" ? "For " : ""}${esc(a.client)} · ${esc(a.date)}</small></div>
    <span class="pill ${a.status === "In progress" ? "s-p" : a.status === "Open" ? "s-o" : ""}">${esc(a.status)}</span><b class="amt">${actTab === "doing" ? "+" : ""}${peso(a.amount)}</b>
    ${a.status !== "Completed" ? `<button class="done" data-done="${i}" title="Mark complete" aria-label="Mark complete">✓</button>` : `<span style="width:30px"></span>`}</div>`).join("")
    : `<p class="empty">${actTab === "doing" ? "No quests yet. Find one and tap “Accept Task”." : "You haven't posted any quests yet."}</p>`;
}
$("#tDoing").onclick = () => { actTab = "doing"; renderAct(); }; $("#tPosted").onclick = () => { actTab = "posted"; renderAct(); };
$("#aList").onclick = (e) => {
  const b = e.target.closest("[data-done]"); if (!b) return; const a = act[actTab][+b.dataset.done]; a.status = "Completed"; saveAct();
  if (actTab === "doing") { const x = wal.txns.find((t) => t.questId === a.id && t.status === "Pending"); if (x) { x.status = "Completed"; x.note = "Payment released to your wallet."; saveWal(); } }
  renderAct(); toast(actTab === "doing" ? "Completed! " + peso(a.amount) + " added to your wallet." : "Marked as completed.");
};

/* ---------- profile (blank until the user fills it in) ---------- */
function renderProfile() {
  if (!user) return;
  $("#fName").value = user.name; $("#fLoc").value = user.loc || ""; $("#fBio").value = user.bio || ""; $("#fSkills").value = user.skills || "";
  $("#pDone").textContent = act.doing.filter((a) => a.status === "Completed").length;
  const c = user.checks; $("#pChecks").innerHTML = [["id", "ID"], ["ph", "Phone"], ["bg", "Background check"]].map(([k, l]) => `<li class="${c[k] ? "ok" : ""}">${l} ${c[k] ? "verified" : "not verified yet"}</li>`).join("");
  const s = (user.skills || "").split(",").map((x) => x.trim()).filter(Boolean);
  $("#pSkills").innerHTML = s.length ? s.map((x) => `<span class="tag">${esc(x)}</span>`).join("") : `<small>Add your skills so neighbours know what you're good at.</small>`;
}
$("#profForm").addEventListener("submit", (e) => {
  e.preventDefault(); const n = $("#fName").value.trim(); if (n.length < 2) return toast("Please enter your name.");
  Object.assign(user, { name: n, loc: $("#fLoc").value.trim(), bio: $("#fBio").value.trim(), skills: $("#fSkills").value.trim() });
  db.set("qf-users", users); paintAuth(); renderProfile(); toast("Profile saved.");
});
$("#avIn").addEventListener("change", (e) => { // photo is shrunk to 300px so it fits in browser storage
  const f = e.target.files[0]; if (!f || !user) return; const img = new Image(), r = new FileReader();
  r.onload = () => { img.onload = () => { const s = Math.min(1, 300 / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s;
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); user.photo = c.toDataURL("image/jpeg", .85); db.set("qf-users", users); paintAuth(); toast("Photo updated."); }; img.src = r.result; };
  r.readAsDataURL(f);
});

/* ---------- wallet ---------- */
const peso2 = (n) => "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const saveWal = () => user && db.set("qf-wallet-" + user.email, wal);
const newTxn = (o) => ({ id: "TXN-" + Math.random().toString(36).slice(2, 8).toUpperCase(), ts: Date.now(), ...o });
const fmtD = (t) => new Date(t).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
const fmtT = (t) => new Date(t).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
const maskG = () => (wal.gcash ? "GCash •••• " + wal.gcash.slice(-4) : "");
const availBal = () => wal.txns.filter((x) => x.status === "Completed").reduce((s, x) => s + x.amount, 0);
function renderWallet() {
  if (!user) return;
  const t = wal.txns, sum = (l) => l.reduce((s, x) => s + x.amount, 0), qp = (s) => t.filter((x) => x.type === "Quest payment" && x.status === s);
  $("#wBal").textContent = peso2(availBal());
  $("#wTotal").textContent = peso2(sum(qp("Completed"))); $("#wTotalN").textContent = `From ${qp("Completed").length} completed quest${qp("Completed").length === 1 ? "" : "s"}`;
  $("#wPend").textContent = peso2(sum(qp("Pending"))); $("#wPendN").textContent = `${qp("Pending").length} payment${qp("Pending").length === 1 ? "" : "s"} awaiting release`;
  $("#payName").textContent = wal.gcash ? maskG() : "Add payout method"; $("#paySub").textContent = wal.gcash ? user.name + " · Payout method" : "GCash";
  const lab = { "Quest payment": "Quest payments", Withdrawal: "Withdrawals", Refund: "Refunds" };
  $("#wFilters").innerHTML = `<button class="chip ${wFilter === "All" ? "on" : ""}" data-f="All">All <small>${t.length}</small></button>` +
    Object.keys(lab).map((k) => `<button class="chip ${wFilter === k ? "on" : ""}" data-f="${k}">${lab[k]} <small>${t.filter((x) => x.type === k).length}</small></button>`).join("");
  const term = $("#wSearch").value.trim().toLowerCase(), st = $("#wStatus").value;
  const rows = t.filter((x) => (wFilter === "All" || x.type === wFilter) && (st === "All" || x.status === st) && (x.title + x.id).toLowerCase().includes(term)).sort((a, b) => b.ts - a.ts);
  if (!rows.some((x) => x.id === selTx)) selTx = rows[0]?.id || null;
  $("#wList").innerHTML = rows.length ? rows.map((x) => `<button class="qi ${x.id === selTx ? "sel" : ""}" data-tx="${x.id}"><small>${esc(x.type)} · ${fmtD(x.ts)}, ${fmtT(x.ts)}</small>
    <div class="row"><span>${esc(x.title)}</span><span class="price" style="font-size:17px">${x.amount < 0 ? "−" : "+"}${peso(Math.abs(x.amount))}</span></div>
    <div class="wmeta"><span class="pill s-${x.status}">${x.status}</span><small class="mono">${x.id}</small></div></button>`).join("")
    : `<p class="empty">${t.length ? "No transactions match your filters." : "No transactions yet. Payments from accepted quests and your withdrawals will appear here."}</p>`;
  const x = t.find((y) => y.id === selTx);
  $("#wPanel").innerHTML = x ? `<small>${esc(x.type)} · ${new Date(x.ts).toLocaleDateString("en-PH", { dateStyle: "medium" })}</small><h2>${esc(x.title)}</h2><span class="price xl">${x.amount < 0 ? "−" : ""}${peso2(Math.abs(x.amount))}</span>
    <div class="facts"><div><small>Status</small><span class="pill s-${x.status}">${x.status}</span></div><div><small>Date</small>${new Date(x.ts).toLocaleDateString("en-PH", { dateStyle: "medium" })}</div><div><small>Time</small>${fmtT(x.ts)}</div></div>
    <p style="font-size:13px;line-height:1.5;margin-bottom:10px">${esc(x.note)}</p>
    <div class="dr"><span>Transaction ID</span><b class="mono">${x.id} <button class="cp" data-copy="${x.id}" title="Copy ID" aria-label="Copy transaction ID">⧉</button></b></div>
    <div class="dr"><span>Type</span><b>${esc(x.type)}</b></div><div class="dr"><span>Quest</span><b>${esc(x.quest || "—")}</b></div><div class="dr"><span>Paid via</span><b>${esc(x.via)}</b></div>
    <button class="btn ghost" id="rcpt" style="width:100%;margin-top:14px;padding:11px">⬇ Download receipt</button>` : `<p class="empty">Select a transaction to see its details.</p>`;
}
$("#wSearch").oninput = renderWallet; $("#wStatus").onchange = renderWallet;
$("#wFilters").onclick = (e) => { const c = e.target.closest(".chip"); if (c) { wFilter = c.dataset.f; renderWallet(); } };
$("#wList").onclick = (e) => { const i = e.target.closest("[data-tx]"); if (i) { selTx = i.dataset.tx; renderWallet(); } };
$("#wPanel").onclick = (e) => {
  const c = e.target.closest("[data-copy]"); if (c) navigator.clipboard?.writeText(c.dataset.copy).then(() => toast("Transaction ID copied."), () => toast(c.dataset.copy));
  if (e.target.closest("#rcpt")) {
    const x = wal.txns.find((y) => y.id === selTx); if (!x) return;
    const txt = ["QUESTFINDER RECEIPT", "-------------------", "Transaction ID: " + x.id, "Type: " + x.type, "Description: " + x.title, "Amount: " + (x.amount < 0 ? "-" : "") + peso2(Math.abs(x.amount)), "Status: " + x.status, "Date: " + new Date(x.ts).toLocaleString("en-PH"), "Paid via: " + x.via, "Account: " + user.name + " (" + user.email + ")"].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" })); a.download = `Questfinder-receipt-${x.id}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
};
function openWd() { const f = $("#wdForm"); clearErrs(f); f.gcash.value = wal.gcash || ""; f.amount.value = ""; $("#wdAvail").textContent = peso2(availBal()); $("#wdModal").hidden = false; setTimeout(() => (wal.gcash ? f.amount : f.gcash).focus(), 50); }
$("#wdBtn").onclick = openWd; $("#payBtn").onclick = openWd;
$("#wdForm").addEventListener("submit", (e) => {
  e.preventDefault(); const f = e.target; clearErrs(f);
  const g = f.gcash.value.replace(/[\s-]/g, ""), amt = +f.amount.value;
  const ok = [setErr(f, "gcash", /^09\d{9}$/.test(g) ? "" : "Enter a valid 11-digit GCash number (e.g. 09171234567)."),
    setErr(f, "amount", !amt || amt < 50 ? "Minimum withdrawal is ₱50." : amt > availBal() ? "That's more than your available balance." : "")];
  if (ok.includes(false)) return;
  wal.gcash = g; wal.txns.unshift(newTxn({ type: "Withdrawal", title: "Withdrawal to " + maskG(), amount: -amt, status: "Completed", quest: "", via: maskG(), note: "Sent to your GCash account." })); saveWal();
  $("#wdModal").hidden = true; wFilter = "All"; selTx = wal.txns[0].id; renderWallet(); toast(peso(amt) + " withdrawal requested.");
});

/* ---------- admin dashboard ---------- */
let aSel = null;
function renderAdmin() {
  const list = users.filter((u) => u.role !== "admin"), term = $("#aSearch").value.trim().toLowerCase();
  const rows = list.filter((u) => (aFilter === "All" || u.status === aFilter) && (u.name + u.email).toLowerCase().includes(term));
  const n = (s) => list.filter((u) => u.status === s).length;
  $("#aSub").innerHTML = `${list.length} neighbour${list.length === 1 ? "" : "s"} registered · <span style="color:var(--orange)">${n("Needs review") + n("Flagged")} need your attention</span>`;
  $("#aTable").innerHTML = `<tr><th>User</th><th>Status</th><th>Checks</th><th>Rating</th><th>Joined</th></tr>` + (rows.length ? rows.map((u) => `<tr class="u ${u.email === aSel ? "sel" : ""}" data-e="${esc(u.email)}"><td><div class="who"><span class="avatar ${u.photo ? "has" : ""}" data-ini="${esc(initials(u.name))}" style="${u.photo ? `background-image:url('${u.photo}')` : ""}"></span><div><b>${esc(u.name)}</b><br><small>${esc(u.email)}</small></div></div></td>
    <td><span class="pill st-${u.status.split(" ")[0]}">${esc(u.status)}</span></td><td>${["id", "ph", "bg"].map((k) => `<span class="ck ${u.checks[k] ? "on" : ""}">${k.toUpperCase()}</span>`).join("")}</td><td>—</td><td>${new Date(u.joined).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</td></tr>`).join("") : `<tr><td colspan="5"><p class="empty">No users to show yet. New sign-ups will appear here.</p></td></tr>`);
  const u = users.find((x) => x.email === aSel);
  $("#aPanel").innerHTML = u ? `<div style="display:flex;gap:12px;align-items:center"><span class="avatar big ${u.photo ? "has" : ""}" data-ini="${esc(initials(u.name))}" style="width:56px;height:56px;margin:0;font-size:18px;${u.photo ? `background-image:url('${u.photo}')` : ""}"></span><div><h2 style="margin:0;font-size:22px">${esc(u.name)}</h2><span class="pill st-${u.status.split(" ")[0]}">${esc(u.status)}</span></div></div>
    <p class="hint">${esc(u.email)}<br>${esc(u.loc || "No location added")}<br>Joined ${new Date(u.joined).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
    <h4 style="margin:14px 0 4px;font-size:13px">Verification (click to toggle)</h4>
    <div class="pbtns">${[["id", "ID"], ["ph", "Phone"], ["bg", "Background check"]].map(([k, l]) => `<button class="btn ghost" data-ck="${k}">${u.checks[k] ? "✓ " : "○ "}${l}: ${u.checks[k] ? "Verified" : "Not verified"}</button>`).join("")}
    <button class="btn" data-st="Active">Approve account</button><button class="btn ghost" data-st="Flagged">Flag for review</button>
    <button class="btn ghost danger" data-st="${u.status === "Suspended" ? "Active" : "Suspended"}">${u.status === "Suspended" ? "Reactivate account" : "Suspend account"}</button></div>` : `<p class="empty">Select a user to review their details.</p>`;
}
$("#aTable").onclick = (e) => { const r = e.target.closest("tr.u"); if (r) { aSel = r.dataset.e; renderAdmin(); } };
$("#aPanel").onclick = (e) => { const u = users.find((x) => x.email === aSel); if (!u) return;
  const ck = e.target.closest("[data-ck]"), st = e.target.closest("[data-st]");
  if (ck) u.checks[ck.dataset.ck] ^= 1; if (st) u.status = st.dataset.st; db.set("qf-users", users); renderAdmin(); };
$("#aSearch").oninput = renderAdmin;
$("#aFilters").onclick = (e) => { const c = e.target.closest(".chip"); if (!c) return; aFilter = c.dataset.f; $$("#aFilters .chip").forEach((x) => x.classList.toggle("on", x === c)); renderAdmin(); };

/* ---------- start ---------- */
function locate() { navigator.geolocation?.getCurrentPosition((p) => { me = { lat: p.coords.latitude, lng: p.coords.longitude }; renderAll(); }, () => {}, { timeout: 8000 }); }
(async function boot() {
  // The admin account always matches ADMIN at the top of this file, so editing it takes effect on refresh.
  const adminHash = await sha(ADMIN.pass), adm = users.find((u) => u.role === "admin");
  if (adm) { adm.email = ADMIN.email; adm.hash = adminHash; adm.status = "Active"; }
  else users.push({ email: ADMIN.email, hash: adminHash, name: "Admin", role: "admin", status: "Active", loc: "", bio: "", skills: "", photo: "", checks: { id: 1, ph: 1, bg: 1 }, joined: Date.now() });
  db.set("qf-users", users);
  const u = users.find((x) => x.email === db.get("qf-session", null));
  if (u && u.status !== "Suspended") signIn(u); else { paintAuth(); renderAll(); }
  locate();
})();
