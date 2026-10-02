import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import CaseCanvas from "@/components/CaseCanvas";
import FooterReveal from "@/components/FooterReveal";
import { CASES, getCase } from "@/components/cases";
import { EntranceScope } from "@/components/Entrance";

export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

// Only the cases listed in cases.ts exist.
export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/cases/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = getCase(slug);
  if (!data) return {};
  return { title: `${data.title} — Adriel Colaço`, description: data.summary.split("\n\n")[0] };
}

export default async function CasePage(props: PageProps<"/cases/[slug]">) {
  const { slug } = await props.params;
  const data = getCase(slug);
  if (!data) notFound();

  // Same entrances as the home: the "blur" profile (globals.css + Entrance.tsx).
  return (
    <EntranceScope profile="blur">
      {/* No loading screen on inner pages: the header drops in straight away. */}
      <Navbar entranceDelay={0} />
      <main>
        <CaseCanvas data={data} />
      </main>
      {/* The blue floods in as the footer scrolls up (no Linha line to chain off here). */}
      <FooterReveal />
    </EntranceScope>
  );
}
