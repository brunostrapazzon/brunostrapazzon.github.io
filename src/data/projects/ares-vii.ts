import type { Project } from "../types";

const repo = "https://github.com/brunostrapazzon/Global-Solution---1-Semestre-";

export default {
  slug: "ares-vii",
  order: 4,
  hue: 40,
  color: "#FF6B3D",
  onColor: "#2B0B00",
  object: "planet",
  page: false,
  themes: ["dados", "algoritmos"],
  repo,
  pt: {
    title: "Monitoramento ARES-VII",
    context: "FIAP · 2026 · equipe de 3",
    summary: "Lê a telemetria de uma missão simulada em Marte, prioriza alertas com fila e pilha e prevê a reserva de energia com uma regressão linear feita à mão, em Python puro.",
    headline: "",
    intro: "",
    notes: [],
    links: [{ label: "Repositório", href: repo }],
  },
  en: {
    title: "ARES-VII Monitoring",
    context: "FIAP · 2026 · team of 3",
    summary: "Reads telemetry from a simulated Mars mission, prioritizes alerts with a queue and a stack, and forecasts the energy reserve with a hand-written linear regression, in pure Python.",
    headline: "",
    intro: "",
    notes: [],
    links: [{ label: "Repository", href: repo }],
  },
} satisfies Project;
