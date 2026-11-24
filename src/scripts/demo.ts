// NetDoctor rules, simplified: the tests run in order and the first one that fails is the cause.
const chain = document.getElementById("chain");
const verdict = document.getElementById("verdict");
if (chain && verdict) {
  const EN = document.documentElement.lang.startsWith("en");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const ORDER = ["link", "dhcp", "router", "isp", "dns", "signal"];
  const TEXT: Record<string, [string, string]> = EN ? {
    ok: ["Your connection is working normally.", "The computer, the router and the provider’s internet all responded well. If one specific site won’t open, the problem may be on that site."],
    wifi: ["Your Wi-Fi is weak in this spot.", "The internet reaches the router, but the signal reaches the computer weak (38%; ideally above 50%). Move closer to the router or use a cable."],
    router: ["The router isn’t responding.", "The computer is connected, but the router doesn’t respond. Unplug the router, wait 30 seconds and plug it back in."],
    isp: ["The router works, but the provider’s internet isn’t arriving.", "There’s no point changing anything on the computer. Call the provider and tell them the router is on and responding."],
    dns: ["The internet arrives, but site names aren’t being translated.", "Sites don’t open by name. Restart the router; if it continues, support can change the name server."],
  } : {
    ok: ["Sua conexão está funcionando normalmente.", "Computador, roteador e internet da operadora responderam bem. Se um site específico não abre, o problema pode ser nele."],
    wifi: ["Seu Wi-Fi está fraco neste lugar.", "A internet chega ao roteador, mas o sinal chega fraco ao computador (38%, o ideal é acima de 50%). Aproxime-se do roteador ou use cabo."],
    router: ["O roteador não está respondendo.", "O computador está conectado, mas o roteador não responde. Tire o roteador da tomada, espere 30 segundos e ligue de novo."],
    isp: ["O roteador funciona, mas a internet da operadora não chega.", "Não adianta mexer no computador. Ligue para a operadora e diga que o roteador está ligado e responde."],
    dns: ["A internet chega, mas os nomes dos sites não são traduzidos.", "Os sites não abrem pelo nome. Reinicie o roteador; se continuar, o suporte pode trocar o servidor de nomes."],
  };
  const SC: Record<string, { stop: string | null; warn: string | null; sev: string; code: string }> = {
    ok: { stop: null, warn: null, sev: "ok", code: "ALL_OK" },
    wifi: { stop: null, warn: "signal", sev: "warn", code: "WIFI_WEAK" },
    router: { stop: "router", warn: null, sev: "bad", code: "GATEWAY_DOWN" },
    isp: { stop: "isp", warn: null, sev: "bad", code: "ISP_DOWN" },
    dns: { stop: "dns", warn: null, sev: "bad", code: "DNS_FAIL" },
  };
  const STATUS: Record<string, string> = EN
    ? { checking: "testing…", ok: "ok", warn: "weak", fail: "failed", skip: "not tested" }
    : { checking: "testando…", ok: "ok", warn: "fraco", fail: "falhou", skip: "não testado" };
  const steps = Object.fromEntries([...chain.children].map((li) => [(li as HTMLElement).dataset.key!, li as HTMLElement]));
  let timers: number[] = [];

  const setStep = (k: string, state: string | null) => {
    const li = steps[k];
    if (state) li.dataset.state = state; else delete li.dataset.state;
    li.querySelector(".status")!.textContent = state ? STATUS[state] : "";
  };
  const sew = (k: string, on: boolean) => { if (on) steps[k].dataset.sewn = ""; else delete steps[k].dataset.sewn; };
  const finalState = (name: string, k: string, i: number) => {
    const sc = SC[name], stopAt = sc.stop ? ORDER.indexOf(sc.stop) : -1;
    if (stopAt >= 0 && i > stopAt) return "skip";
    if (k === sc.stop) return "fail";
    if (k === sc.warn) return "warn";
    return "ok";
  };
  const show = (name: string) => {
    verdict.dataset.sev = SC[name].sev;
    verdict.innerHTML = "";
    const code = document.createElement("p"); code.className = "code"; code.textContent = SC[name].code;
    const h = document.createElement("h3"); h.textContent = TEXT[name][0];
    const p = document.createElement("p"); p.textContent = TEXT[name][1];
    verdict.append(code, h, p);
  };
  const run = (name: string, instant: boolean) => {
    timers.forEach(clearTimeout); timers = [];
    const states = ORDER.map((k, i) => finalState(name, k, i));
    ORDER.forEach((k) => { setStep(k, null); sew(k, false); });
    if (instant || reduce.matches) {
      ORDER.forEach((k, i) => { setStep(k, states[i]); if (i > 0 && states[i - 1] === "ok" && states[i] !== "skip") sew(k, true); });
      show(name);
      return;
    }
    verdict.removeAttribute("data-sev"); verdict.innerHTML = "";
    let t = 0;
    ORDER.forEach((k, i) => {
      if (states[i] === "skip") { timers.push(window.setTimeout(() => setStep(k, "skip"), t)); return; }
      timers.push(window.setTimeout(() => { if (i > 0 && states[i - 1] === "ok") sew(k, true); setStep(k, "checking"); }, t));
      t += 200;
      timers.push(window.setTimeout(() => setStep(k, states[i]), t));
    });
    timers.push(window.setTimeout(() => show(name), t + 60));
  };
  document.querySelectorAll<HTMLInputElement>('input[name="sc"]').forEach((input) => input.addEventListener("change", () => run(input.value, false)));
  run("ok", true);
}
