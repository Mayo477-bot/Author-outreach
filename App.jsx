import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const STATUSES = ["Not contacted", "Contacted", "Replied", "Meeting set", "Deal", "Passed"];

const STATUS_COLOR = {
  "Not contacted": "#8A8272",
  "Contacted": "#A67C3D",
  "Replied": "#35503A",
  "Meeting set": "#35503A",
  "Deal": "#7A2E2E",
  "Passed": "#8A8272",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function blankForm() {
  return { name: "", focus: "", email: "", website: "", social: "", status: "Not contacted", notes: "" };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checkingSession) {
    return (
      <div style={styles.page}>
        <GlobalFont />
        <div style={styles.loading}>Loading…</div>
      </div>
    );
  }

  return session ? <OutreachApp session={session} /> : <AuthScreen />;
}

/* ---------------- Auth ---------------- */

function AuthScreen() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Enter an email and password.");
      return;
    }
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo("Account created. If email confirmation is on for your project, check your inbox before signing in.");
    }
    setBusy(false);
  }

  return (
    <div style={styles.page}>
      <GlobalFont />
      <div style={styles.authWrap}>
        <div style={styles.spineLabel}>Field Ledger</div>
        <h1 style={styles.title}>Author Outreach</h1>
        <p style={styles.subtitle}>Sign in to see your contacts from any device.</p>

        <form style={styles.formPanel} onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>

          {error && <div style={styles.errorText}>{error}</div>}
          {info && <div style={styles.infoText}>{info}</div>}

          <button style={styles.primaryBtn} type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            style={styles.linkBtn}
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setInfo("");
            }}
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Outreach tracker ---------------- */

function OutreachApp({ session }) {
  const [loaded, setLoaded] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(blankForm());
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoadError("");
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setLoadError(error.message);
    else setContacts(data || []);
    setLoaded(true);
  }

  async function addContact() {
    if (!form.name.trim()) return;
    const { error } = await supabase.from("contacts").insert({
      ...form,
      user_id: session.user.id,
      last_contact: todayStr(),
    });
    if (error) {
      setLoadError(error.message);
      return;
    }
    setForm(blankForm());
    setShowForm(false);
    refresh();
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("contacts")
      .update({ status, last_contact: todayStr() })
      .eq("id", id);
    if (error) setLoadError(error.message);
    else refresh();
  }

  async function removeContact(id) {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) setLoadError(error.message);
    else refresh();
  }

  async function clearAll() {
    const { error } = await supabase.from("contacts").delete().eq("user_id", session.user.id);
    if (error) setLoadError(error.message);
    else refresh();
    setConfirmClear(false);
  }

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.focus || "").toLowerCase().includes(q);
  });

  return (
    <div style={styles.page}>
      <GlobalFont />

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.spineLabel}>Field Ledger</div>
            <h1 style={styles.title}>Author Outreach</h1>
          </div>
          <button style={styles.linkBtn} onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
        <p style={styles.subtitle}>Signed in as {session.user.email}</p>
      </header>

      {loadError && <div style={styles.errorBanner}>{loadError}</div>}

      <main style={styles.main}>
        {!loaded ? (
          <div style={styles.loading}>Opening the ledger…</div>
        ) : (
          <>
            <div style={styles.toolRow}>
              <input
                style={styles.search}
                placeholder="Search by name or book/genre"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button style={styles.primaryBtn} onClick={() => setShowForm((s) => !s)}>
                {showForm ? "Cancel" : "+ New contact"}
              </button>
            </div>

            {showForm && (
              <div style={styles.formPanel}>
                <div style={styles.formGrid}>
                  <Field label="Author name">
                    <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Book / genre / project">
                    <input style={styles.input} value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
                  </Field>
                  <Field label="Status">
                    <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Email">
                    <input style={styles.input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
                  </Field>
                  <Field label="Website">
                    <input style={styles.input} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="authorsite.com" />
                  </Field>
                  <Field label="Social media">
                    <input style={styles.input} value={form.social} onChange={(e) => setForm({ ...form, social: e.target.value })} placeholder="@handle or profile link" />
                  </Field>
                </div>
                <Field label="Notes — why you're reaching out, what was said, next step">
                  <textarea
                    style={{ ...styles.input, minHeight: 70, resize: "vertical" }}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </Field>
                <button style={styles.primaryBtn} onClick={addContact}>Add contact</button>
              </div>
            )}

            <div style={styles.list}>
              {filtered.length === 0 && (
                <div style={styles.empty}>
                  {contacts.length === 0 ? "No contacts yet. Add one above." : "Nothing matches that search."}
                </div>
              )}
              {filtered.map((c) => (
                <div key={c.id} style={{ ...styles.row, borderLeftColor: STATUS_COLOR[c.status] || "#A39A85" }}>
                  <div style={styles.rowMain}>
                    <div style={styles.rowTitle}>{c.name}</div>
                    <div style={styles.rowMeta}>
                      {c.focus && <span>{c.focus}</span>}
                      {c.email && <span style={styles.mono}>{c.email}</span>}
                      {c.website && <span style={styles.mono}>{c.website}</span>}
                      {c.social && <span style={styles.mono}>{c.social}</span>}
                      <span style={styles.mono}>last touch {c.last_contact}</span>
                    </div>
                    {c.notes && <div style={styles.rowNotes}>{c.notes}</div>}
                  </div>
                  <div style={styles.rowActions}>
                    <select
                      style={{ ...styles.smallBtn, paddingRight: 8 }}
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button style={styles.smallBtnMuted} onClick={() => removeContact(c.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {contacts.length > 0 && (
              <div style={styles.clearRow}>
                {confirmClear ? (
                  <>
                    <span style={styles.clearText}>Clear all contacts? This can't be undone.</span>
                    <button style={styles.smallBtnDanger} onClick={clearAll}>Yes, clear</button>
                    <button style={styles.smallBtnMuted} onClick={() => setConfirmClear(false)}>Cancel</button>
                  </>
                ) : (
                  <button style={styles.linkBtn} onClick={() => setConfirmClear(true)}>Clear all contacts</button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ---------------- shared bits ---------------- */

function Field({ label, children }) {
  return (
    <label style={styles.fieldWrap}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function GlobalFont() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      input, select, textarea, button { font-family: 'Inter', sans-serif; }
      input:focus, select:focus, textarea:focus, button:focus-visible {
        outline: 2px solid #7A2E2E; outline-offset: 2px;
      }
      ::placeholder { color: #A39A85; }
    `}</style>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EAE3D2",
    color: "#201D18",
    fontFamily: "'Inter', sans-serif",
    padding: "28px 20px 60px",
  },
  authWrap: { maxWidth: 420, margin: "60px auto 0" },
  header: { maxWidth: 720, margin: "0 auto 22px" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  spineLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    letterSpacing: "0.02em",
    color: "#7A2E2E",
    marginBottom: 6,
  },
  title: {
    fontFamily: "'Source Serif 4', serif",
    fontWeight: 600,
    fontSize: 32,
    margin: "0 0 6px",
    lineHeight: 1.15,
  },
  subtitle: { margin: 0, color: "#4A4436", fontSize: 15, lineHeight: 1.5, maxWidth: 520 },
  errorBanner: {
    maxWidth: 720,
    margin: "0 auto 12px",
    background: "#F3E3E0",
    border: "1px solid #C98F8A",
    color: "#7A2E2E",
    fontSize: 13,
    padding: "8px 12px",
    borderRadius: 3,
  },
  errorText: { color: "#7A2E2E", fontSize: 13, marginBottom: 10 },
  infoText: { color: "#35503A", fontSize: 13, marginBottom: 10 },
  main: { maxWidth: 720, margin: "0 auto" },
  loading: { color: "#7A7062", fontSize: 14, padding: "20px 0" },
  toolRow: { display: "flex", gap: 10, marginBottom: 16 },
  search: {
    flex: 1,
    padding: "9px 12px",
    border: "1px solid #C9BFA4",
    borderRadius: 3,
    background: "#F5F1E6",
    fontSize: 14,
    color: "#201D18",
  },
  primaryBtn: {
    background: "#7A2E2E",
    color: "#F5F1E6",
    border: "none",
    borderRadius: 3,
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  formPanel: {
    background: "#F5F1E6",
    border: "1px solid #C9BFA4",
    borderRadius: 3,
    padding: 18,
    marginBottom: 20,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  fieldWrap: { display: "block", marginBottom: 12 },
  fieldLabel: { display: "block", fontSize: 12.5, color: "#5C5544", marginBottom: 5 },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #C9BFA4",
    borderRadius: 3,
    background: "#FFFDF8",
    fontSize: 14,
    color: "#201D18",
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  empty: { color: "#8A8272", fontSize: 14, padding: "24px 0", textAlign: "center" },
  row: {
    background: "#F5F1E6",
    border: "1px solid #DCD3BC",
    borderLeft: "3px solid #A67C3D",
    borderRadius: 3,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 17 },
  rowMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px 12px",
    fontSize: 13,
    color: "#5C5544",
    marginTop: 4,
  },
  mono: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 },
  rowNotes: { fontSize: 13.5, color: "#4A4436", marginTop: 8, lineHeight: 1.5 },
  rowActions: { display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" },
  smallBtn: {
    background: "#EFE7D4",
    border: "1px solid #C9BFA4",
    borderRadius: 3,
    padding: "6px 10px",
    fontSize: 12.5,
    cursor: "pointer",
    color: "#201D18",
    whiteSpace: "nowrap",
  },
  smallBtnMuted: {
    background: "none",
    border: "1px solid transparent",
    borderRadius: 3,
    padding: "6px 10px",
    fontSize: 12.5,
    cursor: "pointer",
    color: "#8A8272",
    whiteSpace: "nowrap",
  },
  smallBtnDanger: {
    background: "#7A2E2E",
    border: "none",
    borderRadius: 3,
    padding: "6px 10px",
    fontSize: 12.5,
    cursor: "pointer",
    color: "#F5F1E6",
    whiteSpace: "nowrap",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#8A8272",
    fontSize: 12.5,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
  clearRow: { marginTop: 16, display: "flex", gap: 10, alignItems: "center" },
  clearText: { fontSize: 12.5, color: "#5C5544" },
};
