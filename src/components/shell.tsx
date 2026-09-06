import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Camera,
  Droplet,
  Home,
  Menu,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { AdSlot } from "@/components/ad-slot";
import { NoticeBell } from "@/components/notice-bell";
import { SiteFooter } from "@/components/site-footer";
import { MarketTicker } from "@/components/market-ticker";
import { getAboutPage, type AboutPage } from "@/lib/about";
import { cn } from "@/lib/cn";
import { useCategories } from "@/lib/use-categories";

const NAV = [
  { to: "/", label: "गृह", icon: Home },
  { to: "/gallery", label: "ग्यालरी", icon: Camera },
  { to: "/directory", label: "डाइरेक्ट्री", icon: Building2 },
  { to: "/blood", label: "रक्तदाता", icon: Droplet },
  { to: "/chat", label: "च्याट", icon: MessageCircle },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const cats = useCategories();
  const [open, setOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [about, setAbout] = useState<AboutPage | null>(null);

  useEffect(() => {
    void getAboutPage()
      .then(setAbout)
      .catch(() => undefined);
  }, []);
  const [q, setQ] = useState("");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-crimson focus:px-3 focus:py-2 focus:text-paper"
      >
        समाचारमा जानुहोस्
      </a>

      <div className="bg-crimson text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-[11px] font-medium sm:px-6">
          <p className="truncate tracking-wide">कलैया · बारा · मधेश — स्वतन्त्र स्थानीय समाचार</p>
          <span className="hidden shrink-0 rounded-full bg-mark px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-paper sm:inline">
            LIVE
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link to="/" className="min-w-0 flex-1">
            <img
              src="/logo.jpg"
              alt="KalaiyaOnline.com"
              className="h-8 w-auto drop-shadow-sm sm:h-11 md:h-12"
            />
          </Link>

          <form
            action="/search"
            className="hidden min-w-0 flex-[1.2] items-center gap-2 md:flex"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) {
                void navigate({ to: "/search", search: { q: q.trim() } });
              }
            }}
          >
            <label className="sr-only" htmlFor="desk-search">
              खोज
            </label>
            <div className="flex w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 shadow-sm">
              <Search className="size-4 shrink-0 text-muted" />
              <input
                id="desk-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="समाचार खोज्नुहोस्"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
          </form>

          <Link
            to="/search"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface shadow-sm md:hidden"
            aria-label="खोज"
          >
            <Search className="size-5" />
          </Link>
          <NoticeBell />
          <AccountMenu />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface shadow-sm lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="मेनु"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-crimson via-mark to-crimson" />
        <MarketTicker />
        <AdSlot slot="header" className="mx-auto max-w-6xl px-4 py-2 sm:px-6" />

        <nav className="hidden lg:block">
          <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-3 text-sm font-semibold",
                  pathname === item.to
                    ? "border-crimson text-crimson"
                    : "border-transparent text-ink-soft hover:text-crimson",
                )}
              >
                {item.label}
              </Link>
            ))}
            <span className="mx-2 h-4 w-px bg-line" />
            {cats.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-3 text-sm",
                  pathname === `/category/${c.slug}`
                    ? "border-mark font-semibold text-crimson"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {open ? (
        <div className="border-b border-line bg-surface/95 backdrop-blur-sm lg:hidden">
          <nav className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip"
              >
                {item.label}
              </Link>
            ))}
            {cats.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="rounded-xl px-3 py-3 text-sm text-ink-soft hover:bg-chip"
              >
                {c.label}
              </Link>
            ))}
            <Link to="/about" className="rounded-xl px-3 py-3 text-sm hover:bg-chip">
              हाम्रोबारे
            </Link>
            <Link to="/date-converter" className="rounded-xl px-3 py-3 text-sm hover:bg-chip">
              मिति कन्भर्टर
            </Link>
            <Link to="/account" className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip">
              मेरो प्रोफाइल
            </Link>
            <Link to="/login" className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip">
              लगइन / लगआउट
            </Link>
          </nav>
        </div>
      ) : null}

      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:pb-14">
        {children}
      </main>
      <AdSlot slot="footer" className="mx-auto max-w-6xl px-4 py-4 sm:px-6" />
      <SiteFooter about={about} />

      <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-3 mb-[max(0.5rem,env(safe-area-inset-bottom))] rounded-2xl border border-line bg-white/95 shadow-[0_-8px_30px_rgb(16_38_26/0.12)] backdrop-blur-md">
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-crimson via-mark to-crimson" />
          <div className="grid grid-cols-6 px-1 py-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold",
                  active ? "text-crimson" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-full transition",
                    active ? "bg-crimson text-paper shadow-sm" : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setFooterOpen((v) => !v)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold",
              footerOpen ? "text-crimson" : "text-muted",
            )}
            aria-label="मेनु"
          >
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full transition",
                footerOpen ? "bg-crimson text-paper shadow-sm" : "bg-transparent",
              )}
            >
              {footerOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </span>
            मेनु
          </button>
          </div>
        </div>
      </nav>
      {footerOpen ? (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-3 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-xl lg:hidden">
          <p className="px-3 py-2 text-[11px] font-bold tracking-[0.16em] text-muted">थप</p>
          <Link
            to="/date-converter"
            onClick={() => setFooterOpen(false)}
            className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip"
          >
            मिति कन्भर्टर
          </Link>
          <Link
            to="/blood"
            onClick={() => setFooterOpen(false)}
            className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-chip"
          >
            रक्तदाता
          </Link>
          <Link
            to="/about"
            onClick={() => setFooterOpen(false)}
            className="block rounded-xl px-3 py-3 text-sm hover:bg-chip"
          >
            हाम्रोबारे
          </Link>
          <Link
            to="/privacy"
            onClick={() => setFooterOpen(false)}
            className="block rounded-xl px-3 py-3 text-sm hover:bg-chip"
          >
            गोपनीयता नीति
          </Link>
        </div>
      ) : null}
    </div>
  );
}
