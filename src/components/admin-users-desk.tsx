import { useEffect, useState } from "react";
import { deleteAppUser, listAppUsers, listChatWarnings, setUserRole, type AppRole, type AppUserRow, type ChatWarning } from "@/lib/users";

export function UsersDeskPanel() {
  const [rows, setRows] = useState<AppUserRow[]>([]);
  const [warnings, setWarnings] = useState<ChatWarning[]>([]);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    void listAppUsers()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "प्रयोगकर्ता लोड भएन।"));
    void listChatWarnings()
      .then(setWarnings)
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">प्रयोगकर्ता र भूमिका</h2>
      <p className="mt-1 text-sm text-muted">सदस्यलाई सदस्य, सम्पादक वा प्रशासक बनाउन सकिन्छ।</p>
      {error ? <p className="mt-2 text-sm text-mark">{error}</p> : null}
      <ul className="mt-4 divide-y divide-line">
        {rows.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-semibold">{u.name || "सदस्य"}</p>
              <p className="text-sm text-muted">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
            <select
              value={u.role}
              onChange={(e) =>
                void setUserRole({ data: { userId: u.id, role: e.target.value as AppRole } }).then(refresh)
              }
              className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            >
              <option value="member">सदस्य</option>
              <option value="editor">सम्पादक</option>
              <option value="admin">प्रशासक</option>
            </select>
            <button
              type="button"
              className="text-sm font-semibold text-mark"
              onClick={() => {
                if (!window.confirm(`${u.email || u.name} मेट्ने?`)) return;
                void deleteAppUser({ data: { userId: u.id } })
                  .then(refresh)
                  .catch((err) => setError(err instanceof Error ? err.message : "मेटिएन।"));
              }}
            >
              मेट्नुहोस्
            </button>
            </div>
          </li>
        ))}
      </ul>
      <h3 className="mt-8 font-display text-xl">च्याट चेतावनी लग</h3>
      <ul className="mt-3 divide-y divide-line">
        {warnings.map((w) => (
          <li key={w.id} className="py-3 text-sm">
            <p className="font-semibold">{w.name} · {w.email}</p>
            <p className="text-muted">{w.body}</p>
          </li>
        ))}
        {!warnings.length ? <li className="py-3 text-sm text-muted">लग खाली छ।</li> : null}
      </ul>
    </section>
  );
}
