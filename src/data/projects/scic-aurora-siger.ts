import type { Project } from "../types";

const repo = "https://github.com/brunostrapazzon/scic-aurora-siger";

export default {
  slug: "scic-aurora-siger",
  order: 5,
  hue: 2,
  color: "#FF5A8F",
  onColor: "#2B0013",
  object: "tree",
  page: false,
  themes: ["algoritmos", "dados"],
  repo,
  pt: {
    title: "SCIC Aurora Siger",
    context: "FIAP · protótipo acadêmico",
    summary: "Análise de latência, previsão, priorização de alertas com heap e busca por prefixo com trie.",
    headline: "",
    intro: "",
    notes: [],
    links: [{ label: "Repositório", href: repo }],
  },
  en: {
    title: "SCIC Aurora Siger",
    context: "FIAP · academic prototype",
    summary: "Latency analysis, forecasting, alert prioritization with a heap and prefix search with a trie.",
    headline: "",
    intro: "",
    notes: [],
    links: [{ label: "Repository", href: repo }],
  },
} satisfies Project;
