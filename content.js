// Store collected conversations
let collectedConversations = new Map();
let isDeleting = false;
let currentTheme = localStorage.getItem("chatgpt-cleaner-theme") || "system";

// Icons
const ICONS = {
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  sun: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
  moon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  system: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
};

// Create floating button
function createFloatingButton() {
  const existingButton = document.getElementById("chat-cleaner-btn");
  if (existingButton) return;

  const button = document.createElement("div");
  button.id = "chat-cleaner-btn";
  button.innerHTML = `
    ${ICONS.trash}
    <span id="chat-count">0</span>
  `;

  button.addEventListener("click", openModal);
  document.body.appendChild(button);
}

// Create modal
function createModal() {
  const existingModal = document.getElementById("chat-cleaner-modal");
  if (existingModal) return;

  const modal = document.createElement("div");
  modal.id = "chat-cleaner-modal";
  modal.innerHTML = `
    <div class="modal-overlay" id="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Delete Conversations</h2>
        <div class="header-actions">
          <button id="theme-toggle-btn" title="Toggle Theme (System -> Light -> Dark)">
            ${getThemeIcon()}
          </button>
          <button id="close-modal" title="Close">✕</button>
        </div>
      </div>
      <div class="modal-actions">
        <button id="select-all-btn">Select All</button>
        <span id="selected-count">0 selected</span>
      </div>
      <div class="conversation-list" id="conversation-list">
        <!-- Conversations will be inserted here -->
      </div>
      <div class="modal-footer">
        <button id="cancel-btn">Cancel</button>
        <button id="delete-btn" class="delete-btn" disabled>Delete Selected</button>
      </div>
      <div id="progress-container" class="progress-container" style="display: none;">
        <div class="progress-bar">
          <div id="progress-fill" class="progress-fill"></div>
        </div>
        <div id="progress-text">Deleting 0 of 0...</div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Create Custom Confirm Modal
  const confirmModal = document.createElement("div");
  confirmModal.id = "custom-confirm-modal";
  confirmModal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="confirm-content">
      <div class="confirm-title">Are you sure?</div>
      <div id="confirm-message" class="confirm-message"></div>
      <div class="confirm-buttons">
        <button id="confirm-no">Cancel</button>
        <button id="confirm-yes">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmModal);

  // Apply initial theme
  applyTheme();

  // Event listeners
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document
    .getElementById("modal-overlay")
    .addEventListener("click", closeModal);
  document.getElementById("cancel-btn").addEventListener("click", closeModal);
  document
    .getElementById("select-all-btn")
    .addEventListener("click", toggleSelectAll);
  document
    .getElementById("delete-btn")
    .addEventListener("click", startDeletion);
  document
    .getElementById("theme-toggle-btn")
    .addEventListener("click", toggleTheme);
}

function getThemeIcon() {
  switch (currentTheme) {
    case "light":
      return ICONS.sun;
    case "dark":
      return ICONS.moon;
    default:
      return ICONS.system;
  }
}

function toggleTheme() {
  if (currentTheme === "system") {
    currentTheme = "light";
  } else if (currentTheme === "light") {
    currentTheme = "dark";
  } else {
    currentTheme = "system";
  }

  localStorage.setItem("chatgpt-cleaner-theme", currentTheme);
  applyTheme();

  // Update button icon
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.innerHTML = getThemeIcon();
  }
}

function applyTheme() {
  const modal = document.getElementById("chat-cleaner-modal");
  const confirmModal = document.getElementById("custom-confirm-modal");
  if (!modal) return;

  // Remove existing classes
  modal.classList.remove("light-theme", "dark-theme");
  if (confirmModal) confirmModal.classList.remove("light-theme", "dark-theme");

  // Add new class if forced
  if (currentTheme === "light") {
    modal.classList.add("light-theme");
    if (confirmModal) confirmModal.classList.add("light-theme");
  } else if (currentTheme === "dark") {
    modal.classList.add("dark-theme");
    if (confirmModal) confirmModal.classList.add("dark-theme");
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `custom-alert ${type}`;
  toast.innerHTML = `
    ${type === "success" ? ICONS.check : "✕"}
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function customConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("custom-confirm-modal");
    const msgEl = document.getElementById("confirm-message");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    msgEl.textContent = message;
    modal.style.display = "block";

    const handleYes = () => {
      cleanup();
      resolve(true);
    };

    const handleNo = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      modal.style.display = "none";
      yesBtn.removeEventListener("click", handleYes);
      noBtn.removeEventListener("click", handleNo);
    };

    yesBtn.addEventListener("click", handleYes);
    noBtn.addEventListener("click", handleNo);
  });
}

function openModal() {
  createModal();
  renderConversationList();
  document.getElementById("chat-cleaner-modal").style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("chat-cleaner-modal");
  if (modal && !isDeleting) {
    modal.style.display = "none";
  }
}

function renderConversationList() {
  const listContainer = document.getElementById("conversation-list");
  const conversations = Array.from(collectedConversations.values());

  if (conversations.length === 0) {
    listContainer.innerHTML =
      '<div class="empty-state">No conversations collected yet. Scroll through your chat history to collect them.</div>';
    return;
  }

  listContainer.innerHTML = conversations
    .map(
      (conv) => `
    <label class="conversation-item" for="conv-${conv.id}">
      <input type="checkbox" id="conv-${conv.id}" value="${conv.id}" class="conv-checkbox">
      <span class="conv-name">${conv.name}</span>
    </label>
  `,
    )
    .join("");

  // Add change listeners to checkboxes
  document.querySelectorAll(".conv-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", updateSelectedCount);
  });
}

function updateSelectedCount() {
  const checkboxes = document.querySelectorAll(".conv-checkbox");
  const selectedCount = Array.from(checkboxes).filter(
    (cb) => cb.checked,
  ).length;

  document.getElementById("selected-count").textContent =
    `${selectedCount} selected`;
  document.getElementById("delete-btn").disabled = selectedCount === 0;
}

function toggleSelectAll() {
  const checkboxes = document.querySelectorAll(".conv-checkbox");
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

  checkboxes.forEach((cb) => (cb.checked = !allChecked));
  updateSelectedCount();
}

async function startDeletion() {
  const selectedIds = Array.from(
    document.querySelectorAll(".conv-checkbox:checked"),
  ).map((cb) => cb.value);

  if (selectedIds.length === 0) return;

  const confirmed = await customConfirm(
    `Are you sure you want to delete ${selectedIds.length} conversation(s)?`,
  );
  if (!confirmed) return;

  isDeleting = true;
  document.getElementById("delete-btn").disabled = true;
  document.getElementById("cancel-btn").disabled = true;
  document.getElementById("progress-container").style.display = "block";

  let deleted = 0;
  const total = selectedIds.length;

  for (const id of selectedIds) {
    try {
      await deleteConversation(id);
      deleted++;

      // Update progress
      const progress = (deleted / total) * 100;
      document.getElementById("progress-fill").style.width = `${progress}%`;
      document.getElementById("progress-text").textContent =
        `Deleting ${deleted} of ${total}...`;

      // Remove from UI and collection
      collectedConversations.delete(id);
      const checkbox = document.getElementById(`conv-${id}`);
      if (checkbox) {
        checkbox.closest(".conversation-item").remove();
      }

      // Random delay between 500ms and 2000ms
      const delay = Math.random() * 1500 + 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Failed to delete ${id}:`, error);
    }
  }

  // Update count badge
  updateCountBadge();

  // Reset UI
  isDeleting = false;
  document.getElementById("progress-container").style.display = "none";
  document.getElementById("delete-btn").disabled = true;
  document.getElementById("cancel-btn").disabled = false;

  showToast(`Successfully deleted ${deleted} of ${total} conversations!`);

  if (collectedConversations.size === 0) {
    closeModal();
  } else {
    renderConversationList();
  }
}

async function deleteConversation(conversationId) {
  const accessToken = await fetch("https://chatgpt.com/api/auth/session")
    .then((r) => r.json())
    .then((data) => data.accessToken);

  const sentinelResponse = await fetch(
    "https://chatgpt.com/backend-api/sentinel/chat-requirements",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const sentinelData = await sentinelResponse.json();

  const response = await fetch(
    `https://chatgpt.com/backend-api/conversation/${conversationId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "openai-sentinel-chat-requirements-token": sentinelData.token,
      },
      body: JSON.stringify({
        is_visible: false,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete: ${response.status}`);
  }

  return await response.json();
}

// Monitor sidebar for conversations
function collectConversations() {
  const conversationLinks = document.querySelectorAll('a[href^="/c/"]');

  conversationLinks.forEach((link) => {
    const id = link.getAttribute("href").replace("/c/", "");

    // Try multiple possible selectors as ChatGPT's DOM changes often
    const nameElement =
      link.querySelector("div.relative.grow") ||
      link.querySelector('div[class*="relative grow"]') ||
      link.querySelector('span[dir="auto"]') ||
      link.querySelector("div.line-clamp-1") ||
      link.querySelector(".overflow-hidden");

    let name = "Untitled";
    if (nameElement) {
      name = nameElement.textContent.trim();
    } else {
      // Fallback: use link text but remove common icon text characters
      name = link.textContent
        .replace(
          /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g,
          "",
        )
        .trim();
    }

    // Final check to avoid empty names
    if (!name || name === "..." || name.length > 100) name = "Untitled";

    if (!collectedConversations.has(id)) {
      collectedConversations.set(id, { id, name });
      updateCountBadge();
    } else if (
      name !== "Untitled" &&
      collectedConversations.get(id).name === "Untitled"
    ) {
      // Update name if we previously had Untitled but now found a better one
      collectedConversations.set(id, { id, name });
    }
  });
}

function updateCountBadge() {
  const badge = document.getElementById("chat-count");
  if (badge) {
    badge.textContent = collectedConversations.size;
  }
}

// Observe sidebar for new conversations
const observer = new MutationObserver(() => {
  collectConversations();
});

// Wait for page to load
function init() {
  const sidebar = document.querySelector("nav");
  if (sidebar) {
    observer.observe(sidebar, {
      childList: true,
      subtree: true,
    });

    // Initial collection
    collectConversations();
    createFloatingButton();
  } else {
    // Retry if sidebar not found yet
    setTimeout(init, 1000);
  }
}

// Start when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
