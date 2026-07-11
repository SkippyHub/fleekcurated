import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CuratorStudio from "@/components/CuratorStudio";

export default function Home() {
  return (
    <div className="min-h-full bg-fleek-bg text-fleek-text">
      <Header />
      <main>
        <Hero />
        <CuratorStudio />
      </main>
      <footer className="border-t border-fleek-border bg-fleek-surface px-6 py-8 text-center">
        <p className="text-xs text-fleek-muted">
          Fleek Curated · Trusted by resellers ·{" "}
          <a href="https://joinfleek.com" className="font-medium text-fleek-text hover:text-tiger-gold hover:underline">
            joinfleek.com
          </a>
        </p>
      </footer>
    </div>
  );
}
