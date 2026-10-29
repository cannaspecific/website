import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

const NAV = [
  { href: "/#problem", label: "Problem" },
  { href: "/#method", label: "Method" },
  { href: "/#tiers", label: "Tiers" },
  { href: "/#science", label: "Science" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#about", label: "About" },
];

function Mark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#101714" />
      <path d="M6 23h4V13H6zm8 0h4V7h-4zm8 0h4V15h-4z" fill="#d7f25c" />
    </svg>
  );
}

function SectionLink({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        const id = href.split("#")[1];
        onNavigate?.();
        if (!id || window.location.pathname !== "/") return;
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        const next = `/#${id}`;
        if (`${window.location.pathname}${window.location.hash}` !== next) {
          history.pushState(null, "", next);
        }
        // pushState does not notify the signup form, which reads the hash to pick a mode.
        window.dispatchEvent(new Event("hashchange"));
      }}
    >
      {children}
    </a>
  );
}

export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    const id = window.location.hash.replace(/^#/, "");
    const target = id ? document.getElementById(id) : null;
    if (target) {
      target.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3efe6] text-[#14211c]">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="content">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass = "text-sm font-medium text-[#14211c] underline-offset-4 hover:underline";

  return (
    <header className="sticky top-0 z-40 border-b border-[#ddd4c4] bg-[#f3efe6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <a href="/" className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight">
          <Mark />
          <span>CannaSpecific</span>
        </a>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <SectionLink key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </SectionLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-[#cfc6b6] px-2.5 py-1 text-xs font-semibold tracking-wide sm:inline">
            21+
          </span>
          <SectionLink
            href="/#waitlist"
            className="hidden rounded-full bg-[#0f4d3a] px-4 py-2 text-sm font-semibold text-[#f7f4ec] hover:bg-[#0c3f30] sm:inline-flex"
          >
            Join the list
          </SectionLink>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#cfc6b6] lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.8" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id={menuId} className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-[#ddd4c4] px-5 py-4 lg:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <SectionLink
                  href={item.href}
                  className="block rounded-md px-2 py-3 text-base font-medium"
                  onNavigate={() => setOpen(false)}
                >
                  {item.label}
                </SectionLink>
              </li>
            ))}
            <li>
              <SectionLink
                href="/#partner"
                className="block rounded-md px-2 py-3 text-base font-medium"
                onNavigate={() => setOpen(false)}
              >
                Pilot inquiry
              </SectionLink>
            </li>
            <li>
              <SectionLink
                href="/#waitlist"
                className="mt-2 block rounded-full bg-[#0f4d3a] px-4 py-3 text-center font-semibold text-[#f7f4ec]"
                onNavigate={() => setOpen(false)}
              >
                Join the list
              </SectionLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[#ddd4c4] bg-[#efeae0]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2 font-heading text-xl">
            <Mark className="h-6 w-6" />
            CannaSpecific
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#24312c]">
            Early-stage software for reading cannabis lab certificates alongside real-world reviews. Florida first.
          </p>
        </div>
        <div className="md:col-span-3">
          <h2 className="kicker text-[#3d4a44]">On this site</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a className="underline-offset-4 hover:underline" href="/#method">How it works</a></li>
            <li><a className="underline-offset-4 hover:underline" href="/#tiers">Product tiers</a></li>
            <li><a className="underline-offset-4 hover:underline" href="/#waitlist">Waitlist</a></li>
            <li><a className="underline-offset-4 hover:underline" href="/#partner">Pilot inquiry</a></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <h2 className="kicker text-[#3d4a44]">Policies</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a className="underline-offset-4 hover:underline" href="/privacy">Privacy policy</a></li>
            <li><a className="underline-offset-4 hover:underline" href="/terms">Terms</a></li>
            <li>
              <a className="underline-offset-4 hover:underline" href="mailto:cannaspecific@gmail.com">
                cannaspecific@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#ddd4c4]">
        <div className="mx-auto max-w-6xl space-y-3 px-5 py-6 text-sm leading-relaxed text-[#24312c] md:px-8">
          <p>
            <strong>21+.</strong> CannaSpecific is for adults 21 and older. We do not sell cannabis, we do not help anyone obtain it, and we do not provide medical or health advice.
          </p>
          <p>
            Nothing on this site is a diagnosis, treatment claim, or promise about how a product will feel. Cannabis laws differ by location. You are responsible for following the law where you are.
          </p>
          <p>© {new Date().getFullYear()} CannaSpecific.</p>
        </div>
      </div>
    </footer>
  );
}

export function PageIntro({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <header className="border-b border-[#ddd4c4] bg-[#f7f4ec]">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
        <p className="kicker text-[#0f4d3a]">{kicker}</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight md:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-[#24312c]">{lede}</p>
      </div>
    </header>
  );
}
