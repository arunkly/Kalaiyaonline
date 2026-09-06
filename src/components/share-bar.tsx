import { Check, Link2, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export function ShareBar({
  path,
  title,
}: {
  path?: string;
  slug?: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    const suffix = path || "/";
    if (typeof window !== "undefined") return `${window.location.origin}${suffix}`;
    return `https://kalaiyaonline.com${suffix}`;
  }, [path]);
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url, text: title });
        return;
      } catch {
        /* cancelled */
      }
    }
    void copy();
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-surface p-4">
      <p className="text-[11px] font-bold tracking-[0.18em] text-muted">सेयर गर्नुहोस्</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1877F2] px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          <span className="text-base leading-none">f</span>
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#111111] px-4 text-sm font-semibold text-white shadow-sm hover:brightness-125"
        >
          𝕏
        </a>
        <a
          href={`https://api.whatsapp.com/send?text=${text}%20${encoded}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-sm",
            copied ? "bg-crimson text-paper" : "border border-line bg-paper text-ink hover:border-crimson",
          )}
        >
          {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copied ? "कपी भयो" : "लिंक कपी"}
        </button>
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-mark px-4 text-sm font-semibold text-paper shadow-sm hover:brightness-110"
        >
          <Share2 className="size-4" />
          सेयर
        </button>
      </div>
    </div>
  );
}
