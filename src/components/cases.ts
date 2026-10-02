/**
 * The case pages (/cases/[slug]), Behance-style: an intro (title, summary and a
 * table of facts), then the work itself as rows of image blocks, then "More
 * works". Adding a case is only data — drop its images in /public/cases/<slug>/
 * (videos stay on Vimeo, embedded by id) and add an entry here. Each case's
 * "More works" shows the other cases (CaseCanvas), so a new one joins them.
 */
import type { Seal } from "./Seals";
import { ONPROFIT_SEALS } from "./projects";

export type CaseImage = {
  src: string;
  alt: string;
  objectPosition?: string;
  /** A white band above and below the image (20px on desktop and tablets,
   *  10 on phones), for artwork whose panels run into its top and bottom
   *  edges, so they don't butt against the neighbouring blocks. */
  padY?: boolean;
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
// A full-width block at its image's own proportions (`w`×`h` px).
const full = (block: CaseBlock, w: number, h: number): CaseRow => ({ images: [block], height: (1400 * h) / w });

export type Case = {
  slug: string;
  /** Ribbons hung from the intro box's top-left corner. */
  seals?: Seal[];
  title: string;
  /** The intro text; a blank line ("\n\n") starts a new paragraph. */
  summary: string;
  /** The facts table; a value with `href` links out (in a new tab). */
  facts: { label: string; value: string; href?: string }[];
  rows: CaseRow[];
};

export const CASES: Case[] = [
  {
    // Figma "Case" (2:75)
    slug: "onprofit",
    seals: ONPROFIT_SEALS,
    title: "OnProfit",
    summary:
      "Profitability and Productivity, OnProfit arrives on the gateway market to revolutionize how you sell your infoproduct. The new visual identity reflects digital and dynamic aspects, bringing shades of green that refer to high profitability and the digital market, strong contrasts and rich use of gradients that bring out a lot of personality at the same time modernity and confidence.",
    facts: [
      { label: "Client", value: "OnProfit" },
      { label: "Scope", value: "UX/UI / 3D / Art Direction" },
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
  },
  {
    slug: "tcl-semp",
    title: "TCL SEMP",
    summary:
      "The new TCL SEMP website was redesigned with a focus on creating a simpler, clearer and more intuitive experience. The project started by restructuring the navigation, page architecture and product presentation, making it easier to access information and specifications across a broad product portfolio.",
    facts: [
      { label: "Client", value: "TCL SEMP" },
      { label: "Scope", value: "UI/UX" },
      { label: "Country", value: "Brasil/China" },
      { label: "Year", value: "2023" },
    ],
    // In the Behance project's order (behance.net/gallery/256539879/TCL-SEMP-New-Website):
    // its 3840px exports, saved as 2880px WebP.
    rows: [
      full({ src: "/cases/tcl-semp/behance-01.webp", alt: "Novo site da TCL SEMP em notebooks, sob o logo da marca" }, 2880, 2160),
      full({ src: "/cases/tcl-semp/behance-02.webp", alt: "Páginas de produto e institucional (“Conheça nossa história”) do site da TCL SEMP num tablet e num desktop" }, 2880, 2130),
      full({ src: "/cases/tcl-semp/behance-03.webp", alt: "Site da TCL SEMP no celular, ao lado da paleta de cores: vermelhos de destaque, superfícies claras e tons de texto" }, 2880, 2130),
      full({ src: "/cases/tcl-semp/behance-04.webp", alt: "Ícones, a home no celular, a listagem de TVs e áudio num monitor e blocos de conteúdo do site da TCL SEMP" }, 2880, 2130),
      full({ src: "/cases/tcl-semp/behance-05.webp", alt: "Pessoa navegando no site da TCL SEMP num tablet" }, 2880, 2130),
      full({ src: "/cases/tcl-semp/behance-06.webp", alt: "Home do site da TCL SEMP num notebook e a vitrine de TVs com o destaque TCL Ultra-Premium" }, 2880, 2130),
      full({ src: "/cases/tcl-semp/behance-07.webp", alt: "Página de produto da TV de 32” e 43” FHD, com as especificações, nas versões desktop e celular" }, 2880, 2130),
      full({ src: "/cases/tcl-semp/behance-08.webp", alt: "Pessoa diante de um monitor com o site da TCL SEMP, sobre fundo vermelho" }, 2880, 2160),
    ],
  },
  {
    slug: "remapp",
    title: "Remapp",
    summary:
      "In the visual identity, we endeavoured to work with a modern, technological and scientific concept. The colour palette contributed greatly to these attributes, along with strong 3D and illustrations that reinforced the company's personality. We also worked on a typographic and geometric logo, bringing a unique identification to the brand.",
    facts: [
      { label: "Client", value: "Consultix Remapp" },
      { label: "Scope", value: "Illustration / 3D" },
      { label: "Agency", value: "Eich Studio & CO. ©", href: "https://eichstudio.com/" },
      { label: "Country", value: "Brasil" },
    ],
    // In the Behance project's order (behance.net/gallery/208131993/Remapp),
    // saved as WebP (at most 2880px wide); the animated one stays animated.
    rows: [
      full({ src: "/cases/remapp/behance-01.webp", alt: "Painel da Remapp em evento, com o símbolo em vidro e a ilustração do personagem" }, 1920, 1280),
      full({ src: "/cases/remapp/behance-02.webp", padY: true, alt: "Grade de aplicações da marca Remapp: logo, tipografia, ilustrações e moletom" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-03.webp", alt: "Construção geométrica do logotipo Remapp" }, 2880, 1620),
      full({ src: "/cases/remapp/behance-04.webp", padY: true, alt: "Paleta de cores da Remapp: Off White, Blue Sky, Soft Cyan e Dark Blue" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-05.webp", alt: "Logotipo Remapp em branco sobre o azul da marca" }, 2880, 1620),
      full({ src: "/cases/remapp/behance-06.webp", alt: "Fita adesiva com o símbolo RMP" }, 1920, 1280),
      full({ src: "/cases/remapp/behance-07.webp", alt: "Cartões de visita da Remapp" }, 1920, 1080),
      full({ src: "/cases/remapp/behance-08.webp", alt: "Ilustrações dos personagens da Remapp trabalhando com tecnologia" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-09.webp", alt: "Tela de login da plataforma Remapp" }, 2880, 1621),
      full({ src: "/cases/remapp/behance-10.webp", padY: true, alt: "Executivo sorrindo ao notebook e ecobag da Remapp" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-11.webp", alt: "Cartazes da Remapp em painéis de rua" }, 1920, 1280),
      full({ src: "/cases/remapp/behance-12.webp", alt: "Pasta com o logotipo Remapp" }, 1920, 1080),
      full({ src: "/cases/remapp/behance-13.webp", padY: true, alt: "Cartaz da Remapp e o endereço consultixremapp.com.br" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-14.webp", alt: "Site da Remapp com a barra de navegação animada" }, 1920, 1080),
      full({ src: "/cases/remapp/behance-15.webp", padY: true, alt: "Tela de app da Remapp no celular e no relógio" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-16.webp", alt: "Posts de redes sociais da Remapp" }, 1920, 1080),
      full({ src: "/cases/remapp/behance-17.webp", padY: true, alt: "Caixas e crachá com a identidade da Remapp" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-18.webp", alt: "Recepção iluminada com o painel da Remapp" }, 1920, 1280),
      full({ src: "/cases/remapp/behance-19.webp", alt: "Papelaria da Remapp: envelope, cartões e pasta" }, 1920, 1080),
      full({ src: "/cases/remapp/behance-20.webp", padY: true, alt: "Moletom com o símbolo RMP e o card do app da Remapp" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-21.webp", alt: "Cartazes da Remapp numa estação de metrô" }, 1920, 1280),
      full({ src: "/cases/remapp/behance-22.webp", padY: true, alt: "Perfil da Remapp nas redes sociais e copo com a marca" }, 1920, 1040),
      full({ src: "/cases/remapp/behance-23.webp", alt: "Painel luminoso da Remapp num corredor" }, 1920, 1280),
    ],
  },
  {
    slug: "holly-bakehouse",
    title: "Holly Bakehouse",
    summary:
      "Holly Bakehouse was born as Lojinha dos Doces, selling large, well-filled New York-style cookies, but then came the need to stand out in the market and seek originality and authenticity. The mascot was inspired directly by one of the partner Bruna's kittens, creating a greater connection between the brand and its founders. With this, a new brand was born, ready to impact the market and create a strong community of consumers.",
    facts: [
      { label: "Client", value: "Holly Bakehouse" },
      { label: "Scope", value: "Illustration / Logo Design" },
      { label: "Agency", value: "Mesa Estudio", href: "https://mesa.keepo.bio/" },
      { label: "Country", value: "Brasil" },
    ],
    // In the Behance project's order (behance.net/gallery/212725845/Holly-Bakehouse), saved as WebP.
    rows: [
      full({ src: "/cases/holly-bakehouse/behance-01.webp", alt: "Logotipo Holly Bakehouse com o mascote, sobre o azul da marca" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-02.webp", alt: "Logotipo Holly Bakehouse sobre cookies" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-03.webp", alt: "Paleta de cores da Holly Bakehouse: azuis, beges e verdes" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-04.webp", alt: "Selos, ícones e etiquetas da Holly Bakehouse com cookies" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-05.webp", alt: "Versão horizontal do logotipo Holly Bakehouse sobre verde" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-06.webp", alt: "Avental com o logotipo da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-07.webp", alt: "Mascote da Holly Bakehouse: “Oi, prazer, eu sou a Holly”" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-08.webp", alt: "Cardápio e papelaria da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-09.webp", alt: "Ecobag e camisa polo da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-10.webp", alt: "Camiseta com o selo “Apaixonados por café & cookies”" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-11.webp", alt: "Mascote com um cookie: “Que tal um cookie feito na hora?”" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-12.webp", alt: "Copos de café e ecobag verde da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-13.webp", alt: "Embalagem para viagem e post nas redes da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-14.webp", alt: "Posts de redes sociais da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-15.webp", alt: "Displays de balcão e post com cookies da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-16.webp", alt: "Ilustração do mascote numa xícara: “Nada melhor que cheirinho de café quente”" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-17.webp", alt: "Totem de calçada com o mascote da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-18.webp", alt: "Saco de papel e placa de fachada da Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-19.webp", alt: "Sacola de papel com o logotipo Holly Bakehouse" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-20.webp", alt: "Site da Holly Bakehouse no navegador e copo de café com a marca" }, 1921, 1081),
      full({ src: "/cases/holly-bakehouse/behance-21.webp", alt: "Cartazes de cookies na fachada da Holly Bakehouse" }, 1921, 1081),
    ],
  },
];

export const getCase = (slug: string) => CASES.find((c) => c.slug === slug);
