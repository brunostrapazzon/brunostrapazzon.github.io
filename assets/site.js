(() => {
  const root = document.documentElement;
  const EN = (root.lang || "").toLowerCase().startsWith("en");

  // Tema: troca sem disparar transições.
  const toggle = document.getElementById("theme-toggle");
  const meta = document.querySelector('meta[name="theme-color"]');
  function syncToggle() {
    const dark = root.getAttribute("data-theme") !== "light";
    const label = EN
      ? (dark ? "Switch to light theme" : "Switch to dark theme")
      : (dark ? "Mudar para o tema claro" : "Mudar para o tema escuro");
    toggle.setAttribute("aria-label", label);
    meta.setAttribute("content", dark ? "#0d1119" : "#1f3358");
  }
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.classList.add("no-transitions");
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    syncToggle();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("no-transitions")));
  });
  syncToggle();

  // Índice na lombada: marca a seção atual (troca de estado, sem animação).
  const links = new Map(
    [...document.querySelectorAll(".index a")].map((a) => [a.getAttribute("href").slice(1), a])
  );
  if ("IntersectionObserver" in window && links.size) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null, bestRatio = 0;
      seen.forEach((r, id) => { if (r > bestRatio) { best = id; bestRatio = r; } });
      if (!best) return;
      links.forEach((a, id) => {
        if (id === best) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.01, 0.5, 1] });
    links.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
})();

(() => {
  // Demonstração: a linha passa por cada teste e para no primeiro que falha.
  const chain = document.getElementById("chain");
  if (!chain) return;
  const EN = (document.documentElement.lang || "").toLowerCase().startsWith("en");

  const ORDER = ["link", "dhcp", "router", "isp", "dns", "signal"];
  const TEXT = EN ? {
    ok:     ["Your connection is working normally.", "The computer, the router and the ISP's internet all responded well. If one specific site won't open, the problem may be on that site."],
    wifi:   ["Your Wi-Fi is weak in this spot.", "The internet reaches the router, but the signal reaches the computer weak (38%; ideally above 50%). Move closer to the router or use a cable."],
    router: ["The router isn't responding.", "The computer is connected, but the router doesn't respond. Unplug the router, wait 30 seconds and plug it back in."],
    isp:    ["The router works, but the ISP's internet isn't arriving.", "There's no point changing anything on the computer. Call the provider and tell them the router is on and responding."],
    dns:    ["The internet arrives, but site names aren't being translated.", "Sites don't open by name. Restart the router; if it continues, support can change the name server."],
  } : {
    ok:     ["Sua conexão está funcionando normalmente.", "Computador, roteador e internet da operadora responderam bem. Se um site específico não abre, o problema pode ser nele."],
    wifi:   ["Seu Wi-Fi está fraco neste lugar.", "A internet chega ao roteador, mas o sinal chega fraco ao computador (38%, o ideal é acima de 50%). Aproxime-se do roteador ou use cabo."],
    router: ["O roteador não está respondendo.", "O computador está conectado, mas o roteador não responde. Tire o roteador da tomada, espere 30 segundos e ligue de novo."],
    isp:    ["O roteador funciona, mas a internet da operadora não chega.", "Não adianta mexer no computador. Ligue para a operadora e diga que o roteador está ligado e responde."],
    dns:    ["A internet chega, mas os nomes dos sites não são traduzidos.", "Os sites não abrem pelo nome. Reinicie o roteador; se continuar, o suporte pode trocar o servidor de nomes."],
  };
  const SCENARIOS = {
    ok:     { stop: null,     warn: null,     sev: "ok",   code: "ALL_OK" },
    wifi:   { stop: null,     warn: "signal", sev: "warn", code: "WIFI_WEAK" },
    router: { stop: "router", warn: null,     sev: "bad",  code: "GATEWAY_DOWN" },
    isp:    { stop: "isp",    warn: null,     sev: "bad",  code: "ISP_DOWN" },
    dns:    { stop: "dns",    warn: null,     sev: "bad",  code: "DNS_FAIL" },
  };
  const STATUS = EN
    ? { checking: "testing…", ok: "ok", warn: "weak", fail: "failed", skip: "not tested" }
    : { checking: "testando…", ok: "ok", warn: "fraco", fail: "falhou", skip: "não testado" };

  // Cada estação é desenhada por traço, não só por cor:
  // furo vazio, anel (testando), nó cheio (ok), anel tracejado (fraco), laço aberto (falhou).
  const STATION =
    '<svg viewBox="0 0 28 28" aria-hidden="true" focusable="false">' +
    '<circle class="s s-empty" cx="14" cy="14" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<g class="s s-ring"><circle cx="14" cy="14" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="14" r="2" fill="currentColor"/></g>' +
    '<circle class="s s-knot" cx="14" cy="14" r="6" fill="currentColor"/>' +
    '<g class="s s-dash"><circle cx="14" cy="14" r="6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/><circle cx="14" cy="14" r="2" fill="currentColor"/></g>' +
    '<path class="s s-broken" d="M19 9.2A6.5 6.5 0 1 0 20.3 16.2l4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  const steps = Object.fromEntries([...chain.children].map((li) => {
    const st = document.createElement("span");
    st.className = "station";
    st.innerHTML = STATION;
    const seg = document.createElement("span");
    seg.className = "seg";
    seg.setAttribute("aria-hidden", "true");
    li.prepend(st);
    li.append(seg);
    return [li.dataset.key, li];
  }));
  const verdict = document.getElementById("verdict");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timers = [];

  function setStep(key, state) {
    const li = steps[key];
    if (state) li.dataset.state = state; else delete li.dataset.state;
    li.querySelector(".status").textContent = state ? STATUS[state] : "";
  }
  function sew(key, on, nextState) {
    const li = steps[key];
    if (on) li.dataset.sewn = ""; else delete li.dataset.sewn;
    if (nextState === "warn") li.dataset.next = "warn"; else delete li.dataset.next;
  }
  function finalState(sc, key, i) {
    const stopAt = sc.stop ? ORDER.indexOf(sc.stop) : -1;
    if (stopAt >= 0 && i > stopAt) return "skip";
    if (key === sc.stop) return "fail";
    if (key === sc.warn) return "warn";
    return "ok";
  }
  function showVerdict(name) {
    const sc = SCENARIOS[name];
    verdict.dataset.sev = sc.sev;
    verdict.innerHTML = "";
    const code = document.createElement("p");
    code.className = "code";
    code.textContent = sc.code;
    const h = document.createElement("h4");
    h.textContent = TEXT[name][0];
    const p = document.createElement("p");
    p.textContent = TEXT[name][1];
    verdict.append(code, h, p);
    verdict.classList.remove("fresh");
    void verdict.offsetWidth;
    verdict.classList.add("fresh");
  }

  function run(name, instant) {
    timers.forEach(clearTimeout);
    timers = [];
    const sc = SCENARIOS[name];
    const states = ORDER.map((k, i) => finalState(sc, k, i));
    ORDER.forEach((k) => { setStep(k, null); sew(k, false); });
    verdict.removeAttribute("data-sev");
    verdict.innerHTML = "";

    if (instant || reduce.matches) {
      ORDER.forEach((k, i) => {
        setStep(k, states[i]);
        const next = states[i + 1];
        sew(k, states[i] === "ok" && next && next !== "skip", next);
      });
      showVerdict(name);
      return;
    }
    const STEP_MS = 180;
    let t = 0;
    ORDER.forEach((k, i) => {
      const state = states[i];
      if (state === "skip") { timers.push(setTimeout(() => setStep(k, "skip"), t)); return; }
      timers.push(setTimeout(() => {
        if (i > 0 && states[i - 1] === "ok") sew(ORDER[i - 1], true, state);
        setStep(k, "checking");
      }, t));
      t += STEP_MS;
      timers.push(setTimeout(() => setStep(k, state), t));
    });
    timers.push(setTimeout(() => { showVerdict(name); timers = []; }, t + 40));
  }

  document.querySelectorAll('input[name="sc"]').forEach((input) => {
    input.addEventListener("change", () => run(input.value, false));
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && timers.length) run(document.querySelector('input[name="sc"]:checked').value, true);
  });
  run("ok", true);
})();
