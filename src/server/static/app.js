/**
 * AI RAMU Control UI Interactive Script
 * Bolo Ramu, Kaam Shuru.
 */

let currentLanguage = "en";

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initLanguageSwitcher();
  initChat();
  initSettings();
  loadStatus();
  loadTasks();
  loadRecipes();
  loadConnectors();
  loadMemory();

  // Poll tasks every 4 seconds
  setInterval(loadTasks, 4000);
});

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view-container");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((i) => i.classList.remove("active"));
      views.forEach((v) => v.classList.remove("active"));

      item.classList.add("active");
      const tab = item.getAttribute("data-tab");
      const activeView = document.getElementById(`view-${tab}`);
      if (activeView) {
        activeView.classList.add("active");
      }

      if (tab === "tasks") loadTasks();
      if (tab === "automations") loadRecipes();
      if (tab === "connectors") loadConnectors();
      if (tab === "memory") loadMemory();
    });
  });
}

function initLanguageSwitcher() {
  const langBtns = document.querySelectorAll(".lang-btn");
  langBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      langBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentLanguage = btn.getAttribute("data-lang");

      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: currentLanguage }),
      });

      loadStatus();
    });
  });
}

async function loadStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    if (data.i18n) {
      document.getElementById("top-title-text").textContent = data.i18n.tagline;
      document.getElementById("label-nav-chat").textContent = data.i18n.tabChat;
      document.getElementById("label-nav-tasks").textContent = data.i18n.tabTasks;
      document.getElementById("label-nav-automations").textContent = data.i18n.tabAutomations;
      document.getElementById("label-nav-connectors").textContent = data.i18n.tabConnectors;
      document.getElementById("label-nav-memory").textContent = data.i18n.tabMemory;
      document.getElementById("label-nav-settings").textContent = data.i18n.tabSettings;
      document.getElementById("chat-input").placeholder = data.i18n.inputPlaceholder;
    }
  } catch (err) {
    console.error("Failed to fetch status:", err);
  }
}

function initChat() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Append user message
    appendBubble("user", text);
    input.value = "";

    // Append temporary thinking bubble
    const thinkingBubble = appendBubble("assistant", "⏳ <em>Ramu is thinking...</em>");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: currentLanguage }),
      });
      const data = await res.json();
      thinkingBubble.innerHTML = `<p><strong>🇮🇳 AI RAMU:</strong></p><p style="margin-top:6px; white-space:pre-wrap;">${escapeHtml(
        data.reply
      )}</p>`;
    } catch (err) {
      thinkingBubble.innerHTML = `<p style="color:var(--danger)">⚠️ Error contacting AI Ramu Gateway: ${err.message}</p>`;
    }

    messages.scrollTop = messages.scrollHeight;
  });
}

function appendBubble(role, htmlContent) {
  const messages = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = `chat-bubble ${role}`;
  div.innerHTML = htmlContent;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

async function loadTasks() {
  const container = document.getElementById("tasks-list");
  if (!container) return;

  try {
    const res = await fetch("/api/tasks");
    const data = await res.json();

    if (!data.tasks || data.tasks.length === 0) {
      container.innerHTML = `<div class="card" style="grid-column: 1 / -1;"><p style="color:var(--text-muted)">No tasks have run yet. Bolo Ramu to begin!</p></div>`;
      return;
    }

    container.innerHTML = data.tasks
      .map(
        (t) => `
      <div class="card">
        <div class="card-title">
          <span>${escapeHtml(t.name)}</span>
          <span class="badge" style="${
            t.status === "completed"
              ? "color:#10B981; background:rgba(16,185,129,0.15);"
              : t.status === "failed"
              ? "color:#EF4444; background:rgba(239,68,68,0.15);"
              : ""
          }">${t.status.toUpperCase()}</span>
        </div>
        <div class="card-desc">${escapeHtml(t.description)}</div>
        <pre>${escapeHtml(t.logs.join("\n"))}</pre>
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load tasks", err);
  }
}

async function loadRecipes() {
  const container = document.getElementById("recipes-list");
  if (!container) return;

  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();

    container.innerHTML = data.recipes
      .map(
        (r) => `
      <div class="card">
        <div class="card-title">
          <span>${escapeHtml(r.name)}</span>
          <span class="badge">${r.category}</span>
        </div>
        <div class="card-desc">${escapeHtml(r.description)}</div>
        <button class="btn-primary" onclick="runWorkflow('${r.id}')" style="width:100%;">
          Run Automation ➔
        </button>
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load recipes", err);
  }
}

async function runWorkflow(recipeId) {
  try {
    const res = await fetch("/api/recipes/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId, params: {} }),
    });
    const data = await res.json();
    alert(`Automation started! Task ID: ${data.task.id}`);
    document.querySelector('[data-tab="tasks"]').click();
  } catch (err) {
    alert("Failed to start workflow: " + err.message);
  }
}

async function loadConnectors() {
  const container = document.getElementById("connectors-list");
  if (!container) return;

  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    const conns = data.connectors;

    const cards = [
      {
        title: "Local Filesystem Sandbox",
        status: "ACTIVE",
        desc: `Secured to workspace: ${data.workspaceRoot}`,
      },
      {
        title: "Browser Automation",
        status: "ACTIVE",
        desc: "Deterministic web page inspection and data extraction.",
      },
      {
        title: "WhatsApp Gateway",
        status: conns.whatsapp.status.toUpperCase(),
        desc: "Interact with Ramu directly via WhatsApp mobile messaging.",
      },
      {
        title: "Telegram Gateway",
        status: conns.telegram.status.toUpperCase(),
        desc: "Automated alert dispatch and command execution over Telegram.",
      },
      {
        title: "Google Workspace (Gmail / Calendar)",
        status: conns.google.status.toUpperCase(),
        desc: "OAuth 2.0 authorization for email triage and schedule updates.",
      },
    ];

    container.innerHTML = cards
      .map(
        (c) => `
      <div class="card">
        <div class="card-title">
          <span>${escapeHtml(c.title)}</span>
          <span class="badge">${c.status}</span>
        </div>
        <div class="card-desc">${escapeHtml(c.desc)}</div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load connectors", err);
  }
}

async function loadMemory() {
  const container = document.getElementById("memory-facts-list");
  if (!container) return;

  try {
    const res = await fetch("/api/memory");
    const data = await res.json();

    if (!data.facts || data.facts.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">No permanent facts stored.</p>`;
    } else {
      container.innerHTML = `<ul style="padding-left:20px; font-size:13.5px; color:var(--text-main);">${data.facts
        .map((f) => `<li>${escapeHtml(f)}</li>`)
        .join("")}</ul>`;
    }
  } catch (err) {
    console.error("Failed to load memory", err);
  }
}

function initSettings() {
  const saveBtn = document.getElementById("btn-save-settings");
  const clearMemBtn = document.getElementById("btn-clear-memory");

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const provider = document.getElementById("setting-provider").value;
      const apiKey = document.getElementById("setting-apikey").value.trim();

      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: apiKey || undefined }),
      });

      alert("Settings saved successfully!");
    });
  }

  if (clearMemBtn) {
    clearMemBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to wipe AI Ramu's memory clean?")) {
        await fetch("/api/memory/clear", { method: "POST" });
        loadMemory();
        alert("Memory wiped clean.");
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
