const SEARCH_ENGINES = [
  { id: "url", name: "URL", url: null },
  { id: "google", name: "Google", url: "https://www.google.com/search?q=" },
  { id: "bing", name: "Bing", url: "https://www.bing.com/search?q=" },
  { id: "baidu", name: "Baidu", url: "https://www.baidu.com/s?wd=" },
  { id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  { id: "yandex", name: "Yandex", url: "https://yandex.com/search/?text=" },
  { id: "youtube", name: "YouTube", url: "https://www.youtube.com/results?search_query=" },
  { id: "pornhub", name: "Pornhub", url: "https://www.pornhub.com/video/search?search=" },
];

const I18N = {
  "en-US": {
    history: "History",
    clear: "Clear",
    language: "Language",
    close: "Close",
    jump: "Jump!",
    placeholder: "Enter URL or search…",
  },
  "zh-CN": {
    history: "历史记录",
    clear: "清除",
    language: "语言",
    close: "关闭",
    jump: "跳转!",
    placeholder: "输入网址或搜索…",
  },
};

const HISTORY_KEY = "urljump_history";
const LANG_KEY = "urljump_lang";
const ENGINE_KEY = "urljump_engine";
const HISTORY_VISIBLE_KEY = "urljump_history_visible";

let currentLang = localStorage.getItem(LANG_KEY) || "en-US";
let currentEngine = localStorage.getItem(ENGINE_KEY) || "url";
let historyVisible = localStorage.getItem(HISTORY_VISIBLE_KEY) !== "false";

function t(key) {
  return I18N[currentLang]?.[key] || I18N["en-US"][key] || key;
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.getElementById("urlInput").placeholder = t("placeholder");
  document.getElementById("jumpBtn").textContent = t("jump");
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addToHistory(url) {
  let history = getHistory();
  history = history.filter((item) => item.url !== url);
  history.unshift({ url, time: new Date().toISOString() });
  if (history.length > 50) history = history.slice(0, 50);
  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const history = getHistory();
  list.innerHTML = "";

  history.forEach((item) => {
    const li = document.createElement("li");
    const urlSpan = document.createElement("span");
    urlSpan.className = "history-url";
    urlSpan.textContent = item.url;

    const timeSpan = document.createElement("span");
    timeSpan.className = "history-time";
    timeSpan.textContent = item.time;

    li.appendChild(urlSpan);
    li.appendChild(timeSpan);
    li.addEventListener("click", () => {
      window.location.href = item.url;
    });
    list.appendChild(li);
  });
}

function renderSearchEngines() {
  const container = document.getElementById("searchEngines");
  container.innerHTML = "";

  SEARCH_ENGINES.forEach((engine) => {
    const btn = document.createElement("button");
    btn.className = "engine-btn" + (engine.id === currentEngine ? " active" : "");
    btn.textContent = engine.name;
    btn.addEventListener("click", () => {
      currentEngine = engine.id;
      localStorage.setItem(ENGINE_KEY, currentEngine);
      renderSearchEngines();
    });
    container.appendChild(btn);
  });
}

function navigate(url) {
  window.location.href = url;
}

function jump() {
  let input = document.getElementById("urlInput").value.trim();
  if (!input) return;

  const engine = SEARCH_ENGINES.find((e) => e.id === currentEngine);

  if (engine && engine.url) {
    const url = engine.url + encodeURIComponent(input);
    addToHistory(url);
    navigate(url);
  } else {
    if (!/^https?:\/\//i.test(input)) {
      input = "https://" + input;
    }
    addToHistory(input);
    navigate(input);
  }
}

function init() {
  applyI18n();
  renderSearchEngines();
  renderHistory();

  if (!historyVisible) {
    document.getElementById("historyArea").classList.add("hidden");
  }

  document.getElementById("jumpBtn").addEventListener("click", jump);

  document.getElementById("urlInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") jump();
  });

  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    saveHistory([]);
    renderHistory();
  });

  document.getElementById("historyToggleBtn").addEventListener("click", () => {
    const area = document.getElementById("historyArea");
    area.classList.toggle("hidden");
    historyVisible = !area.classList.contains("hidden");
    localStorage.setItem(HISTORY_VISIBLE_KEY, historyVisible);
  });

  document.getElementById("langBtn").addEventListener("click", () => {
    document.getElementById("langModal").classList.remove("hidden");
  });

  document.getElementById("closeLangModal").addEventListener("click", () => {
    document.getElementById("langModal").classList.add("hidden");
  });

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      localStorage.setItem(LANG_KEY, currentLang);
      applyI18n();
      document.getElementById("langModal").classList.add("hidden");
    });
  });
}

init();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
