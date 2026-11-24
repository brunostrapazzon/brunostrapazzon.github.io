import type { Project } from "../types";

const repo = "https://github.com/brunostrapazzon/CITIZEN-ASSIST-AI";

export default {
  slug: "citizen-assist-ai",
  order: 2,
  hue: 160,
  color: "#1DB47C",
  onColor: "#04140D",
  object: "bubble",
  page: true,
  themes: ["ia", "dados"],
  repo,
  pt: {
    title: "Citizen Assist AI",
    context: "Global Solution FIAP · 2026 · equipe de 3",
    summary: "Assistente de serviços públicos que prefere não responder a chutar: 86,7% de acerto e recusa correta em 87,5% das perguntas sem resposta na base.",
    headline: "Um assistente que prefere não responder a chutar",
    intro:
      "Orienta o cidadão sobre serviços públicos usando só fontes oficiais. Feito em equipe de 3 na Global Solution da FIAP, em 2026. Busca com índice invertido e correção de digitação, assuntos relacionados por grafo e trilhas entre temas com Dijkstra, em Python puro e funcionando offline.",
    role: "Participei de todas as partes do projeto. A equipe construiu tudo junto, e cada etapa foi revisada pelos três integrantes.",
    notes: [
      { h: "Medido, não achado", p: "Um script de avaliação roda 30 perguntas de teste e calcula acerto, cobertura, abstenção e tempo de resposta. Os números desta página são dessa execução." },
      { h: "Os testes acharam o erro que importava", p: "A primeira versão respondia “receita de bolo” com a orientação do CPF. A segunda passou a mostrar opções com aviso de baixa confiança, ou a se abster, quando a base não sustenta a resposta. Na avaliação, essa pergunta ainda conta como erro: o assistente mostra opções em vez de recusar." },
      { h: "Duas formas de resposta, comparadas", p: "Um modelo de resposta direto e um com contexto e ressalvas, medidos nas mesmas perguntas: os dois trazem fonte e aviso em 100% dos casos. O com ressalvas virou o padrão." },
    ],
    figures: [
      { value: "86,7%", label: "de acerto em 30 perguntas de teste" },
      { value: "87,5%", label: "das perguntas sem resposta na base, recusadas corretamente" },
      { value: "0", label: "falhas técnicas na avaliação" },
      { value: "< 0,1 ms", label: "tempo médio por consulta" },
    ],
    proofs: [
      { label: "Os indicadores no README", href: `${repo}#20-indicadores-de-desempenho` },
      { label: "O script de avaliação", href: `${repo}/blob/main/src/avaliar.py` },
    ],
    links: [
      { label: "Ver o vídeo", href: "https://youtu.be/QpQYXNN09l8", primary: true },
      { label: "Código no GitHub", href: repo },
    ],
  },
  en: {
    title: "Citizen Assist AI",
    context: "FIAP Global Solution · 2026 · team of 3",
    summary: "A public-services assistant that would rather not answer than guess: 86.7% accuracy, and it correctly declined 87.5% of the questions its base can’t answer.",
    headline: "An assistant that would rather not answer than guess",
    intro:
      "It guides citizens on public services using only official sources. Built by a team of 3 at FIAP’s Global Solution (the end-of-semester challenge), in 2026. Search with an inverted index and typo correction, related topics through a graph and paths between topics with Dijkstra, in pure Python and working offline.",
    role: "I worked on every part of the project. The team built everything together, and all three members reviewed each step.",
    notes: [
      { h: "Measured, not assumed", p: "An evaluation script runs 30 test questions and computes accuracy, coverage, abstention and response time. The numbers on this page come from that run." },
      { h: "The tests found the error that mattered", p: "The first version answered “cake recipe” with the guidance for the CPF (Brazil’s taxpayer ID). The second started showing options with a low-confidence warning, or abstaining, when the knowledge base doesn’t support the answer. The evaluation still counts that question as a miss: the assistant shows options instead of declining." },
      { h: "Two answer styles, compared", p: "A direct answer template and one with context and caveats, measured on the same questions: both give a source and a warning in 100% of cases. The one with caveats became the default." },
    ],
    figures: [
      { value: "86.7%", label: "accuracy on 30 test questions" },
      { value: "87.5%", label: "of questions with no answer in the base, correctly declined" },
      { value: "0", label: "technical failures in the evaluation" },
      { value: "< 0.1 ms", label: "average time per query" },
    ],
    proofs: [
      { label: "The metrics in the README", href: `${repo}#20-indicadores-de-desempenho` },
      { label: "The evaluation script", href: `${repo}/blob/main/src/avaliar.py` },
    ],
    links: [
      { label: "Watch the video", href: "https://youtu.be/QpQYXNN09l8", primary: true },
      { label: "Code on GitHub", href: repo },
    ],
  },
} satisfies Project;
