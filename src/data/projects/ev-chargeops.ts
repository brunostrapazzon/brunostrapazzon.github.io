import type { Project } from "../types";

export default {
  slug: "ev-chargeops",
  order: 3,
  hue: 88,
  color: "#FFC62E",
  onColor: "#231A00",
  object: "bolt",
  page: true,
  themes: ["dados", "automacao", "ia"],
  pt: {
    title: "EV ChargeOps",
    context: "Enterprise Challenge GoodWe + FIAP · 2026 · equipe de 3",
    summary: "Mede, valida e divide a conta de recarga de carros elétricos em condomínios; barrou as 12 sessões com problema sem bloquear nenhuma normal.",
    headline: "A conta de recarga dividida só depois de conferida",
    intro:
      "Mede, valida e divide a conta de recarga de carros elétricos em condomínios. Feito em equipe de 3 no Enterprise Challenge da GoodWe com a FIAP, em 2026.",
    role: "Participei de todas as partes do projeto. A equipe construiu tudo junto, e cada etapa foi revisada pelos três integrantes.",
    notes: [
      { h: "Lê o carregador", p: "A medição vem direto do carregador, via Modbus." },
      { h: "Sabe de quem é cada recarga", p: "Cada sessão é associada à unidade do condomínio por RFID." },
      { h: "Barra o que parece errado antes da cobrança", p: "Um modelo de detecção de anomalias (Isolation Forest) separa as medições suspeitas antes de a conta ser dividida." },
    ],
    figures: [
      { value: "12", label: "sessões com problema barradas nos testes com dados simulados" },
      { value: "0", label: "sessões normais bloqueadas" },
    ],
    links: [],
  },
  en: {
    title: "EV ChargeOps",
    context: "Enterprise Challenge GoodWe + FIAP · 2026 · team of 3",
    summary: "Measures, validates and splits the electric car charging bill in apartment buildings; blocked all 12 problem sessions without blocking any normal one.",
    headline: "The charging bill is split only after it’s checked",
    intro:
      "Measures, validates and splits the electric car charging bill in apartment buildings. Built by a team of 3 at the GoodWe Enterprise Challenge with FIAP, in 2026.",
    role: "I worked on every part of the project. The team built everything together, and all three members reviewed each step.",
    notes: [
      { h: "Reads the charger", p: "The reading comes straight from the charger, over Modbus." },
      { h: "Knows whose charge it is", p: "Each session is linked to the resident’s unit by RFID." },
      { h: "Blocks what looks wrong before billing", p: "An anomaly detection model (Isolation Forest) sets suspicious readings aside before the bill is split." },
    ],
    figures: [
      { value: "12", label: "problem sessions blocked in tests with simulated data" },
      { value: "0", label: "normal sessions blocked" },
    ],
    links: [],
  },
} satisfies Project;
