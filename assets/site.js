(() => {
  const LANGS = [
    "zh-Hans",
    "zh-Hant",
    "en",
    "ja",
    "ko",
    "es",
    "fr",
    "de",
    "pt-BR",
    "it",
    "ru",
    "ar",
    "hi"
  ];

  const LABELS = {
    en: "English",
    "zh-Hans": "简体中文",
    "zh-Hant": "繁體中文",
    ja: "日本語",
    ko: "한국어",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    "pt-BR": "Português (Brasil)",
    it: "Italiano",
    ru: "Русский",
    ar: "العربية",
    hi: "हिन्दी"
  };

  const OG_LOCALE = {
    en: "en_US",
    "zh-Hans": "zh_CN",
    "zh-Hant": "zh_TW",
    ja: "ja_JP",
    ko: "ko_KR",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
    "pt-BR": "pt_BR",
    it: "it_IT",
    ru: "ru_RU",
    ar: "ar_SA",
    hi: "hi_IN"
  };

  const FULL_EXTRA = new Set(["en", "zh-Hans", "zh-Hant", "ja"]);
  const STORAGE_KEY = "catrun.lang";
  const FALLBACK_ORIGIN = "https://weizhichao1027-collab.github.io/catrun-official";
  const FALLBACK_STORE = "https://apps.apple.com/app/id6793595842";
  const root = document.documentElement;
  const assetRoot = root.dataset.assetRoot || ".";
  const page = root.dataset.page || "official";

  const PAGE_PATH = {
    official: "/",
    support: "/support",
    privacy: "/privacy"
  };

  const state = {
    locale: "zh-Hans",
    marketing: null,
    extra: null,
    facts: null
  };

  function resolve(input) {
    if (LANGS.includes(input)) return input;
    const lower = String(input || "").toLowerCase();
    if (lower.startsWith("zh-hant") || lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-mo")) {
      return "zh-Hant";
    }
    if (lower.startsWith("zh")) return "zh-Hans";
    if (lower.startsWith("pt")) return "pt-BR";
    const base = lower.split("-")[0];
    return LANGS.find((code) => code.toLowerCase() === base) || "en";
  }

  function requestedLocale() {
    const params = new URLSearchParams(location.search);
    if (params.get("lang")) return resolve(params.get("lang"));
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return resolve(stored);
    } catch {
      /* private mode */
    }
    const languages = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    for (const language of languages) {
      const match = resolve(language);
      if (match) return match;
    }
    return "zh-Hans";
  }

  function persistLocale(locale) {
    const url = new URL(location.href);
    url.searchParams.set("lang", locale);
    history.replaceState({}, "", url);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }

  function deepGet(object, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), object);
  }

  function extraFor(locale) {
    return state.extra?.[locale];
  }

  function textFor(path) {
    const localeExtra = extraFor(state.locale);
    const home = state.marketing?.locales?.[state.locale]?.home;
    const support = state.marketing?.locales?.[state.locale]?.support;
    const privacy = state.marketing?.locales?.[state.locale]?.privacy;
    const store = state.marketing?.locales?.[state.locale]?.store;
    const fallbackExtra = extraFor("en");
    const bags = [localeExtra, { home, support, privacy, store }, fallbackExtra];
    for (const bag of bags) {
      const value = deepGet(bag, path);
      if (typeof value === "string" && value.trim()) return value;
    }
    return "";
  }

  function coverageKind(locale) {
    if (locale === "zh-Hant") return "hant";
    if (locale === "ja") return "ja";
    if (FULL_EXTRA.has(locale)) return "full";
    return "partial";
  }

  function setMeta(selector, attr, value) {
    const node = document.querySelector(selector);
    if (node && value) node.setAttribute(attr, value);
  }

  function origin() {
    return state.facts?.urls?.origin || FALLBACK_ORIGIN;
  }

  function storeUrl() {
    return state.facts?.urls?.appStore || state.marketing?.urls?.appStore || FALLBACK_STORE;
  }

  function pageUrl(kind = page, locale) {
    const path = PAGE_PATH[kind] || "/";
    const url = new URL(path, `${origin()}/`);
    if (locale) url.searchParams.set("lang", locale);
    return url.toString().replace(/\/\?/, "/?");
  }

  function applyShare() {
    const title = textFor(`meta.${page}Title`);
    const description = textFor(`meta.${page}Description`);
    const canonical = pageUrl(page);
    if (title) document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[property="og:locale"]', "content", OG_LOCALE[state.locale] || "en_US");
    const canonicalNode = document.querySelector('link[rel="canonical"]');
    if (canonicalNode) canonicalNode.setAttribute("href", canonical);
  }

  function bindStoreLinks() {
    const href = storeUrl();
    document.querySelectorAll("[data-store-href]").forEach((node) => {
      node.setAttribute("href", href);
      node.setAttribute("rel", "noopener noreferrer");
    });
  }

  function injectHreflang() {
    document.querySelectorAll('link[rel="alternate"][hreflang], link[data-hreflang]').forEach((node) => node.remove());
    const head = document.head;
    LANGS.forEach((code) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = code;
      link.href = pageUrl(page, code);
      link.dataset.hreflang = "true";
      head.append(link);
    });
    const def = document.createElement("link");
    def.rel = "alternate";
    def.hreflang = "x-default";
    def.href = pageUrl(page);
    def.dataset.hreflang = "true";
    head.append(def);
  }

  function upsertJsonLd(id, data) {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement("script");
      node.type = "application/ld+json";
      node.id = id;
      document.head.append(node);
    }
    node.textContent = JSON.stringify(data);
  }

  function organizationNode() {
    const facts = state.facts || {};
    return {
      "@type": "Organization",
      name: facts.seller || "Shanghai Qishan Cultural Communication Co., Ltd.",
      url: facts.urls?.developer || "https://apps.apple.com/developer/id1891134548",
      email: facts.contactEmail || "281916057@qq.com",
      sameAs: [storeUrl(), facts.urls?.developer].filter(Boolean)
    };
  }

  function personNode() {
    return {
      "@type": "Person",
      name: state.facts?.designer || "Zhichao Wei",
      email: state.facts?.contactEmail || "281916057@qq.com"
    };
  }

  function softwareNode() {
    const facts = state.facts || {};
    const names = facts.alternateNames || ["CatRun", "CatRun: Neon Market Rush", "CatRun：晨市冲刺"];
    return {
      "@type": "MobileApplication",
      name: facts.nameEn || "CatRun: Neon Market Rush",
      alternateName: names,
      applicationCategory: "GameApplication",
      applicationSubCategory: "Casual",
      operatingSystem: `iOS ${facts.minOs || "17.0"}`,
      softwareVersion: facts.version || "1.0.1",
      identifier: facts.appleId || "6793595842",
      downloadUrl: storeUrl(),
      installUrl: storeUrl(),
      url: pageUrl("official"),
      image: `${origin()}/assets/og.png`,
      description: textFor("meta.officialDescription"),
      inLanguage: LANGS,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock"
      },
      contentRating: facts.ageRating || "4+",
      author: personNode(),
      creator: personNode(),
      publisher: organizationNode(),
      featureList: [
        "Three-lane morning-market runner",
        "12 unlockable cats",
        "Fish and Bells earned by running",
        "No ads",
        "No In-App Purchases",
        "No account"
      ],
      sameAs: [storeUrl()]
    };
  }

  function breadcrumbNode() {
    const crumbs = [
      { name: textFor("navOfficial") || "CatRun", url: pageUrl("official") }
    ];
    if (page === "support") crumbs.push({ name: textFor("navSupport") || "Support", url: pageUrl("support") });
    if (page === "privacy") crumbs.push({ name: textFor("navPrivacy") || "Privacy", url: pageUrl("privacy") });
    return {
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };
  }

  function faqNode() {
    const tickets = [...document.querySelectorAll("[data-ticket]")];
    if (!tickets.length) return null;
    return {
      "@type": "FAQPage",
      mainEntity: tickets.slice(0, 20).map((ticket) => ({
        "@type": "Question",
        name: ticket.querySelector("h2")?.textContent?.trim() || "",
        acceptedAnswer: {
          "@type": "Answer",
          text: ticket.querySelector("p")?.textContent?.trim() || ""
        }
      })).filter((item) => item.name && item.acceptedAnswer.text)
    };
  }

  function injectJsonLd() {
    const graph = [
      {
        "@type": "WebSite",
        name: "CatRun",
        url: origin() + "/",
        inLanguage: LANGS,
        publisher: organizationNode()
      },
      softwareNode(),
      breadcrumbNode()
    ];
    if (page === "support") {
      const faq = faqNode();
      if (faq) graph.push(faq);
    }
    if (page === "privacy") {
      graph.push({
        "@type": "WebPage",
        name: textFor("meta.privacyTitle"),
        url: pageUrl("privacy"),
        datePublished: state.facts?.privacyEffective || "2026-07-22",
        dateModified: state.facts?.privacyReviewed || "2026-09-19",
        about: softwareNode(),
        publisher: organizationNode()
      });
    }
    upsertJsonLd("catrun-jsonld", {
      "@context": "https://schema.org",
      "@graph": graph
    });
  }

  function applyText() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = textFor(node.dataset.i18n);
      if (value) node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const value = textFor(node.dataset.i18nHtml);
      if (value) node.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      const value = textFor(node.dataset.i18nPlaceholder);
      if (value) node.setAttribute("placeholder", value);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      const value = textFor(node.dataset.i18nAria);
      if (value) node.setAttribute("aria-label", value);
    });
    applyShare();
  }

  function hideLocalePanel(node, active) {
    node.hidden = !active;
    node.toggleAttribute("inert", !active);
    node.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) {
      node.removeAttribute("hidden");
    } else {
      node.setAttribute("hidden", "");
    }
  }

  function applyLocalePanels() {
    const preferred = state.locale === "zh-Hans" || state.locale === "zh-Hant" ? "zh-Hans" : "en";
    document.querySelectorAll("[data-locale]").forEach((node) => {
      hideLocalePanel(node, node.dataset.locale === preferred);
    });
  }

  function applyCoverageNote() {
    const note = document.querySelector("[data-lang-note]");
    if (!note) return;
    const kind = coverageKind(state.locale);
    const key = {
      full: "",
      hant: "lang.coverageHant",
      ja: "lang.coverageJa",
      partial: "lang.coveragePartial"
    }[kind];
    if (!key) {
      note.hidden = true;
      note.textContent = "";
      return;
    }
    const value = textFor(key);
    note.hidden = !value;
    note.textContent = value;
  }

  function applyDocument() {
    root.lang = state.locale;
    root.dir = state.locale === "ar" ? "rtl" : "ltr";
    applyText();
    applyLocalePanels();
    applyCoverageNote();
    bindStoreLinks();
    injectHreflang();
    injectJsonLd();
    document.dispatchEvent(new Event("catrun:locale"));
  }

  function optionLabel(code) {
    const kind = coverageKind(code);
    const mark = textFor("lang.partialMark") || "EN long-form";
    if (kind === "partial") return `${LABELS[code]} · ${mark}`;
    return LABELS[code];
  }

  function fillLanguageSelect(select) {
    if (!select) return;
    select.innerHTML = "";

    const groups = [
      { key: "lang.groupFull", codes: ["zh-Hans", "zh-Hant", "en", "ja"] },
      { key: "lang.groupPartial", codes: ["ko", "es", "fr", "de", "pt-BR", "it", "ru", "ar", "hi"] }
    ];

    groups.forEach((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = textFor(group.key) || group.key;
      group.codes.forEach((code) => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = optionLabel(code);
        optgroup.append(option);
      });
      select.append(optgroup);
    });

    select.value = state.locale;
    if (!select.dataset.bound) {
      select.dataset.bound = "true";
      select.addEventListener("change", () => {
        state.locale = resolve(select.value);
        persistLocale(state.locale);
        fillLanguageSelect(select);
        applyDocument();
      });
    }
  }

  function bindSearch() {
    const input = document.querySelector("[data-faq-search]");
    const topics = document.querySelector("[data-faq-topics]");
    const tickets = [...document.querySelectorAll("[data-ticket]")];
    const empty = document.querySelector("[data-faq-empty]");
    const count = document.querySelector("[data-faq-count]");
    if (!tickets.length) return;

    let topic = "all";

    const run = () => {
      const query = (input?.value || "").trim().toLowerCase();
      let visible = 0;
      tickets.forEach((ticket) => {
        const hay = `${ticket.textContent} ${ticket.dataset.search || ""}`.toLowerCase();
        const topicOk = topic === "all" || ticket.dataset.topic === topic;
        const queryOk = !query || hay.includes(query);
        const show = topicOk && queryOk;
        ticket.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.hidden = visible !== 0;
      if (count) {
        const template = textFor("support.searchCount") || "{n}";
        count.textContent = template.replace("{n}", String(visible));
      }
      if (input) {
        const url = new URL(location.href);
        if (query) url.searchParams.set("q", input.value.trim());
        else url.searchParams.delete("q");
        history.replaceState({}, "", url);
      }
    };

    if (input) {
      const initial = new URLSearchParams(location.search).get("q");
      if (initial) input.value = initial;
      input.addEventListener("input", run);
    }

    if (topics) {
      topics.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-topic]");
        if (!button) return;
        topic = button.dataset.topic;
        topics.querySelectorAll("button[data-topic]").forEach((node) => {
          node.setAttribute("aria-pressed", node === button ? "true" : "false");
        });
        run();
      });
    }

    run();
    document.addEventListener("catrun:locale", run);
  }

  function reveal() {
    const nodes = [...document.querySelectorAll("[data-reveal]")];
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((node) => observer.observe(node));
  }

  function yearStamp() {
    document.querySelectorAll("[data-year]").forEach((node) => {
      node.textContent = "2026";
    });
  }

  async function loadJSON(path) {
    const response = await fetch(path, { credentials: "same-origin" });
    if (!response.ok) throw new Error(path);
    return response.json();
  }

  async function boot() {
    state.locale = requestedLocale();
    persistLocale(state.locale);
    fillLanguageSelect(document.querySelector("[data-lang-select]"));
    yearStamp();
    reveal();
    bindSearch();
    try {
      const [marketing, extra, facts] = await Promise.all([
        loadJSON(`${assetRoot}/assets/marketing.json`),
        loadJSON(`${assetRoot}/assets/site-copy.json`),
        loadJSON(`${assetRoot}/assets/site-facts.json`).catch(() => null)
      ]);
      state.marketing = marketing;
      state.extra = extra;
      state.facts = facts;
      fillLanguageSelect(document.querySelector("[data-lang-select]"));
      applyDocument();
    } catch {
      bindStoreLinks();
      applyLocalePanels();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
