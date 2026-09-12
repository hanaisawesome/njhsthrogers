import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────
//  T.H. Rogers Middle School — NJHS Chapter Website (v2)
//  Public: hero, announcements, pillars, events, sign-ups, join, officers
//  Admin (passcode): Tasks · Announcements · Events · Service hours · Sign-ups
//  CHANGE THE PASSCODE below before sharing.
// ─────────────────────────────────────────────────────────────
const ADMIN_PASSCODE = "torch2026"; // ← default; changeable in-app (Site text tab)
const OWNER_PASSCODE = "eagle2026"; // ← default second passcode for editing site text
const SCHOOL_NAME = "T.H. Rogers Middle School";

const KEYS = {
  tasks: "njhs-tasks",
  announcements: "njhs-announcements",
  events: "njhs-events",
  hours: "njhs-hours",
  signups: "njhs-signups",
  officers: "njhs-officers",
  committees: "njhs-committees",
  content: "njhs-content",
  passcodes: "njhs-passcodes",
};

const BLUE = "#1B2A6B";
const BLUE_DEEP = "#121C49";
const GOLD = "#E8B84B";
const GOLD_DEEP = "#C9962A";
const IVORY = "#FBF8F0";
const INK = "#23252E";

const serif = { fontFamily: "'Fraunces', Georgia, serif" };
const sans = { fontFamily: "'Public Sans', 'Segoe UI', sans-serif" };
const inputStyle = { borderColor: "#D8D2C2", color: INK };

function Torch({ size = 64 }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 64 96" fill="none" aria-hidden="true">
      <path d="M32 4 C40 14 46 20 46 30 C46 39 40 45 32 45 C24 45 18 39 18 30 C18 24 21 19 24 15 C24 22 27 26 32 27 C29 21 30 12 32 4 Z" fill={GOLD} />
      <path d="M32 27 C34.5 29 36 31.5 36 34 C36 38 34 40.5 32 40.5 C30 40.5 28 38 28 34 C28 31.5 29.5 29 32 27 Z" fill={GOLD_DEEP} />
      <rect x="20" y="48" width="24" height="6" rx="2" fill={IVORY} />
      <path d="M26 56 L38 56 L34 92 L30 92 Z" fill={IVORY} />
    </svg>
  );
}

const PILLARS = [
  { name: "Scholarship", text: "We keep our grades strong and help classmates who need a study partner." },
  { name: "Service", text: "We volunteer in our school and community — drives, cleanups, and tutoring." },
  { name: "Leadership", text: "We step up first: organizing events, leading committees, setting the example." },
  { name: "Character", text: "We do the right thing when no one is watching, and own it when we mess up." },
  { name: "Citizenship", text: "We know our community, respect its rules, and work to make it better." },
];

const DEFAULT_OFFICERS = [
  { id: 9, role: "President", name: "" },
  { id: 10, role: "Vice President", name: "" },
  { id: 1, role: "Historian", name: "" },
  { id: 2, role: "PR", name: "" },
  { id: 3, role: "HR #1", name: "" },
  { id: 4, role: "HR #2", name: "" },
  { id: 5, role: "Treasurer", name: "" },
  { id: 6, role: "Secretary", name: "" },
];

const DEFAULT_COMMITTEES = [
  { id: 1, role: "Stu Advocacy", chair: "", co: "" },
  { id: 2, role: "Tutoring", chair: "", co: "" },
  { id: 3, role: "Special Events", chair: "", co: "" },
  { id: 4, role: "In School Service", chair: "", co: "" },
  { id: 5, role: "Writing Club", chair: "", co: "" },
  { id: 6, role: "PSI Events", chair: "", co: "" },
  { id: 7, role: "Charity", chair: "", co: "" },
  { id: 8, role: "Out of School Service", chair: "", co: "" },
];

const DEFAULT_CONTENT = {
  navTitle: "T.H. Rogers NJHS",
  heroTitle: "T.H. Rogers Middle School 2026",
  heroSub: "The National Junior Honor Society chapter recognizing students who lead in the classroom, in the hallway, and in our community.",
  heroButton: "See how to join",
  missionText: "To recognize and grow students at T.H. Rogers who excel in the classroom and give back beyond it — building leaders of strong character who serve our school and our community.",
  goals: [
    "Create enthusiasm for scholarship and celebrate academic achievement.",
    "Stimulate a desire to serve — every member contributes real service hours each year.",
    "Develop leadership by giving members ownership of chapter projects and events.",
    "Encourage strong character and responsible citizenship in everything we do.",
  ],
  requirements: [
    "Maintain the cumulative GPA standard set by our chapter's faculty council.",
    "Demonstrate service, leadership, character, and citizenship — the pillars below.",
    "Complete the required service hours each semester once inducted.",
    "Attend chapter meetings and stay in good standing with school conduct rules.",
  ],
  pillars: PILLARS.map((p) => ({ ...p })),
  joinSteps: [
    "Keep a cumulative GPA that meets our chapter's standard (ask the adviser for this year's cutoff).",
    "Watch for the candidate information form each fall — eligible students are invited to apply.",
    "Complete the candidate form describing your service, leadership, and activities.",
    "Selected students are inducted at the fall ceremony and commit to chapter service hours.",
  ],
  signupNote: "Put your name down and the officers will see it. Use first name + last initial only.",
  footerLine: "T.H. Rogers Middle School NJHS · Scholarship · Service · Leadership · Character · Citizenship",
};

// ───────── shared-storage hook ─────────
function useSharedList(key) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "njhs", key),
      (snap) => {
        setItems(snap.exists() ? snap.data().items || [] : []);
        setLoading(false);
      },
      () => {
        setError("Couldn't load data. Check your internet connection or Firebase setup.");
        setLoading(false);
      }
    );
    return unsub;
  }, [key]);

  const save = useCallback(async (next) => {
    setItems(next); // optimistic; the snapshot listener confirms
    try {
      setError("");
      await setDoc(doc(db, "njhs", key), { items: next });
    } catch {
      setError("Couldn't save just now — try that again.");
    }
  }, [key]);

  return { items, save, loading, error };
}

// Object variant of the shared hook (site text, passcodes)
function useSharedDoc(key, fallback) {
  const { items, save, loading, error } = useSharedList(key);
  const value = items && !Array.isArray(items) ? items : fallback;
  return { value, save, loading, error };
}

const ErrorNote = ({ msg }) =>
  msg ? <p className="text-sm mb-3 px-3 py-2 rounded" style={{ background: "#FBE9E7", color: "#8C2F1B" }}>{msg}</p> : null;

const Empty = ({ children }) => (
  <p className="text-sm py-4" style={{ color: "#8A8D99" }}>{children}</p>
);

// ───────── Admin: Tasks ─────────
function TasksTab() {
  const { items, save, loading, error } = useSharedList(KEYS.tasks);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");

  const add = () => {
    if (!title.trim()) return;
    save([{ id: Date.now(), title: title.trim(), assignee: assignee.trim(), due, done: false }, ...items]);
    setTitle(""); setAssignee(""); setDue("");
  };
  const toggle = (id) => save(items.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => save(items.filter((t) => t.id !== id));

  return (
    <div>
      <div className="flex flex-col gap-2 mb-5 p-4 rounded border bg-white" style={{ borderColor: "#E4DFD2" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="What needs doing?" className="px-3 py-2 rounded border text-sm" style={inputStyle} />
        <div className="flex flex-wrap gap-2">
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Assigned to"
            className="flex-1 min-w-32 px-3 py-2 rounded border text-sm" style={inputStyle} />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
            className="px-3 py-2 rounded border text-sm" style={inputStyle} />
          <button onClick={add} className="px-4 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Add task</button>
        </div>
      </div>
      <ErrorNote msg={error} />
      {loading ? <Empty>Loading…</Empty> : items.length === 0 ? <Empty>No tasks yet. Add the first one above.</Empty> : (
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2 rounded border bg-white" style={{ borderColor: "#E4DFD2", opacity: t.done ? 0.6 : 1 }}>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} className="w-4 h-4" aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</p>
                <p className="text-xs" style={{ color: "#8A8D99" }}>{t.assignee ? `Assigned to ${t.assignee}` : "Unassigned"}{t.due ? ` · due ${t.due}` : ""}</p>
              </div>
              <button onClick={() => remove(t.id)} className="text-xs px-2 py-1 rounded" style={{ color: "#8C2F1B", background: "#F6ECE9" }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ───────── Admin: Announcements ─────────
function AnnouncementsTab() {
  const { items, save, loading, error } = useSharedList(KEYS.announcements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const add = () => {
    if (!title.trim()) return;
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    save([{ id: Date.now(), title: title.trim(), body: body.trim(), date }, ...items]);
    setTitle(""); setBody("");
  };
  const remove = (id) => save(items.filter((a) => a.id !== id));

  return (
    <div>
      <div className="flex flex-col gap-2 mb-5 p-4 rounded border bg-white" style={{ borderColor: "#E4DFD2" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"
          className="px-3 py-2 rounded border text-sm" style={inputStyle} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details (optional)" rows={2}
          className="px-3 py-2 rounded border text-sm" style={inputStyle} />
        <button onClick={add} className="self-start px-4 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Post announcement</button>
      </div>
      <ErrorNote msg={error} />
      {loading ? <Empty>Loading…</Empty> : items.length === 0 ? <Empty>No announcements yet. Whatever you post here shows on the public page.</Empty> : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => (
            <li key={a.id} className="px-3 py-2 rounded border bg-white flex gap-3 items-start" style={{ borderColor: "#E4DFD2" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.title} <span className="font-normal text-xs" style={{ color: "#8A8D99" }}>· {a.date}</span></p>
                {a.body && <p className="text-sm" style={{ color: "#5A5D6B" }}>{a.body}</p>}
              </div>
              <button onClick={() => remove(a.id)} className="text-xs px-2 py-1 rounded" style={{ color: "#8C2F1B", background: "#F6ECE9" }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ───────── Admin: Events ─────────
function EventsTab() {
  const { items, save, loading, error } = useSharedList(KEYS.events);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [detail, setDetail] = useState("");
  const [signup, setSignup] = useState(true);
  const [hint, setHint] = useState("");

  const add = () => {
    if (!title.trim() || !date) {
      setHint("An event needs at least a name and a date — fill in both, then hit Add event.");
      return;
    }
    setHint("");
    save([...items, { id: Date.now(), title: title.trim(), date, detail: detail.trim(), signup }].sort((a, b) => a.date.localeCompare(b.date)));
    setTitle(""); setDate(""); setDetail("");
  };
  const remove = (id) => save(items.filter((e) => e.id !== id));

  return (
    <div>
      <div className="flex flex-col gap-2 mb-5 p-4 rounded border bg-white" style={{ borderColor: "#E4DFD2" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name"
          className="px-3 py-2 rounded border text-sm" style={inputStyle} />
        <div className="flex flex-wrap gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded border text-sm" style={inputStyle} />
          <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Location / details"
            className="flex-1 min-w-40 px-3 py-2 rounded border text-sm" style={inputStyle} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={signup} onChange={(e) => setSignup(e.target.checked)} className="w-4 h-4" />
          Allow sign-ups for this event
        </label>
        <button onClick={add} className="self-start px-4 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Add event</button>
        {hint && <p className="text-xs" style={{ color: "#8C2F1B" }}>{hint}</p>}
      </div>
      <ErrorNote msg={error} />
      {loading ? <Empty>Loading…</Empty> : items.length === 0 ? <Empty>No events yet. Events you add show on the public page.</Empty> : (
        <ul className="flex flex-col gap-2">
          {items.map((e) => (
            <li key={e.id} className="px-3 py-2 rounded border bg-white flex gap-3 items-center" style={{ borderColor: "#E4DFD2" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{e.title} <span className="font-normal text-xs" style={{ color: "#8A8D99" }}>· {e.date}{e.signup ? " · sign-ups open" : ""}</span></p>
                {e.detail && <p className="text-sm" style={{ color: "#5A5D6B" }}>{e.detail}</p>}
              </div>
              <button onClick={() => remove(e.id)} className="text-xs px-2 py-1 rounded" style={{ color: "#8C2F1B", background: "#F6ECE9" }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ───────── Admin: Service hours ─────────
function HoursTab() {
  const { items, save, loading, error } = useSharedList(KEYS.hours);
  const [member, setMember] = useState("");
  const [activity, setActivity] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");

  const add = () => {
    const h = parseFloat(hours);
    if (!member.trim() || !h || h <= 0) return;
    save([{ id: Date.now(), member: member.trim(), activity: activity.trim(), date, hours: h }, ...items]);
    setActivity(""); setDate(""); setHours("");
  };
  const remove = (id) => save(items.filter((x) => x.id !== id));

  const totals = items.reduce((acc, x) => {
    acc[x.member] = (acc[x.member] || 0) + x.hours;
    return acc;
  }, {});

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: "#8A8D99" }}>Tip: use first name + last initial rather than full names.</p>
      <div className="flex flex-col gap-2 mb-5 p-4 rounded border bg-white" style={{ borderColor: "#E4DFD2" }}>
        <div className="flex flex-wrap gap-2">
          <input value={member} onChange={(e) => setMember(e.target.value)} placeholder="Member (e.g., Maya R.)"
            className="flex-1 min-w-32 px-3 py-2 rounded border text-sm" style={inputStyle} />
          <input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Activity"
            className="flex-1 min-w-32 px-3 py-2 rounded border text-sm" style={inputStyle} />
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded border text-sm" style={inputStyle} />
          <input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Hours"
            className="w-24 px-3 py-2 rounded border text-sm" style={inputStyle} />
          <button onClick={add} className="px-4 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Log hours</button>
        </div>
      </div>
      <ErrorNote msg={error} />
      {loading ? <Empty>Loading…</Empty> : items.length === 0 ? <Empty>No hours logged yet.</Empty> : (
        <>
          <div className="mb-4 p-3 rounded border bg-white" style={{ borderColor: "#E4DFD2" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: BLUE }}>Totals</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([m, h]) => (
                <span key={m} className="text-sm">{m}: <strong>{h}</strong> hr</span>
              ))}
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {items.map((x) => (
              <li key={x.id} className="px-3 py-2 rounded border bg-white flex gap-3 items-center" style={{ borderColor: "#E4DFD2" }}>
                <div className="flex-1 min-w-0 text-sm">
                  <strong>{x.member}</strong> — {x.hours} hr{x.activity ? ` · ${x.activity}` : ""}{x.date ? ` · ${x.date}` : ""}
                </div>
                <button onClick={() => remove(x.id)} className="text-xs px-2 py-1 rounded" style={{ color: "#8C2F1B", background: "#F6ECE9" }}>Delete</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ───────── Admin: Sign-ups (view) ─────────
function SignupsTab() {
  const { items, save, loading, error } = useSharedList(KEYS.signups);
  const remove = (id) => save(items.filter((s) => s.id !== id));

  const byEvent = items.reduce((acc, s) => {
    (acc[s.event] = acc[s.event] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <ErrorNote msg={error} />
      {loading ? <Empty>Loading…</Empty> : items.length === 0 ? <Empty>No sign-ups yet. When visitors sign up for an event on the public page, they appear here.</Empty> : (
        Object.entries(byEvent).map(([event, list]) => (
          <div key={event} className="mb-4">
            <p className="text-sm font-semibold mb-2" style={{ color: BLUE }}>{event} ({list.length})</p>
            <ul className="flex flex-col gap-1">
              {list.map((s) => (
                <li key={s.id} className="px-3 py-2 rounded border bg-white flex gap-3 items-center text-sm" style={{ borderColor: "#E4DFD2" }}>
                  <span className="flex-1">{s.name}{s.note ? ` — ${s.note}` : ""}</span>
                  <button onClick={() => remove(s.id)} className="text-xs px-2 py-1 rounded" style={{ color: "#8C2F1B", background: "#F6ECE9" }}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

// ───────── Admin: Officers & committees ─────────
function PeopleTab() {
  const off = useSharedList(KEYS.officers);
  const com = useSharedList(KEYS.committees);
  const [officers, setOfficers] = useState(null);
  const [committees, setCommittees] = useState(null);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (!off.loading && officers === null) setOfficers(off.items.length ? off.items : DEFAULT_OFFICERS);
  }, [off.loading, off.items, officers]);
  useEffect(() => {
    if (!com.loading && committees === null) setCommittees(com.items.length ? com.items : DEFAULT_COMMITTEES);
  }, [com.loading, com.items, committees]);

  if (officers === null || committees === null) return <Empty>Loading…</Empty>;

  const upOff = (id, field, val) => setOfficers(officers.map((o) => (o.id === id ? { ...o, [field]: val } : o)));
  const upCom = (id, field, val) => setCommittees(committees.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  const nextId = (list) => Math.max(0, ...list.map((x) => x.id)) + 1;

  const saveAll = async () => {
    await off.save(officers);
    await com.save(committees);
    setSavedMsg("Saved — the public page is updated.");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const rowInput = { ...inputStyle };

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: "#8A8D99" }}>
        Edit roles and names, then hit Save changes. First name + last initial is plenty.
      </p>

      <h3 className="text-sm font-semibold mb-2" style={{ color: BLUE }}>Officers</h3>
      <ul className="flex flex-col gap-2 mb-3">
        {officers.map((o) => (
          <li key={o.id} className="flex gap-2 items-center">
            <input value={o.role} onChange={(e) => upOff(o.id, "role", e.target.value)} placeholder="Role"
              className="w-40 px-3 py-2 rounded border text-sm" style={rowInput} />
            <input value={o.name} onChange={(e) => upOff(o.id, "name", e.target.value)} placeholder="Name"
              className="flex-1 min-w-24 px-3 py-2 rounded border text-sm" style={rowInput} />
            <button onClick={() => setOfficers(officers.filter((x) => x.id !== o.id))}
              className="text-xs px-2 py-2 rounded" style={{ color: "#8C2F1B", background: "#F6ECE9" }} aria-label={`Remove ${o.role}`}>✕</button>
          </li>
        ))}
      </ul>
      <button onClick={() => setOfficers([...officers, { id: nextId(officers), role: "", name: "" }])}
        className="mb-6 text-sm px-3 py-1 rounded" style={{ background: "#E6E1D3", color: INK }}>+ Add officer role</button>

      <h3 className="text-sm font-semibold mb-2" style={{ color: BLUE }}>Committee chairs & co-chairs</h3>
      <ul className="flex flex-col gap-2 mb-3">
        {committees.map((c) => (
          <li key={c.id} className="flex flex-wrap gap-2 items-center">
            <input value={c.role} onChange={(e) => upCom(c.id, "role", e.target.value)} placeholder="Committee"
              className="w-40 px-3 py-2 rounded border text-sm" style={rowInput} />
            <input value={c.chair} onChange={(e) => upCom(c.id, "chair", e.target.value)} placeholder="Chair"
              className="flex-1 min-w-24 px-3 py-2 rounded border text-sm" style={rowInput} />
            <input value={c.co} onChange={(e) => upCom(c.id, "co", e.target.value)} placeholder="Co-chair"
              className="flex-1 min-w-24 px-3 py-2 rounded border text-sm" style={rowInput} />
            <button onClick={() => setCommittees(committees.filter((x) => x.id !== c.id))}
              className="text-xs px-2 py-2 rounded" style={{ color: "#8C2F1B", background: "#F6ECE9" }} aria-label={`Remove ${c.role}`}>✕</button>
          </li>
        ))}
      </ul>
      <button onClick={() => setCommittees([...committees, { id: nextId(committees), role: "", chair: "", co: "" }])}
        className="mb-6 text-sm px-3 py-1 rounded" style={{ background: "#E6E1D3", color: INK }}>+ Add committee</button>

      <ErrorNote msg={off.error || com.error} />
      <div className="flex items-center gap-3">
        <button onClick={saveAll} className="px-5 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Save changes</button>
        {savedMsg && <span className="text-sm" style={{ color: "#2E6B34" }}>{savedMsg}</span>}
      </div>
    </div>
  );
}

// ───────── Admin: Site text (second passcode) ─────────
function OwnerTab() {
  const pass = useSharedDoc(KEYS.passcodes, { admin: ADMIN_PASSCODE, owner: OWNER_PASSCODE });
  const content = useSharedDoc(KEYS.content, DEFAULT_CONTENT);
  const P = { admin: ADMIN_PASSCODE, owner: OWNER_PASSCODE, ...pass.value };
  const C = { ...DEFAULT_CONTENT, ...content.value };

  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [draft, setDraft] = useState(null);
  const [pw, setPw] = useState(null);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (unlocked && !content.loading && draft === null) {
      setDraft({
        ...C,
        goalsText: C.goals.join("\n"),
        reqText: C.requirements.join("\n"),
        joinText: C.joinSteps.join("\n"),
        pillars: C.pillars.map((p) => ({ ...p })),
      });
    }
    if (unlocked && !pass.loading && pw === null) setPw({ admin: P.admin, owner: P.owner });
  }, [unlocked, content.loading, pass.loading]); // eslint-disable-line

  if (!unlocked) {
    const tryUnlock = () => {
      if (code === P.owner) setUnlocked(true);
      else { setWrong(true); setCode(""); }
    };
    return (
      <div className="max-w-sm">
        <p className="text-sm mb-3" style={{ color: "#5A5D6B" }}>
          Editing the website's text needs the second passcode.
        </p>
        <input type="password" value={code} onChange={(e) => { setCode(e.target.value); setWrong(false); }}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()} placeholder="Second passcode"
          className="w-full px-3 py-2 rounded border text-sm mb-2"
          style={{ borderColor: wrong ? "#8C2F1B" : "#D8D2C2", color: INK }} />
        {wrong && <p className="text-xs mb-2" style={{ color: "#8C2F1B" }}>That passcode didn't match. Try again.</p>}
        <button onClick={tryUnlock} className="px-4 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Unlock</button>
      </div>
    );
  }

  if (draft === null || pw === null) return <Empty>Loading…</Empty>;

  const toLines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const field = (label, key, area) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold" style={{ color: BLUE }}>{label}</span>
      {area ? (
        <textarea rows={area} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          className="px-3 py-2 rounded border text-sm" style={inputStyle} />
      ) : (
        <input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          className="px-3 py-2 rounded border text-sm" style={inputStyle} />
      )}
    </label>
  );

  const saveContent = async () => {
    await content.save({
      navTitle: draft.navTitle,
      heroTitle: draft.heroTitle,
      heroSub: draft.heroSub,
      heroButton: draft.heroButton,
      missionText: draft.missionText,
      goals: toLines(draft.goalsText),
      requirements: toLines(draft.reqText),
      joinSteps: toLines(draft.joinText),
      pillars: draft.pillars,
      signupNote: draft.signupNote,
      footerLine: draft.footerLine,
    });
    setSavedMsg("Saved — the site now shows the new text.");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const [pwMsg, setPwMsg] = useState("");
  const savePasscodes = async () => {
    if (!pw.admin.trim() || !pw.owner.trim()) {
      setPwMsg("Both passcodes need a value before saving.");
      return;
    }
    await pass.save({ admin: pw.admin.trim(), owner: pw.owner.trim() });
    setPwMsg("Passcodes updated — use the new ones from now on.");
    setTimeout(() => setPwMsg(""), 5000);
  };

  return (
    <div className="flex flex-col gap-4">
      {field("Site name (top bar)", "navTitle")}
      {field("Big headline", "heroTitle")}
      {field("Headline subtext", "heroSub", 2)}
      {field("Headline button", "heroButton")}
      {field("Mission statement", "missionText", 3)}
      {field("Chapter goals (one per line)", "goalsText", 4)}
      {field("Membership requirements (one per line)", "reqText", 4)}

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold" style={{ color: BLUE }}>The five pillars</span>
        {draft.pillars.map((p, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <input value={p.name} onChange={(e) => setDraft({ ...draft, pillars: draft.pillars.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })}
              className="w-36 px-3 py-2 rounded border text-sm" style={inputStyle} />
            <input value={p.text} onChange={(e) => setDraft({ ...draft, pillars: draft.pillars.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })}
              className="flex-1 min-w-40 px-3 py-2 rounded border text-sm" style={inputStyle} />
          </div>
        ))}
      </div>

      {field("How to join steps (one per line)", "joinText", 4)}
      {field("Sign-up note", "signupNote")}
      {field("Footer line", "footerLine")}

      <ErrorNote msg={content.error} />
      <div className="flex items-center gap-3">
        <button onClick={saveContent} className="px-5 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Save site text</button>
        {savedMsg && <span className="text-sm" style={{ color: "#2E6B34" }}>{savedMsg}</span>}
      </div>

      <div className="mt-4 p-4 rounded border bg-white" style={{ borderColor: "#E4DFD2" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: BLUE }}>Change passcodes</p>
        <p className="text-xs mb-3" style={{ color: "#8A8D99" }}>
          Make up new codes — never reuse a real password. Anyone technical can dig these out of the site's data, so treat them as "keeps people honest," not real security.
        </p>
        <div className="flex flex-col gap-2 max-w-sm">
          <label className="text-sm flex flex-col gap-1">Admin passcode
            <input value={pw.admin} onChange={(e) => setPw({ ...pw, admin: e.target.value })}
              className="px-3 py-2 rounded border text-sm" style={inputStyle} />
          </label>
          <label className="text-sm flex flex-col gap-1">Second passcode (site text)
            <input value={pw.owner} onChange={(e) => setPw({ ...pw, owner: e.target.value })}
              className="px-3 py-2 rounded border text-sm" style={inputStyle} />
          </label>
          <ErrorNote msg={pass.error} />
          <div className="flex items-center gap-3">
            <button onClick={savePasscodes} className="px-4 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Save passcodes</button>
            {pwMsg && (
              <span className="text-sm" style={{ color: pwMsg.startsWith("Passcodes updated") ? "#2E6B34" : "#8C2F1B" }}>{pwMsg}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────── Admin panel shell ─────────
const TABS = [
  { id: "tasks", label: "Tasks", el: <TasksTab /> },
  { id: "announcements", label: "Announcements", el: <AnnouncementsTab /> },
  { id: "events", label: "Events", el: <EventsTab /> },
  { id: "people", label: "Officers", el: <PeopleTab /> },
  { id: "hours", label: "Service hours", el: <HoursTab /> },
  { id: "signups", label: "Sign-ups", el: <SignupsTab /> },
  { id: "sitetext", label: "Site text", el: <OwnerTab /> },
];

function AdminPanel({ onClose }) {
  const [tab, setTab] = useState("tasks");
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" style={{ background: "rgba(18,28,73,0.85)" }}>
      <div className="w-full max-w-3xl rounded-lg shadow-2xl my-8" style={{ background: IVORY }}>
        <div className="flex items-center justify-between px-6 py-4 rounded-t-lg" style={{ background: BLUE }}>
          <div className="flex items-center gap-3">
            <Torch size={20} />
            <h2 className="text-xl text-white" style={serif}>Chapter admin</h2>
          </div>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded" style={{ ...sans, background: GOLD, color: BLUE_DEEP }}>Close</button>
        </div>
        <div className="flex flex-wrap gap-1 px-4 pt-3" style={sans}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-2 rounded-t text-sm font-semibold"
              style={tab === t.id ? { background: "#fff", color: BLUE, border: "1px solid #E4DFD2", borderBottom: "none" } : { color: "#5A5D6B" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5" style={sans}>
          <p className="text-xs mb-4" style={{ color: "#8A8D99" }}>Shared with all admins. Avoid full names or personal details for students.</p>
          {TABS.find((t) => t.id === tab).el}
        </div>
      </div>
    </div>
  );
}

// ───────── Passcode gate ─────────
function AdminGate({ expected, title, subtitle, onSuccess, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const submit = () => {
    if (code === expected) onSuccess();
    else { setError(true); setCode(""); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(18,28,73,0.85)" }}>
      <div className="w-full max-w-sm rounded-lg p-6 shadow-2xl" style={{ background: IVORY, ...sans }}>
        <h2 className="text-xl mb-1" style={{ ...serif, color: BLUE }}>{title || "Admin sign-in"}</h2>
        <p className="text-sm mb-4" style={{ color: "#5A5D6B" }}>{subtitle || "Officers and advisers only."}</p>
        <input type="password" value={code} onChange={(e) => { setCode(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Passcode" autoFocus
          className="w-full px-3 py-2 rounded border text-sm mb-2"
          style={{ borderColor: error ? "#8C2F1B" : "#D8D2C2", color: INK }} />
        {error && <p className="text-xs mb-2" style={{ color: "#8C2F1B" }}>That passcode didn't match. Try again.</p>}
        <div className="flex gap-2">
          <button onClick={submit} className="flex-1 px-4 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Enter</button>
          <button onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ background: "#E6E1D3", color: INK }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ───────── Public: sign-up form ─────────
function SignupForm({ events }) {
  const { items, save, error } = useSharedList(KEYS.signups);
  const openEvents = events.filter((e) => e.signup);
  const [name, setName] = useState("");
  const [event, setEvent] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (openEvents.length === 0) {
    return <Empty>No events are open for sign-ups right now. Check back soon.</Empty>;
  }

  const submit = () => {
    if (!name.trim() || !event) return;
    save([...items, { id: Date.now(), name: name.trim(), event, note: note.trim() }]);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="p-4 rounded border bg-white text-sm" style={{ borderColor: "#E4DFD2" }}>
        You're signed up for <strong>{event}</strong>. See you there!
        <button onClick={() => { setSent(false); setName(""); setNote(""); }} className="ml-3 underline" style={{ color: BLUE }}>Sign up someone else</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-md">
      <select value={event} onChange={(e) => setEvent(e.target.value)} className="px-3 py-2 rounded border text-sm bg-white" style={inputStyle}>
        <option value="">Choose an event…</option>
        {openEvents.map((e) => <option key={e.id} value={e.title}>{e.title} ({e.date})</option>)}
      </select>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name + last initial"
        className="px-3 py-2 rounded border text-sm" style={inputStyle} />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything we should know? (optional)"
        className="px-3 py-2 rounded border text-sm" style={inputStyle} />
      <ErrorNote msg={error} />
      <button onClick={submit} className="self-start px-5 py-2 rounded text-sm font-semibold" style={{ background: BLUE, color: "#fff" }}>Sign up</button>
    </div>
  );
}

// ───────── Main page ─────────
export default function NJHSSite() {
  const [gateOpen, setGateOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const announcements = useSharedList(KEYS.announcements);
  const events = useSharedList(KEYS.events);
  const officersList = useSharedList(KEYS.officers);
  const committeesList = useSharedList(KEYS.committees);
  const siteContent = useSharedDoc(KEYS.content, DEFAULT_CONTENT);
  const passcodes = useSharedDoc(KEYS.passcodes, { admin: ADMIN_PASSCODE, owner: OWNER_PASSCODE });
  const C = { ...DEFAULT_CONTENT, ...siteContent.value };
  const P = { admin: ADMIN_PASSCODE, owner: OWNER_PASSCODE, ...passcodes.value };

  const openAdmin = () => (isAdmin ? setPanelOpen(true) : setGateOpen(true));
  const fmtDate = (d) => {
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return d; }
  };

  return (
    <div style={{ background: IVORY, color: INK, minHeight: "100vh", ...sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;600;700&display=swap');
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
        .pillar-row:nth-child(odd) { background: #FFFFFF; }
        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid ${GOLD}; outline-offset: 2px; }
      `}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-3" style={{ background: BLUE }}>
        <div className="flex items-center gap-2">
          <Torch size={16} />
          <span className="text-white font-semibold text-sm tracking-wide" style={serif}>{C.navTitle}</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-white">
          <a href="#home" className="hidden sm:inline hover:underline">Home</a>
          <a href="#news" className="hidden sm:inline hover:underline">News</a>
          <a href="#events" className="hidden sm:inline hover:underline">Events</a>
          <a href="#signup" className="hidden sm:inline hover:underline">Sign up</a>
          <a href="#join" className="hidden md:inline hover:underline">Join</a>
          <button onClick={openAdmin} className="px-3 py-1 rounded text-sm font-semibold" style={{ background: GOLD, color: BLUE_DEEP }}>
            {isAdmin ? "Admin panel" : "Admin"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ background: `linear-gradient(180deg, ${BLUE} 0%, ${BLUE_DEEP} 100%)` }}>
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center">
          <div className="flex justify-center mb-6"><Torch size={72} /></div>
          <h1 className="text-white text-4xl sm:text-6xl leading-tight mb-4" style={{ ...serif, fontWeight: 700 }}>
            {C.heroTitle}
          </h1>
          <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: "#C9D2F0" }}>
            {C.heroSub}
          </p>
          <a href="#join" className="inline-block px-6 py-3 rounded font-semibold" style={{ background: GOLD, color: BLUE_DEEP }}>
            {C.heroButton}
          </a>
        </div>
      </header>

      {/* Home: mission, goals, requirements */}
      <section id="home" className="max-w-4xl mx-auto px-6 py-14">
        <div className="rounded-lg px-6 py-8 mb-10 text-center" style={{ background: BLUE, color: "#fff" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: GOLD }}>Our mission</p>
          <p className="text-xl sm:text-2xl max-w-2xl mx-auto leading-relaxed" style={serif}>
            {C.missionText}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl mb-4" style={{ ...serif, color: BLUE }}>Chapter goals</h2>
            <ul className="flex flex-col gap-3 text-sm">
              {C.goals.map((g, i) => (
                <li key={i} className="flex gap-3"><span style={{ color: GOLD_DEEP }}>●</span>{g}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl mb-4" style={{ ...serif, color: BLUE }}>Membership requirements</h2>
            <ul className="flex flex-col gap-3 text-sm">
              {C.requirements.map((r, i) => (
                <li key={i} className="flex gap-3"><span style={{ color: GOLD_DEEP }}>●</span>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section id="news" className="py-14" style={{ background: "#FFFFFF" }}>
        <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl mb-6" style={{ ...serif, color: BLUE }}>Announcements</h2>
        {announcements.loading ? <Empty>Loading…</Empty> : announcements.items.length === 0 ? (
          <Empty>Nothing posted yet — announcements from chapter officers will appear here.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {announcements.items.map((a) => (
              <li key={a.id} className="px-4 py-3 rounded border bg-white" style={{ borderColor: "#E4DFD2" }}>
                <p className="font-semibold">{a.title} <span className="font-normal text-xs" style={{ color: "#8A8D99" }}>· {a.date}</span></p>
                {a.body && <p className="text-sm mt-1" style={{ color: "#5A5D6B" }}>{a.body}</p>}
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl mb-2" style={{ ...serif, color: BLUE }}>The five pillars</h2>
          <p className="mb-8 max-w-xl" style={{ color: "#5A5D6B" }}>Everything our chapter does connects back to one of these.</p>
          <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#E4DFD2", background: IVORY }}>
            {C.pillars.map((p, i) => (
              <div key={i} className="pillar-row flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 py-4">
                <h3 className="text-xl sm:w-44 shrink-0" style={{ ...serif, color: GOLD_DEEP, fontWeight: 600 }}>{p.name}</h3>
                <p className="text-sm">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section id="events" className="py-14" style={{ background: "#FFFFFF" }}>
        <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl mb-6" style={{ ...serif, color: BLUE }}>Upcoming events</h2>
        {events.loading ? <Empty>Loading…</Empty> : events.items.length === 0 ? (
          <Empty>No events on the calendar yet — check back soon.</Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {events.items.map((e) => (
              <li key={e.id} className="flex gap-5 items-start">
                <div className="shrink-0 w-16 text-center rounded py-2 text-sm font-bold" style={{ background: BLUE, color: GOLD }}>
                  {fmtDate(e.date)}
                </div>
                <div>
                  <p className="font-semibold">{e.title}</p>
                  {e.detail && <p className="text-sm" style={{ color: "#5A5D6B" }}>{e.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>

      {/* Sign-up */}
      <section id="signup" className="py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl mb-2" style={{ ...serif, color: BLUE }}>Event sign-ups</h2>
          <p className="mb-6 max-w-xl text-sm" style={{ color: "#5A5D6B" }}>
            {C.signupNote}
          </p>
          <SignupForm events={events.items} />
        </div>
      </section>

      {/* Join */}
      <section id="join" className="py-14" style={{ background: "#FFFFFF" }}>
        <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl mb-4" style={{ ...serif, color: BLUE }}>How to join</h2>
        <ol className="flex flex-col gap-3 max-w-xl list-decimal list-inside">
          {C.joinSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        </div>
      </section>

      {/* Officers & committees */}
      <section id="officers" className="py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl mb-8" style={{ ...serif, color: BLUE }}>Chapter officers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {(officersList.items.length ? officersList.items : DEFAULT_OFFICERS).map((o) => (
              <div key={o.id} className="rounded border px-4 py-5" style={{ borderColor: "#E4DFD2", background: IVORY }}>
                <p className="text-sm font-semibold" style={{ color: GOLD_DEEP }}>{o.role}</p>
                <p className="text-lg" style={serif}>{o.name || "To be announced"}</p>
              </div>
            ))}
          </div>

          <h2 className="text-3xl mb-6" style={{ ...serif, color: BLUE }}>Committees</h2>
          <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#E4DFD2", background: IVORY }}>
            <div className="hidden sm:flex px-5 py-2 text-xs font-semibold" style={{ background: BLUE, color: "#C9D2F0" }}>
              <span className="sm:w-52 shrink-0">Committee</span>
              <span className="flex-1">Chair</span>
              <span className="flex-1">Co-chair</span>
            </div>
            {(committeesList.items.length ? committeesList.items : DEFAULT_COMMITTEES).map((c) => (
              <div key={c.id} className="pillar-row flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-0 px-5 py-3">
                <p className="text-sm font-semibold sm:w-52 shrink-0" style={{ color: GOLD_DEEP }}>{c.role}</p>
                <p className="text-sm flex-1">{c.chair || "To be announced"}</p>
                <p className="text-sm flex-1">{c.co ? c.co : <span style={{ color: "#8A8D99" }}>Co-chair TBA</span>}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-sm" style={{ background: BLUE_DEEP, color: "#9AA6D6" }}>
        <div className="flex justify-center mb-3"><Torch size={14} /></div>
        <p>{C.footerLine}</p>
      </footer>

      {gateOpen && <AdminGate expected={P.admin} onSuccess={() => { setIsAdmin(true); setGateOpen(false); setPanelOpen(true); }} onClose={() => setGateOpen(false)} />}
      {panelOpen && <AdminPanel onClose={() => setPanelOpen(false)} />}
    </div>
  );
}
