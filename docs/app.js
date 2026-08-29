const SEARCH_ENGINES = [
  { id: "url", name: null, url: null },
  { id: "google", name: { "en-US": "Google", "zh-CN": "谷歌" }, url: "https://www.google.com/search?q=" },
  { id: "bing", name: { "en-US": "Bing", "zh-CN": "必应" }, url: "https://www.bing.com/search?q=" },
  { id: "baidu", name: { "en-US": "Baidu", "zh-CN": "百度" }, url: "https://www.baidu.com/s?wd=" },
  { id: "duckduckgo", name: { "en-US": "DuckDuckGo", "zh-CN": "DuckDuckGo" }, url: "https://duckduckgo.com/?q=" },
  { id: "yandex", name: { "en-US": "Yandex", "zh-CN": "Yandex" }, url: "https://yandex.com/search/?text=" },
  { id: "youtube", name: { "en-US": "YouTube", "zh-CN": "油管" }, url: "https://www.youtube.com/results?search_query=" },
  { id: "pornhub", name: { "en-US": "Pornhub", "zh-CN": "Pornhub" }, url: "https://www.pornhub.com/video/search?search=" },
];

const I18N = {
  strings: {
    history: { "en-US": "History", "zh-CN": "历史记录" },
    clear: { "en-US": "Clear", "zh-CN": "清除" },
    language: { "en-US": "Language", "zh-CN": "语言" },
    close: { "en-US": "Close", "zh-CN": "关闭" },
    jump: { "en-US": "Jump!", "zh-CN": "跳转!" },
    placeholderUrl: { "en-US": "Enter URL…", "zh-CN": "输入网址…" },
    placeholderSearch: { "en-US": "Search…", "zh-CN": "搜索…" },
    rename: { "en-US": "Rename", "zh-CN": "重命名" },
    delete: { "en-US": "Delete", "zh-CN": "删除" },
    pin: { "en-US": "Pin", "zh-CN": "固定" },
    unpin: { "en-US": "Unpin", "zh-CN": "取消固定" },
    property: { "en-US": "Property", "zh-CN": "属性" },
    name: { "en-US": "Name", "zh-CN": "名称" },
    url: { "en-US": "URL", "zh-CN": "网址" },
    time: { "en-US": "Time", "zh-CN": "时间" },
    pinned: { "en-US": "Pinned", "zh-CN": "已固定" },
    renamePrompt: { "en-US": "Enter a name for this URL:", "zh-CN": "为此网址输入名称:" },
    searchIn: { "en-US": "URL", "zh-CN": "网址" },
    clearConfirm: { "en-US": "Clear all unpinned history?", "zh-CN": "确定要清除所有未固定的历史记录吗？" },
    noHistory: { "en-US": "No history yet", "zh-CN": "暂无历史记录" },
  },
  languages: ["en-US", "zh-CN"],
};

const HISTORY_KEY = "urljump_history";
const LANG_KEY = "urljump_lang";
const ENGINE_KEY = "urljump_engine";
const HISTORY_VISIBLE_KEY = "urljump_history_visible";

let currentLang = localStorage.getItem(LANG_KEY) || "en-US";
let currentEngine = localStorage.getItem(ENGINE_KEY) || "url";
let historyVisible = localStorage.getItem(HISTORY_VISIBLE_KEY) !== "false";

function t(key) {
  const entry = I18N.strings[key];
  if (!entry) return key;
  return entry[currentLang] || entry["en-US"] || key;
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  const engine = SEARCH_ENGINES.find((e) => e.id === currentEngine);
  document.getElementById("urlInput").placeholder = engine && engine.url ? t("placeholderSearch") : t("placeholderUrl");
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
  history.unshift({ url, time: new Date().toISOString(), name: null, pinned: false });
  if (history.length > 50) {
    const pinned = history.filter((i) => i.pinned);
    const unpinned = history.filter((i) => !i.pinned).slice(0, 50 - pinned.length);
    history = [...pinned, ...unpinned];
  }
  saveHistory(history);
  renderHistory();
}

function deleteHistoryItem(url) {
  let history = getHistory();
  history = history.filter((item) => item.url !== url);
  saveHistory(history);
  renderHistory();
}

function clearHistory() {
  let history = getHistory();
  history = history.filter((item) => item.pinned);
  saveHistory(history);
  renderHistory();
}

function renameHistoryItem(url, name) {
  let history = getHistory();
  const item = history.find((i) => i.url === url);
  if (item) {
    item.name = name || null;
    saveHistory(history);
    renderHistory();
  }
}

function togglePinHistoryItem(url) {
  let history = getHistory();
  const item = history.find((i) => i.url === url);
  if (item) {
    item.pinned = !item.pinned;
    saveHistory(history);
    renderHistory();
  }
}

function showContextMenu(item, event) {
  closeContextMenu();

  const menu = document.createElement("div");
  menu.id = "contextMenu";
  menu.className = "context-menu";

  const items = [
    { label: t("rename"), action: () => {
      const name = prompt(t("renamePrompt"), item.name || item.url);
      if (name !== null) renameHistoryItem(item.url, name);
    }},
    { label: item.pinned ? t("unpin") : t("pin"), action: () => togglePinHistoryItem(item.url) },
    { label: t("delete"), action: () => deleteHistoryItem(item.url) },
    { label: t("property"), action: () => showPropertyModal(item) },
    { label: t("close"), action: () => closeContextMenu() },
  ];

  items.forEach(({ label, action }) => {
    const btn = document.createElement("button");
    btn.className = "context-menu-item";
    btn.textContent = label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      action();
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  const rect = event.target.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.left = `${Math.min(rect.left, window.innerWidth - 160)}px`;

  setTimeout(() => {
    document.addEventListener("click", closeContextMenu, { once: true });
  }, 0);
}

function closeContextMenu() {
  const existing = document.getElementById("contextMenu");
  if (existing) existing.remove();
}

function showPropertyModal(item) {
  closeContextMenu();
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span>${t("property")}</span>
      <div class="property-row"><strong>${t("name")}:</strong> <span>${item.name || "-"}</span></div>
      <div class="property-row"><strong>${t("url")}:</strong> <span class="prop-url">${item.url}</span></div>
      <div class="property-row"><strong>${t("time")}:</strong> <span>${item.time}</span></div>
      <div class="property-row"><strong>${t("pinned")}:</strong> <span>${item.pinned ? "✓" : "✗"}</span></div>
      <button id="closePropModal">${t("close")}</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#closePropModal").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const history = getHistory();
  list.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.className = "history-empty";
    li.textContent = t("noHistory");
    list.appendChild(li);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");

    const leftDiv = document.createElement("div");
    leftDiv.className = "history-left";

    const nameSpan = document.createElement("span");
    nameSpan.className = "history-name";
    nameSpan.textContent = item.name || item.url;
    nameSpan.title = item.url;

    if (item.name) {
      const urlSpan = document.createElement("span");
      urlSpan.className = "history-url-under";
      urlSpan.textContent = item.url;
      leftDiv.appendChild(nameSpan);
      leftDiv.appendChild(urlSpan);
    } else {
      leftDiv.appendChild(nameSpan);
    }

    const rightDiv = document.createElement("div");
    rightDiv.className = "history-right";

    if (item.pinned) {
      const pinSpan = document.createElement("span");
      pinSpan.className = "history-pin";
      pinSpan.textContent = "📌";
      rightDiv.appendChild(pinSpan);
    }

    const timeSpan = document.createElement("span");
    timeSpan.className = "history-time";
    timeSpan.textContent = item.time;
    rightDiv.appendChild(timeSpan);

    const moreBtn = document.createElement("button");
    moreBtn.className = "more-btn";
    moreBtn.textContent = "…";
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showContextMenu(item, e);
    });
    rightDiv.appendChild(moreBtn);

    li.appendChild(leftDiv);
    li.appendChild(rightDiv);

    li.addEventListener("click", (e) => {
      if (e.target.closest(".more-btn")) return;
      window.location.href = item.url;
    });

    list.appendChild(li);
  });
}

function renderLangOptions() {
  const container = document.getElementById("langOptions");
  container.innerHTML = "";
  const langNames = { "en-US": "English", "zh-CN": "中文" };
  I18N.languages.forEach((lang) => {
    const btn = document.createElement("button");
    btn.textContent = langNames[lang] || lang;
    btn.dataset.lang = lang;
    if (lang === currentLang) btn.style.opacity = "0.5";
    btn.addEventListener("click", () => {
      currentLang = lang;
      localStorage.setItem(LANG_KEY, currentLang);
      applyI18n();
      renderLangOptions();
    });
    container.appendChild(btn);
  });
}
function renderSearchEngines() {
  const container = document.getElementById("searchEngines");
  container.innerHTML = "";

  SEARCH_ENGINES.forEach((engine) => {
    const btn = document.createElement("button");
    btn.className = "engine-btn" + (engine.id === currentEngine ? " active" : "");
    if (engine.name) {
      btn.textContent = engine.name[currentLang] || engine.name["en-US"] || engine.id;
    } else {
      btn.textContent = t("searchIn");
    }
    btn.addEventListener("click", () => {
      currentEngine = engine.id;
      localStorage.setItem(ENGINE_KEY, currentEngine);
      renderSearchEngines();
      applyI18n();
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

  const area = document.getElementById("historyArea");
  if (!historyVisible) {
    area.classList.add("hidden");
  } else {
    area.classList.remove("hidden");
  }

  document.getElementById("jumpBtn").addEventListener("click", jump);

  document.getElementById("urlInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") jump();
  });

  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    if (confirm(t("clearConfirm"))) clearHistory();
  });

  document.getElementById("historyToggleBtn").addEventListener("click", () => {
    const area = document.getElementById("historyArea");
    area.classList.toggle("hidden");
    historyVisible = !area.classList.contains("hidden");
    localStorage.setItem(HISTORY_VISIBLE_KEY, historyVisible);
  });

  document.getElementById("langBtn").addEventListener("click", () => {
    renderLangOptions();
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
