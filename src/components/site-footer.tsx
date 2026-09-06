import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import type { AboutPage } from "@/lib/about";

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
          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link to="/" className="hover:text-mark">गृह</Link>
            <Link to="/gallery" className="hover:text-mark">ग्यालरी</Link>
            <Link to="/directory" className="hover:text-mark">डाइरेक्ट्री</Link>
            <Link to="/blood" className="hover:text-mark">रक्तदाता</Link>
            <Link to="/about" className="hover:text-mark">हाम्रोबारे</Link>
            <Link to="/privacy" className="hover:text-mark">गोपनीयता</Link>
          </nav>
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
      </div>
      <div className="border-t border-white/10 px-4 py-4 pb-28 text-center text-xs text-white/50 sm:px-6 lg:pb-4">
        © {new Date().getFullYear()} {about?.orgName || "KalaiyaOnline"}
      </div>
    </footer>
  );
}
