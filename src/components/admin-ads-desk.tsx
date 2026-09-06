import { useEffect, useState } from "react";
import { AD_SLOTS, createAd, deleteAd, listAds, type AdItem, type AdKind } from "@/lib/ads";
import { getMailSettings, saveMailSettings } from "@/lib/mail";

const field =
  "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson";

export function AdsDeskPanel() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [slot, setSlot] = useState<string>(AD_SLOTS[0].id);
  const [kind, setKind] = useState<AdKind>("photo");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [html, setHtml] = useState("");
  const [href, setHref] = useState("");
  const [fromEmail, setFromEmail] = useState("noreply@kalaiyaonline.com");
  const [fromName, setFromName] = useState("KalaiyaOnline");
  const [resendKey, setResendKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    void listAds().then(setAds);
    void getMailSettings()
      .then((m) => {
        setFromEmail(m.fromEmail);
        setFromName(m.fromName);
        setHasKey(m.hasKey);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-mark">{error}</p> : null}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-2xl">इमेल सेटिङ (पासवर्ड रिकभरी)</h2>
        <p className="mt-1 text-sm text-muted">
          रिकभरी लिंक प्रयोगकर्ताको इमेलमा जान Resend API की चाहिन्छ।
          {hasKey ? " की सेभ छ।" : " की अहिले छैन।"}
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void saveMailSettings({ data: { fromEmail, fromName, resendKey: resendKey || undefined } })
              .then(() => {
                setResendKey("");
                refresh();
              })
              .catch((err) => setError(err instanceof Error ? err.message : "इमेल सेटिङ सेभ भएन।"));
          }}
        >
          <label className="text-sm font-medium">
            पठाउने नाम
            <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={field} />
          </label>
          <label className="text-sm font-medium">
            पठाउने इमेल
            <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={field} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Resend API की
            <input
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              placeholder="re_..."
              className={field}
            />
          </label>
          <button className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper">सेभ</button>
        </form>
      </section>

      <form
        className="space-y-3 rounded-2xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void createAd({ data: { slot, kind, title, body, imageUrl, html, href, active: true } })
            .then(() => {
              setTitle("");
              setBody("");
              setImageUrl("");
              setHtml("");
              setHref("");
              refresh();
            })
            .catch((err) => setError(err instanceof Error ? err.message : "विज्ञापन सेभ भएन।"));
        }}
      >
        <h2 className="font-display text-2xl">नयाँ विज्ञापन</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            स्थान
            <select value={slot} onChange={(e) => setSlot(e.target.value)} className={field}>
              {AD_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            प्रकार
            <select value={kind} onChange={(e) => setKind(e.target.value as AdKind)} className={field}>
              <option value="photo">फोटो</option>
              <option value="text">टेक्स्ट</option>
              <option value="html">HTML</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium">
          शीर्षक
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        {kind === "photo" ? (
          <label className="block text-sm font-medium">
            तस्बिर लिंक
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={field} />
          </label>
        ) : null}
        {kind === "text" ? (
          <label className="block text-sm font-medium">
            पाठ
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={field} />
          </label>
        ) : null}
        {kind === "html" ? (
          <label className="block text-sm font-medium">
            HTML
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={5} className={field} />
          </label>
        ) : null}
        <label className="block text-sm font-medium">
          लिंक (वैकल्पिक)
          <input type="url" value={href} onChange={(e) => setHref(e.target.value)} className={field} />
        </label>
        <button className="rounded-full bg-crimson px-4 py-2 text-sm font-semibold text-paper">थप्नुहोस्</button>
      </form>

      <ul className="space-y-3">
        {ads.map((ad) => (
          <li key={ad.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
            <div>
              <p className="text-xs text-muted">
                {AD_SLOTS.find((s) => s.id === ad.slot)?.label ?? ad.slot} · {ad.kind}
              </p>
              <p className="font-semibold">{ad.title || "विज्ञापन"}</p>
            </div>
            <button type="button" className="text-sm text-mark" onClick={() => void deleteAd({ data: { id: ad.id } }).then(refresh)}>
              मेट्नुहोस्
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
