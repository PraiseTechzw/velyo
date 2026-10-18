import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/veylo-logo-header.png";
import markWhite from "@/assets/veylo-mark-white.png";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,oklch(0.94_0.055_158/0.55),transparent_45%),oklch(0.985_0.008_158)] px-4 py-5 font-sans text-foreground sm:px-8 sm:py-7">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" aria-label="Veylo home"><img src={logo} alt="Veylo" className="h-9 w-auto" /></Link>
        <Link to="/" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-white/70 hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to home</Link>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-6.5rem)] max-w-6xl items-center justify-center py-8 sm:py-12">
        <section className="w-full max-w-[440px] rounded-3xl border border-white/90 bg-white p-6 shadow-[0_24px_80px_-36px_oklch(0.3_0.08_158/0.28)] sm:p-9">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand"><img src={markWhite} alt="" className="h-8 w-8" /></div>
          {children}
          <p className="mt-8 text-center text-xs text-muted-foreground">Secure access to your Veylo business account</p>
        </section>
      </div>
    </main>
  );
}
