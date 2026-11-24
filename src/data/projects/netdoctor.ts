import type { Project } from "../types";

const repo = "https://github.com/brunostrapazzon/NetDoctor";

export default {
  slug: "netdoctor",
  order: 1,
  hue: 262,
  color: "#3D63FF",
  onColor: "#FFFFFF",
  object: "router",
  page: true,
  themes: ["redes", "automacao", "ia"],
  repo,
  demo: true,
  pt: {
    title: "NetDoctor",
    context: "Ferramenta para Windows · automação com modelo de linguagem",
    summary: "Diagnóstico de rede no Windows em uns 10 segundos: regras decidem a causa, a IA só explica. 279 testes automatizados.",
    headline: "Regras decidem o diagnóstico, a IA só explica",
    intro:
      "Saiu do meu dia a dia no suporte: a maioria dos chamados de “minha internet não funciona” é Wi-Fi fraco, roteador travado ou DNS, e descobrir isso exigia um técnico. O NetDoctor automatiza essa triagem no Windows em uns 10 segundos e explica a causa em português simples.",
    notes: [
      { h: "A IA não decide nada", p: "O diagnóstico vem de regras determinísticas: o primeiro teste que falha é a causa. O modelo de linguagem (Groq, OpenAI ou Ollama local) só reescreve a explicação. O mesmo problema sempre dá o mesmo resultado. A IA vem desligada por padrão: sem ela, o app funciona offline com o texto pronto." },
      { h: "A resposta da IA é validada", p: "Ela precisa devolver uma frase e de 1 a 3 ações, dentro do limite de tamanho. Se sair do formato, demorar ou falhar, o app usa o texto pronto, sem mostrar erro ao usuário." },
      { h: "Privacidade garantida por teste", p: "O modelo recebe só uma lista fechada de campos: código do problema, gravidade e números. Nome da rede, IPs, MAC e nome do computador nunca saem da máquina, e há testes que quebram se isso mudar." },
      { h: "Automação de ponta a ponta", p: "Lê a saída dos comandos do Windows em português e em inglês, roda os testes em paralelo e é publicado sozinho: o GitHub Actions testa, gera o executável e cria o release." },
    ],
    figures: [
      { value: "279", label: "testes automatizados" },
      { value: "3", label: "provedores de IA, só por configuração" },
      { value: "0", label: "dados da rede enviados à IA" },
    ],
    proofs: [
      { label: "Os testes rodando no GitHub Actions", href: `${repo}/actions/workflows/ci.yml` },
      { label: "O teste que garante a privacidade", href: `${repo}/blob/main/tests/test_llm.py#L136` },
      { label: "Os 3 provedores no código", href: `${repo}/blob/main/netdoctor/explain/llm.py` },
    ],
    links: [
      { label: "Baixar para Windows", href: `${repo}/releases/latest`, primary: true },
      { label: "Código no GitHub", href: repo },
    ],
    shots: [
      { name: "netdoctor-cliente", w: 800, h: 656, title: "Relatório do cliente", file: "relatorio.html", text: "A causa em uma frase, o número que a sustenta e o que fazer, em português simples.", alt: "Relatório do NetDoctor: Wi-Fi fraco, força do sinal de 30%, três ações recomendadas e a tabela de achados com o código WIFI_WEAK" },
      { name: "netdoctor-laudo", w: 800, h: 876, title: "Laudo técnico para o suporte", file: "laudo.html", text: "Canal congestionado, perda que começa na operadora e aparelhos na rede, cada achado com recomendação e código.", alt: "Laudo técnico do NetDoctor: canal 6 congestionado, utilização de 70%, perda a partir da rede da operadora e aparelhos na rede, cada um com recomendação e código" },
    ],
    shotsNote: "Prints gerados com os dados de teste do projeto, não de uma rede real.",
  },
  en: {
    title: "NetDoctor",
    context: "Windows tool · automation with a language model",
    summary: "Network diagnosis on Windows in about 10 seconds: rules decide the cause, AI only explains it. 279 automated tests.",
    headline: "Rules make the diagnosis, AI only explains it",
    intro:
      "It came from my day-to-day in support: most “my internet isn’t working” tickets are weak Wi-Fi, a frozen router or DNS, and finding that out took a technician. NetDoctor automates this triage on Windows in about 10 seconds and explains the cause in plain Portuguese.",
    notes: [
      { h: "The AI decides nothing", p: "The diagnosis comes from deterministic rules: the first test that fails is the cause. The language model (Groq, OpenAI or local Ollama) only rewrites the explanation. The same problem always gives the same result. The AI is off by default: without it, the app works offline with the built-in text." },
      { h: "The AI’s answer is validated", p: "It must return one sentence and 1 to 3 actions, within the length limit. If it breaks the format, takes too long or fails, the app uses the built-in text, without showing the user an error." },
      { h: "Privacy enforced by tests", p: "The model receives only a closed list of fields: problem code, severity and numbers. Network name, IPs, MAC and computer name never leave the machine, and there are tests that break if that changes." },
      { h: "End-to-end automation", p: "It reads Windows command output in Portuguese and in English, runs the tests in parallel and publishes itself: GitHub Actions tests it, builds the executable and creates the release." },
    ],
    figures: [
      { value: "279", label: "automated tests" },
      { value: "3", label: "AI providers, by configuration only" },
      { value: "0", label: "network data sent to the AI" },
    ],
    proofs: [
      { label: "The tests running on GitHub Actions", href: `${repo}/actions/workflows/ci.yml` },
      { label: "The test that enforces privacy", href: `${repo}/blob/main/tests/test_llm.py#L136` },
      { label: "The 3 providers in the code", href: `${repo}/blob/main/netdoctor/explain/llm.py` },
    ],
    links: [
      { label: "Download for Windows", href: `${repo}/releases/latest`, primary: true },
      { label: "Code on GitHub", href: repo },
    ],
    shots: [
      { name: "netdoctor-cliente", w: 800, h: 656, title: "Client report", file: "relatorio.html", text: "The cause in one sentence, the number behind it and what to do, in plain Portuguese.", alt: "NetDoctor report: weak Wi-Fi, 30% signal strength, three recommended actions and the findings table with the WIFI_WEAK code" },
      { name: "netdoctor-laudo", w: 800, h: 876, title: "Technical report for support", file: "laudo.html", text: "Congested channel, loss that starts at the provider and devices on the network, each finding with a recommendation and a code.", alt: "NetDoctor technical report: channel 6 congested, 70% utilization, loss starting at the provider’s network and devices on the network, each with a recommendation and a code" },
    ],
    shotsNote: "Screenshots made with the project’s test data, not from a real network.",
  },
} satisfies Project;
