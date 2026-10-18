import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/veylo-logo-header.png";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useAccount } from "@/components/auth-provider";

const links = [
  ["Home", "#top"],
  ["Features", "#features"],
  ["Industry", "#industry"],
  ["How it Works", "#how"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
  ["Contact", "#contact"],
] as const;

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export function SiteHeader() {
  const { user, loading } = useAccount();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-3 z-50 px-4 pt-3 md:top-4">
      <div
        data-scrolled={scrolled || open}
        className="nav-glass mx-auto max-w-6xl rounded-3xl px-4 py-2.5 md:rounded-full md:px-6"
      >
        <div className="flex items-center justify-between gap-4">
          <a href="#top" className="inline-flex items-center" aria-label="Veylo home">
            <img
              src={logo}
              alt="Veylo"
              width={240}
              height={68}
              className="h-8 w-auto md:h-9"
            />
          </a>
          <nav className="hidden gap-3 text-xs font-medium text-foreground/75 lg:flex" aria-label="Main">
            {links.map(([l, h]) => (
              <a key={l} href={h} className="link-underline">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!loading && (user ? <Button asChild><Link to="/account">My business</Link></Button> : <><Button asChild variant="ghost"><Link to="/auth">Log in</Link></Button><Button asChild className="hidden sm:inline-flex"><Link to="/auth" search={{ mode: "signup" }}>Sign up</Link></Button></>)}
            <Button variant="ghost" size="icon"
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-brand-soft lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        <div className={`grid transition-all duration-500 lg:hidden ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <nav className="overflow-hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1 pb-2 pt-3">
              {links.map(([l, h]) => (
                <a key={l} href={h} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-brand-soft hover:text-brand">
                  {l}
                </a>
              ))}
              <Button asChild className="mt-2">{user ? <Link to="/account" onClick={() => setOpen(false)}>My business</Link> : <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}>Sign up</Link>}</Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
