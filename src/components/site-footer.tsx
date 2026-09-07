import { Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  Camera,
  Droplet,
  Home,
  Info,
  LineChart,
  Mail,
  MapPin,
  Phone,
  Shield,
  Users,
} from "lucide-react";
import type { AboutPage } from "@/lib/about";

const FOOTER_LINKS = [
  { to: "/", label: "गृह", icon: Home },
  { to: "/gallery", label: "ग्यालरी", icon: Camera },
  { to: "/directory", label: "डाइरेक्ट्री", icon: Building2 },
  { to: "/blood", label: "रक्तदाता", icon: Droplet },
  { to: "/members", label: "दर्ता सदस्य", icon: Users },
  { to: "/market", label: "सेयर बजार", icon: LineChart },
  { to: "/patro", label: "पात्रो", icon: CalendarDays },
  { to: "/about", label: "हाम्रोबारे", icon: Info },
  { to: "/privacy", label: "गोपनीयता", icon: Shield },
] as const;

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[#e8efe9] transition hover:border-[#ffd27a]/50 hover:bg-[#ffd27a]/10 hover:text-[#ffd27a]";

export function SiteFooter({ about }: { about: AboutPage | null }) {
  const blurb = (about?.body || "कलैया, बारा र मधेशका स्थानीय समाचार।").slice(0, 160);

  return (
    <footer className="border-t border-line bg-[#10261a] text-[#e8efe9]">
      <div className="h-1 bg-gradient-to-r from-crimson via-mark to-crimson" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:py-12">
        <div>
          <img src="/logo-dark.jpg" alt="KalaiyaOnline.com" className="h-10 w-auto" />
          <p className="mt-3 font-display text-lg">{about?.orgName || "KalaiyaOnline"}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{blurb}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-mark">सम्पर्क</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {about?.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-mark" />
                {about.address}
              </p>
            ) : null}
            {about?.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-mark" />
                <a href={`tel:${about.phone}`}>{about.phone}</a>
              </p>
            ) : null}
            {about?.email ? (
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-mark" />
                <a href={`mailto:${about.email}`}>{about.email}</a>
              </p>
            ) : null}
            {about?.website ? (
              <a href={about.website} className="block hover:text-mark">
                {about.website.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
            {about?.facebook ? (
              <a href={about.facebook} className="block hover:text-mark">
                फेसबुक
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-mark">दर्ता विवरण</p>
          <div className="mt-3 space-y-2 text-sm text-white/80">
            {about?.orgName ? <p>{about.orgName}</p> : null}
            {about?.registrationNo ? <p>दर्ता नम्बर: {about.registrationNo}</p> : null}
            {about?.extraNote ? <p className="whitespace-pre-wrap text-white/70">{about.extraNote}</p> : null}
            {!about?.registrationNo && !about?.extraNote ? (
              <p className="text-white/50">हाम्रोबारेबाट दर्ता विवरण थप्नुहोस्।</p>
            ) : null}
          </div>
        </div>
        <div className="sm:col-span-3">
          <p className="text-[11px] font-bold tracking-[0.18em] text-mark">मेनु</p>
          <nav className="mt-3 flex flex-wrap gap-2 text-sm">
            {FOOTER_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={chip}>
                <Icon className="size-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#0b1a12] px-4 py-4 pb-28 sm:px-6 lg:pb-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center text-xs sm:flex-row sm:text-left">
          <p className="text-white/45">© {new Date().getFullYear()} {about?.orgName || "KalaiyaOnline"}</p>
          <p className="font-medium text-[#ffd27a]">Designed and Developed By : Arun Kumar Sah</p>
        </div>
      </div>
    </footer>
  );
}
