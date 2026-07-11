import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CuratorStudio from "@/components/CuratorStudio";

export default function Home() {
  return (
    <div className="min-h-full bg-[#080808] text-white">
      <Header />
      <main>
        <Hero />
        <CuratorStudio />
      </main>
      <footer className="border-t border-white/6 px-6 py-8 text-center">
        <p className="text-xs text-zinc-600">
          Site ready · Classifier & Gemini edit plug in via API when you&apos;re ready
        </p>
      </footer>
    </div>
  );
}
