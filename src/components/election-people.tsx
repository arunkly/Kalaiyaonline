import { Link } from "@tanstack/react-router";
import { politiciansOf, type ElectionData, type Politician } from "@/lib/election";

export function sortedPoliticians(data: ElectionData): Politician[] {
  return [...politiciansOf(data)].sort((a, b) =>
    a.name.localeCompare(b.name, "ne", { sensitivity: "base" }),
  );
}

export function PoliticiansSidebar({ data }: { data: ElectionData }) {
  const people = sortedPoliticians(data);
  return (
    <aside className="rounded-[1.5rem] border border-line bg-white p-4 lg:sticky lg:top-24">
      <h2 className="font-display text-xl">राजनीतिज्ञ</h2>
      <p className="mt-1 text-xs text-muted">अकारादि क्रम</p>
      {people.length ? (
        <ul className="mt-4 divide-y divide-line">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                to="/politician/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 py-2.5 hover:text-crimson"
              >
                {p.photo ? (
                  <img src={p.photo} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-chip text-sm font-bold text-crimson">
                    {p.name.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {[p.post, p.party].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">प्रोफाइल थपिएको छैन।</p>
      )}
    </aside>
  );
}
