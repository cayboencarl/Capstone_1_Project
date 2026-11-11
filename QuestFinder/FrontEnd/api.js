/* =====================================================================
   Questfinder API layer  (browser demo version)

   BACKEND TEAM: the screens only talk to this file. Keep every function
   name, its input and its return shape, and replace the body with fetch()
   calls to your server. Rules the UI relies on:
   - Money is an integer in centavos (PHP 160.00 = 16000). The UI formats it.
   - Dates are ISO 8601 strings. Distances are km (distance_km).
   - Errors are thrown as { error: { code, message, fields } } where
     fields maps an input name to its message, e.g. { email: "Already used" }.
   - Quest status: open | accepted | completed | cancelled
   - Transaction type: quest_earning | quest_payment | deposit | withdrawal
   - Wallet balance = sum of the user's completed transactions.
   ===================================================================== */
const api = (() => {
  const KEY = "qf3-db", EMPTY = () => ({ users: [], quests: [], txns: [], convs: [], msgs: [], session: null });
  let db = EMPTY();
  const refresh = () => { try { db = { ...EMPTY(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { db = EMPTY(); } };
  const fail = (code, message, fields = {}) => { throw { error: { code, message, fields } }; };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { fail("storage_full", "Browser storage is full. Try a smaller photo."); } };
  const id = (p) => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = () => new Date().toISOString();
  const clone = (o) => (o === undefined ? o : JSON.parse(JSON.stringify(o)));
  const def = (fn) => async (...a) => { refresh(); return clone(await fn(...a)); };
  // Demo only: a real backend hashes passwords on the server (bcrypt or argon2), never in the browser.
  const sha = async (s) => { if (!window.crypto?.subtle) return btoa(s); const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); };
  const pub = (u) => u && { id: u.id, name: u.name, email: u.email, photo_url: u.photo_url || "", location: u.location || "", bio: u.bio || "", skills: u.skills || "", gcash: u.gcash || "" };
  const mini = (uid) => { const u = db.users.find((x) => x.id === uid); return u ? { id: u.id, name: u.name, photo_url: u.photo_url || "" } : { id: uid, name: "Deleted user", photo_url: "" }; };
  const me = () => { const u = db.users.find((x) => x.id === db.session); if (!u) fail("unauthorized", "Please log in or sign up first."); return u; };
  const balance = (uid) => db.txns.filter((t) => t.user_id === uid && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const km = (a, b) => { const r = (d) => d * Math.PI / 180, h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  const extras = (q, lat, lng) => ({ ...q, client: mini(q.client_id), worker: q.worker_id ? mini(q.worker_id) : null, distance_km: lat != null && q.lat != null ? km({ lat, lng }, q) : null });
  const addTx = (user_id, type, amount, more = {}) => db.txns.push({ id: "TXN-" + Math.random().toString(36).slice(2, 8).toUpperCase(), user_id, type, amount, status: "completed", created_at: now(), ...more });
  const convOf = (a, b, quest_id) => {
    let c = db.convs.find((x) => x.members.includes(a) && x.members.includes(b));
    if (!c) { c = { id: id("c"), members: [a, b], quest_id: quest_id || null, created_at: now() }; db.convs.push(c); } else if (quest_id) c.quest_id = quest_id;
    return c;
  };
  const myConv = (u, cid) => { const c = db.convs.find((x) => x.id === cid && x.members.includes(u.id)); if (!c) fail("not_found", "Conversation not found."); return c; };

  return {
    auth: {
      register: def(async ({ name, email, password }) => {
        const f = {}; email = (email || "").trim().toLowerCase();
        if ((name || "").trim().length < 2) f.name = "Please enter your full name.";
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) f.email = "That doesn't look like a valid email address.";
        else if (db.users.some((u) => u.email === email)) f.email = "This email is already registered. Try logging in.";
        if ((password || "").length < 8) f.password = "Password must be at least 8 characters.";
        if (Object.keys(f).length) fail("validation", "Please fix the highlighted fields.", f);
        const u = { id: id("u"), name: name.trim(), email, hash: await sha(password), photo_url: "", location: "", bio: "", skills: "", gcash: "", created_at: now() };
        db.users.push(u); db.session = u.id; save(); return pub(u);
      }),
      login: def(async ({ email, password }) => {
        const u = db.users.find((x) => x.email === (email || "").trim().toLowerCase());
        if (!u) fail("no_account", "No account found for this email.", { email: "No account found for this email. Try signing up." });
        if ((await sha(password || "")) !== u.hash) fail("bad_password", "Incorrect password.", { password: "Incorrect password. Please try again." });
        db.session = u.id; save(); return pub(u);
      }),
      logout: def(async () => { db.session = null; save(); }),
      me: def(async () => pub(db.users.find((x) => x.id === db.session)) || null),
    },
    users: {
      update: def(async (p) => {
        const u = me();
        if ("name" in p && p.name.trim().length < 2) fail("validation", "Please enter your name.", { name: "Please enter your name." });
        ["name", "location", "bio", "skills", "photo_url"].forEach((k) => { if (k in p) u[k] = p[k]; });
        save(); return pub(u);
      }),
      get: def(async (uid) => mini(uid)),
    },
    quests: {
      list: def(async ({ lat, lng, scope = "open", q = "" } = {}) => {
        const u = me(), t = q.trim().toLowerCase();
        return db.quests
          .filter((x) => (scope === "mine" ? x.client_id === u.id : scope === "jobs" ? x.worker_id === u.id : x.status === "open" && x.client_id !== u.id))
          .filter((x) => [x.title, x.description, x.qualification, x.location].join(" ").toLowerCase().includes(t))
          .sort((a, b) => b.created_at.localeCompare(a.created_at)).map((x) => extras(x, lat, lng));
      }),
      get: def(async (qid, { lat, lng } = {}) => { me(); const q = db.quests.find((x) => x.id === qid); if (!q) fail("not_found", "Quest not found."); return extras(q, lat, lng); }),
      create: def(async (d) => {
        const u = me(), f = {};
        if ((d.title || "").trim().length < 5) f.title = "Enter a title (at least 5 characters).";
        if (!(d.location || "").trim()) f.location = "Enter the work location.";
        if ((d.description || "").trim().length < 10) f.description = "Describe the work (at least 10 characters).";
        if (!(d.pay >= 5000)) f.pay = "Offered pay must be at least ₱50.";
        if (!(d.duration_minutes >= 5)) f.duration = "Enter the duration in minutes (5 or more).";
        if (Object.keys(f).length) fail("validation", "Please fix the highlighted fields.", f);
        const q = { id: id("q"), client_id: u.id, worker_id: null, status: "open", created_at: now(), title: d.title.trim(), location: d.location.trim(), lat: d.lat ?? null, lng: d.lng ?? null,
          description: d.description.trim(), qualification: (d.qualification || "").trim(), pay: d.pay, duration_minutes: d.duration_minutes, photo_url: d.photo_url || "" };
        db.quests.push(q); save(); return extras(q);
      }),
      accept: def(async (qid) => {
        const u = me(), q = db.quests.find((x) => x.id === qid);
        if (!q) fail("not_found", "Quest not found."); if (q.client_id === u.id) fail("own_quest", "You can't accept your own quest.");
        if (q.status !== "open") fail("not_open", "This quest is no longer open.");
        q.worker_id = u.id; q.status = "accepted"; convOf(u.id, q.client_id, q.id); save(); return extras(q);
      }),
      complete: def(async (qid) => {
        const u = me(), q = db.quests.find((x) => x.id === qid);
        if (!q || q.client_id !== u.id) fail("forbidden", "Only the client can complete this quest."); if (q.status !== "accepted") fail("bad_status", "This quest isn't in progress.");
        if (balance(u.id) < q.pay) fail("insufficient_funds", "Not enough wallet balance to pay the worker. Deposit first.");
        addTx(u.id, "quest_payment", -q.pay, { quest_id: q.id, counterparty_id: q.worker_id });
        addTx(q.worker_id, "quest_earning", q.pay, { quest_id: q.id, counterparty_id: u.id });
        q.status = "completed"; save(); return extras(q);
      }),
      cancel: def(async (qid) => {
        const u = me(), q = db.quests.find((x) => x.id === qid);
        if (!q || q.client_id !== u.id) fail("forbidden", "Only the client can cancel this quest."); if (q.status !== "open") fail("bad_status", "Only open quests can be cancelled.");
        q.status = "cancelled"; save(); return extras(q);
      }),
    },
    wallet: {
      get: def(async () => ({ balance: balance(me().id) })),
      deposit: def(async (amount) => {
        const u = me(); if (!(amount >= 5000)) fail("validation", "Minimum deposit is ₱50.", { amount: "Minimum deposit is ₱50." });
        addTx(u.id, "deposit", amount); save(); return { balance: balance(u.id) };
      }),
      withdraw: def(async ({ amount, gcash }) => {
        const u = me(), f = {}, g = (gcash || "").replace(/[\s-]/g, "");
        if (!/^09\d{9}$/.test(g)) f.gcash = "Enter a valid 11-digit GCash number (e.g. 09171234567).";
        if (!(amount >= 5000)) f.amount = "Minimum withdrawal is ₱50."; else if (amount > balance(u.id)) f.amount = "That's more than your available balance.";
        if (Object.keys(f).length) fail("validation", "Please fix the highlighted fields.", f);
        u.gcash = g; addTx(u.id, "withdrawal", -amount, { account: g }); save(); return { balance: balance(u.id) };
      }),
      transactions: def(async () => {
        const u = me();
        return db.txns.filter((t) => t.user_id === u.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((t) => ({ ...t,
          counterparty: t.counterparty_id ? mini(t.counterparty_id) : null, quest_title: t.quest_id ? db.quests.find((q) => q.id === t.quest_id)?.title || "" : "" }));
      }),
    },
    messages: {
      conversations: def(async () => {
        const u = me();
        return db.convs.filter((c) => c.members.includes(u.id)).map((c) => {
          const o = c.members.find((m) => m !== u.id), q = db.quests.find((x) => x.id === c.quest_id);
          const last = db.msgs.filter((m) => m.conversation_id === c.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
          return { id: c.id, other: mini(o), other_role: q ? (q.client_id === o ? "client" : q.worker_id === o ? "worker" : null) : null, quest_title: q?.title || "", last, updated: last?.created_at || c.created_at };
        }).sort((a, b) => b.updated.localeCompare(a.updated));
      }),
      open: def(async (userId, questId) => { const u = me(); if (userId === u.id) fail("validation", "You can't message yourself."); const c = convOf(u.id, userId, questId); save(); return { id: c.id }; }),
      list: def(async (cid) => { const u = me(); myConv(u, cid); return db.msgs.filter((m) => m.conversation_id === cid).sort((a, b) => a.created_at.localeCompare(b.created_at)); }),
      send: def(async (cid, body) => {
        const u = me(); myConv(u, cid); body = (body || "").trim();
        if (!body) fail("validation", "Write a message first.", { body: "Write a message first." });
        const m = { id: id("m"), conversation_id: cid, sender_id: u.id, body: body.slice(0, 1000), created_at: now() };
        db.msgs.push(m); save(); return m;
      }),
    },
  };
})();
