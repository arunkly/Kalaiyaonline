import { useEffect, useState } from "react";
import { DEFAULT_SITE, getSiteIdentity, saveSiteIdentity } from "@/lib/site";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function SiteDeskPanel() {
  const [name, setName] = useState(DEFAULT_SITE.name);
  const [nameNp, setNameNp] = useState(DEFAULT_SITE.nameNp);
  const [tagline, setTagline] = useState(DEFAULT_SITE.tagline);
  const [description, setDescription] = useState(DEFAULT_SITE.description);
  const [searchHint, setSearchHint] = useState(DEFAULT_SITE.searchHint);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function refresh() {
    void getSiteIdentity()
      .then((s) => {
        setName(s.name);
        setNameNp(s.nameNp);
        setTagline(s.tagline);
        setDescription(s.description);
        setSearchHint(s.searchHint);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-2xl">साइट सेटिङ</h2>
      <p className="text-sm text-muted">
        साइटको नाम, ट्यागलाइन र विवरण यहाँबाट बदलिन्छ — हेडर, फुटर र समाचार मेटामा देखिन्छ।
      </p>
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      {ok ? <p className="text-sm font-semibold text-[#14934e]">{ok}</p> : null}
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          setOk(null);
          void saveSiteIdentity({
            data: { name, nameNp, tagline, description, searchHint },
          })
            .then(() => {
              setOk("साइट सेटिङ सेभ भयो। पेज रिफ्रेस गर्नुहोस्।");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "सेभ भएन।"))
            .finally(() => setSaving(false));
        }}
      >
        <label className="text-sm font-medium">
          साइट नाम (अंग्रेजी)
          <input value={name} onChange={(e) => setName(e.target.value)} required className={field} />
        </label>
        <label className="text-sm font-medium">
          साइट नाम (नेपाली)
          <input value={nameNp} onChange={(e) => setNameNp(e.target.value)} required className={field} />
        </label>
        <label className="text-sm font-medium">
          ट्यागलाइन
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-medium">
          छोटो विवरण
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={field}
          />
        </label>
        <label className="text-sm font-medium">
          खोज बाकसको पाठ
          <input value={searchHint} onChange={(e) => setSearchHint(e.target.value)} className={field} />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-crimson px-5 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {saving ? "सेभ हुँदै…" : "सेभ गर्नुहोस्"}
        </button>
      </form>
    </section>
  );
}
