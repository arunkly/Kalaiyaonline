import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LOCAL_BODY_TYPES,
  LOCAL_POSTS,
  baraLocals,
  baraSeats,
  politiciansOf,
  seatLabel,
  type Candidate,
  type ElectionData,
  type LocalBody,
  type Politician,
} from "@/lib/election";
import {
  deleteLocalBody,
  deletePolitician,
  getElectionDesk,
  saveConstituency,
  saveLocalBody,
  savePolitician,
  setElectionFrontPage,
} from "@/lib/election-desk";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-crimson";

type DeskTab = "home" | "hor" | "local" | "people";

function emptyCand(): Candidate {
  return { id: "", name: "", party: "", partySlug: "", votes: 0, winner: false, meta: "", photo: "", bio: "" };
}

export function ElectionDeskPanel() {
  const [desk, setDesk] = useState<ElectionData | null>(null);
  const [tab, setTab] = useState<DeskTab>("hor");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    void getElectionDesk()
      .then(setDesk)
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  if (!desk) return <div className="h-40 animate-pulse rounded-2xl bg-chip" />;

  const seats = baraSeats(desk);
  const locals = baraLocals(desk);
  const people = politiciansOf(desk);

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">निर्वाचन डेस्क</h2>
      <p className="text-sm text-muted">बारा जिल्ला — प्रतिनिधिसभा ४ क्षेत्र, स्थानीय निकाय र राजनीतिज्ञ प्रोफाइल।</p>
      {msg ? <p className="text-sm font-semibold text-[#14934e]">{msg}</p> : null}
      {err ? <p className="text-sm text-mark">{err}</p> : null}

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            ["hor", "प्रतिनिधिसभा"],
            ["local", "स्थानीय निकाय"],
            ["people", "राजनीतिज्ञ"],
            ["home", "होमपेज"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper"
                : "rounded-full border border-line px-4 py-2 text-sm"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "home" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">होमपेजको निर्वाचन अपडेटमा के देखाउने?</p>
          <div className="flex flex-wrap gap-2">
            {(["hor", "local"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  setErr(null);
                  void setElectionFrontPage({ data: { frontPage: mode } })
                    .then((next) => {
                      setDesk(next);
                      setMsg(mode === "hor" ? "होमपेजमा प्रतिनिधिसभा देखिन्छ।" : "होमपेजमा स्थानीय निकाय देखिन्छ।");
                    })
                    .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
                    .finally(() => setBusy(false));
                }}
                className={
                  desk.frontPage === mode
                    ? "rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper"
                    : "rounded-full border border-line px-4 py-2 text-sm"
                }
              >
                {mode === "hor" ? "प्रतिनिधिसभा" : "स्थानीय निकाय"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "hor" ? (
        <div className="space-y-6">
          {seats.map((seat) => (
            <SeatEditor
              key={seat.id}
              seatId={seat.id}
              title={seatLabel(seat, "np")}
              candidates={seat.candidates}
              busy={busy}
              onSave={(candidates) => {
                setBusy(true);
                setErr(null);
                void saveConstituency({ data: { id: seat.id, candidates } })
                  .then((next) => {
                    setDesk(next);
                    setMsg(`${seatLabel(seat, "np")} सेभ भयो।`);
                  })
                  .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
                  .finally(() => setBusy(false));
              }}
            />
          ))}
        </div>
      ) : null}

      {tab === "local" ? (
        <div className="space-y-6">
          {locals.map((body) => (
            <LocalEditor
              key={body.id}
              body={body}
              busy={busy}
              onSave={(payload) => {
                setBusy(true);
                setErr(null);
                void saveLocalBody({ data: payload })
                  .then((next) => {
                    setDesk(next);
                    setMsg(`${payload.name} सेभ भयो।`);
                  })
                  .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
                  .finally(() => setBusy(false));
              }}
              onDelete={() => {
                if (!window.confirm(`${body.name} मेट्ने?`)) return;
                setBusy(true);
                void deleteLocalBody({ data: { id: body.id } })
                  .then(setDesk)
                  .finally(() => setBusy(false));
              }}
            />
          ))}
        </div>
      ) : null}

      {tab === "people" ? (
        <PeopleEditor
          people={people}
          busy={busy}
          onSave={(row) => {
            setBusy(true);
            setErr(null);
            void savePolitician({ data: row })
              .then((next) => {
                setDesk(next);
                setMsg("प्रोफाइल सेभ भयो।");
              })
              .catch((e) => setErr(e instanceof Error ? e.message : "सेभ भएन।"))
              .finally(() => setBusy(false));
          }}
          onDelete={(id) => {
            setBusy(true);
            void deletePolitician({ data: { id } })
              .then(setDesk)
              .finally(() => setBusy(false));
          }}
        />
      ) : null}
    </section>
  );
}

function SeatEditor({
  title,
  candidates,
  busy,
  onSave,
}: {
  seatId: string;
  title: string;
  candidates: Candidate[];
  busy: boolean;
  onSave: (rows: Candidate[]) => void;
}) {
  const [rows, setRows] = useState(candidates);
  useEffect(() => setRows(candidates), [candidates]);
  return (
    <div className="rounded-2xl border border-line p-4">
      <h3 className="font-display text-xl">{title}</h3>
      <CandidateFields rows={rows} setRows={setRows} />
      <button
        type="button"
        disabled={busy}
        onClick={() => onSave(rows)}
        className="mt-3 inline-flex min-h-10 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
      >
        क्षेत्र सेभ
      </button>
    </div>
  );
}

function LocalEditor({
  body,
  busy,
  onSave,
  onDelete,
}: {
  body: LocalBody;
  busy: boolean;
  onSave: (payload: { id: string; name: string; type: string; post: string; ward?: string; candidates: Candidate[] }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(body.name);
  const [type, setType] = useState(body.type);
  const [post, setPost] = useState(body.post);
  const [ward, setWard] = useState(body.ward);
  const [rows, setRows] = useState(body.candidates);
  useEffect(() => {
    setName(body.name);
    setType(body.type);
    setPost(body.post);
    setWard(body.ward);
    setRows(body.candidates);
  }, [body]);
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          निकाय
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-medium">
          प्रकार
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            {LOCAL_BODY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          पद
          <select value={post} onChange={(e) => setPost(e.target.value)} className={field}>
            {LOCAL_POSTS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          वडा (वैकल्पिक)
          <input value={ward} onChange={(e) => setWard(e.target.value)} className={field} />
        </label>
      </div>
      <CandidateFields rows={rows} setRows={setRows} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSave({ id: body.id, name, type, post, ward, candidates: rows })}
          className="inline-flex min-h-10 items-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60"
        >
          निकाय सेभ
        </button>
        <button type="button" onClick={onDelete} className="text-sm font-semibold text-mark">
          मेट्नुहोस्
        </button>
      </div>
    </div>
  );
}

function CandidateFields({
  rows,
  setRows,
}: {
  rows: Candidate[];
  setRows: (rows: Candidate[]) => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      {rows.map((row, i) => (
        <div key={row.id || i} className="grid gap-2 rounded-xl bg-paper p-3 sm:grid-cols-2">
          <input
            value={row.name}
            placeholder="नाम"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, name: e.target.value } : r)))}
            className={field}
          />
          <input
            value={row.party}
            placeholder="दल"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, party: e.target.value } : r)))}
            className={field}
          />
          <input
            type="number"
            min={0}
            value={row.votes}
            placeholder="मत"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, votes: Number(e.target.value) || 0 } : r)))}
            className={field}
          />
          <input
            value={row.photo || ""}
            placeholder="फोटो URL"
            onChange={(e) => setRows(rows.map((r, n) => (n === i ? { ...r, photo: e.target.value } : r)))}
            className={field}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={row.winner}
              onChange={(e) =>
                setRows(rows.map((r, n) => ({ ...r, winner: n === i ? e.target.checked : false })))
              }
            />
            विजयी
          </label>
          <button
            type="button"
            className="text-left text-sm text-mark"
            onClick={() => setRows(rows.filter((_, n) => n !== i))}
          >
            हटाउनुहोस्
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, emptyCand()])}
        className="text-sm font-semibold text-crimson"
      >
        + उम्मेदवार
      </button>
    </div>
  );
}

function PeopleEditor({
  people,
  busy,
  onSave,
  onDelete,
}: {
  people: Politician[];
  busy: boolean;
  onSave: (row: Politician) => void;
  onDelete: (id: string) => void;
}) {
  const blank: Politician = { id: "", name: "", party: "", partySlug: "", photo: "", bio: "", post: "", place: "बारा", phone: "", email: "", education: "" };
  const [form, setForm] = useState<Politician>(blank);
  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-2xl border border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
          setForm(blank);
        }}
      >
        <h3 className="font-display text-xl">{form.id ? "प्रोफाइल सम्पादन" : "नयाँ राजनीतिज्ञ"}</h3>
        <input value={form.name} required placeholder="नाम" onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
        <input value={form.party} placeholder="दल" onChange={(e) => setForm({ ...form, party: e.target.value })} className={field} />
        <input value={form.post} placeholder="पद (सांसद, मेयर…)" onChange={(e) => setForm({ ...form, post: e.target.value })} className={field} />
        <input value={form.place} placeholder="स्थान (बारा-१…)" onChange={(e) => setForm({ ...form, place: e.target.value })} className={field} />
        <input value={form.phone} placeholder="मोबाइल नम्बर" onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
        <input type="email" value={form.email} placeholder="इमेल ठेगाना" onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
        <input value={form.education} placeholder="शैक्षिक योग्यता" onChange={(e) => setForm({ ...form, education: e.target.value })} className={field} />
        <input value={form.photo} placeholder="बाह्य प्रोफाइल फोटो URL" onChange={(e) => setForm({ ...form, photo: e.target.value })} className={field} />
        <textarea value={form.bio} placeholder="संक्षिप्त परिचय" rows={3} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={field} />
        <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center justify-center rounded-full bg-crimson px-4 text-sm font-semibold text-paper disabled:opacity-60">
          प्रोफाइल सेभ
        </button>
      </form>
      <ul className="divide-y divide-line">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-3">
            {p.photo ? <img src={p.photo} alt="" className="size-12 rounded-full object-cover" /> : <span className="size-12 rounded-full bg-chip" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.post} · {p.place}</p>
            </div>
            <Link to="/politician/$id" params={{ id: p.id }} className="text-sm text-crimson">
              साइटमा हेर्नुहोस्
            </Link>
            <button type="button" className="text-sm text-crimson" onClick={() => setForm(p)}>सम्पादन</button>
            <button type="button" className="text-sm text-mark" onClick={() => onDelete(p.id)}>मेट्नुहोस्</button>
          </li>
        ))}
        {!people.length ? <li className="py-3 text-sm text-muted">प्रोफाइल छैन।</li> : null}
      </ul>
    </div>
  );
}
