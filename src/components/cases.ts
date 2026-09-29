/**
 * The case pages (/cases/[slug]), Behance-style: an intro (title, summary and a
 * table of facts), then the work itself as rows of image blocks, then "More
 * works". Adding a case is only data — drop its images in /public/cases/<slug>/
 * (videos stay on Vimeo, embedded by id) and add an entry here.
 */
import type { Seal } from "./Seals";
import { ONPROFIT_SEALS } from "./projects";

export type CaseImage = {
  src: string;
  alt: string;
  objectPosition?: string;
};

/** A Vimeo video, embedded as a silent background loop (no controls). */
export type CaseVideo = {
  vimeo: string;
  alt: string;
};

export type CaseBlock = CaseImage | CaseVideo;

/**
 * One row of blocks across the content width (1400px on the 1440 desktop
 * frame): one image or video full width, or several side by side sharing it
 * with 20px gaps. `height` is the row's height on desktop, in design px
 * (default 728); on phones the blocks stack full width and keep their desktop
 * proportions.
 */
export type CaseRow = {
  images: CaseBlock[];
  height?: number;
};

// A full-width 16:9 block (the Behance exports are 1920×1080).
const WIDE = (1400 * 9) / 16;
const wide = (block: CaseBlock): CaseRow => ({ images: [block], height: WIDE });

export type Case = {
  slug: string;
  /** Ribbons hung from the intro box's top-left corner. */
  seals?: Seal[];
  title: string;
  summary: string;
  /** The facts table; a value with `href` links out (in a new tab). */
  facts: { label: string; value: string; href?: string }[];
  rows: CaseRow[];
  /** Names from PROJECTS (projects.ts) shown under "More works". */
  moreWorks: string[];
};

export const CASES: Case[] = [
  {
    // Figma "Case" (2:75)
    slug: "onprofit",
    seals: ONPROFIT_SEALS,
    title: "OnProfit",
    summary:
      "O projeto envolveu diversas etapas, indo do wireframe ao design do app, além do desenvolvimento da landing page de apresentação da plataforma, redesign da dashboard web e criação de apresentações institucionais, entre outras entregas.",
    facts: [
      { label: "Client", value: "OnProfit" },
      { label: "Services", value: "UX/UI / 3D / Art Direction" },
      { label: "Agency", value: "Mesa Estudio", href: "https://mesa.keepo.bio/" },
      { label: "Country", value: "Brazil" },
    ],
    // In the Behance project's order (behance.net/gallery/218605897/OnProfit),
    // except that the devices video opens the case (and the logo reveal is left out).
    rows: [
      wide({ vimeo: "1111297170", alt: "Telas da OnProfit em vários dispositivos" }),
      wide({
        src: "/cases/onprofit/behance-02.png",
        alt: "Paleta de cores da OnProfit: Digital Green, Profit Green, Online Green, Dark Green, Soft Black, Profit Blue e Greenish White",
      }),
      wide({ src: "/cases/onprofit/behance-03.png", alt: "Símbolo da OnProfit em acrílico, ao lado da sua construção geométrica" }),
      wide({ vimeo: "1111297218", alt: "Bento board animado da marca OnProfit" }),
      wide({ src: "/cases/onprofit/behance-05.png", alt: "Usuário sorrindo ao celular, ao lado do perfil da OnProfit nas redes" }),
      wide({ vimeo: "1111297199", alt: "Telas do app OnProfit no iPhone" }),
      wide({ src: "/cases/onprofit/behance-07.png", alt: "Estande da OnProfit em evento, com a campanha “Infoprodutor, diga adeus às taxas”" }),
      wide({ src: "/cases/onprofit/behance-09.png", alt: "Posts de redes sociais da OnProfit" }),
      wide({ vimeo: "1111297287", alt: "Peças da OnProfit em tela dividida" }),
      wide({ vimeo: "1111297237", alt: "Bento board animado da marca OnProfit, segunda versão" }),
      wide({ src: "/cases/onprofit/behance-12.png", alt: "Painéis da OnProfit numa estação de metrô" }),
      wide({ vimeo: "1111297307", alt: "Peças da OnProfit em tela dividida, segunda versão" }),
      wide({ src: "/cases/onprofit/behance-14.png", alt: "Cartazes da campanha da OnProfit" }),
      wide({ src: "/cases/onprofit/behance-15.png", alt: "Fachada com o símbolo da OnProfit e ecobag da marca" }),
    ],
    moreWorks: ["Heineken", "Farol Santander", "Holly Bakehouse"],
  },
];

export const getCase = (slug: string) => CASES.find((c) => c.slug === slug);
