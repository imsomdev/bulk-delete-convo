// Store collected conversations
let collectedConversations = new Map();
let isDeleting = false;

// Create floating button
function createFloatingButton() {
  const existingButton = document.getElementById('chat-cleaner-btn');
  if (existingButton) return;

  const button = document.createElement('div');
  button.id = 'chat-cleaner-btn';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
    <span id="chat-count">0</span>
  `;
  
  button.addEventListener('click', openModal);
  document.body.appendChild(button);
}

// Create modal
function createModal() {
  const existingModal = document.getElementById('chat-cleaner-modal');
  if (existingModal) return;

  const modal = document.createElement('div');
  modal.id = 'chat-cleaner-modal';
  modal.innerHTML = `
    <div class="modal-overlay" id="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Delete Conversations</h2>
        <button id="close-modal">✕</button>
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

  // Event listeners
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  document.getElementById('select-all-btn').addEventListener('click', toggleSelectAll);
  document.getElementById('delete-btn').addEventListener('click', startDeletion);
}

function openModal() {
  createModal();
  renderConversationList();
  document.getElementById('chat-cleaner-modal').style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('chat-cleaner-modal');
  if (modal && !isDeleting) {
    modal.style.display = 'none';
  }
}

function renderConversationList() {
  const listContainer = document.getElementById('conversation-list');
  const conversations = Array.from(collectedConversations.values());

  if (conversations.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No conversations collected yet. Scroll through your chat history to collect them.</div>';
    return;
  }

  listContainer.innerHTML = conversations.map(conv => `
    <div class="conversation-item">
      <input type="checkbox" id="conv-${conv.id}" value="${conv.id}" class="conv-checkbox">
      <label for="conv-${conv.id}">${conv.name}</label>
    </div>
  `).join('');

  // Add change listeners to checkboxes
  document.querySelectorAll('.conv-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedCount);
  });
}

function updateSelectedCount() {
  const checkboxes = document.querySelectorAll('.conv-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  document.getElementById('selected-count').textContent = `${selectedCount} selected`;
  document.getElementById('delete-btn').disabled = selectedCount === 0;
}

function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('.conv-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  
  checkboxes.forEach(cb => cb.checked = !allChecked);
  updateSelectedCount();
}

async function startDeletion() {
  const selectedIds = Array.from(document.querySelectorAll('.conv-checkbox:checked'))
    .map(cb => cb.value);

  if (selectedIds.length === 0) return;

  const confirmed = confirm(`Are you sure you want to delete ${selectedIds.length} conversation(s)?`);
  if (!confirmed) return;

  isDeleting = true;
  document.getElementById('delete-btn').disabled = true;
  document.getElementById('cancel-btn').disabled = true;
  document.getElementById('progress-container').style.display = 'block';

  let deleted = 0;
  const total = selectedIds.length;

  for (const id of selectedIds) {
    try {
      await deleteConversation(id);
      deleted++;
      
      // Update progress
      const progress = (deleted / total) * 100;
      document.getElementById('progress-fill').style.width = `${progress}%`;
      document.getElementById('progress-text').textContent = `Deleting ${deleted} of ${total}...`;
      
      // Remove from UI and collection
      collectedConversations.delete(id);
      const checkbox = document.getElementById(`conv-${id}`);
      if (checkbox) {
        checkbox.closest('.conversation-item').remove();
      }

      // Random delay between 500ms and 2000ms
      const delay = Math.random() * 1500 + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(`Failed to delete ${id}:`, error);
    }
  }

  // Update count badge
  updateCountBadge();

  // Reset UI
  isDeleting = false;
  document.getElementById('progress-container').style.display = 'none';
  document.getElementById('delete-btn').disabled = true;
  document.getElementById('cancel-btn').disabled = false;
  
  alert(`Successfully deleted ${deleted} of ${total} conversations!`);
  
  if (collectedConversations.size === 0) {
    closeModal();
  } else {
    renderConversationList();
  }
}

async function deleteConversation(conversationId) {
  const accessToken = await fetch("https://chatgpt.com/api/auth/session")
    .then(r => r.json())
    .then(data => data.accessToken);
  
  const sentinelResponse = await fetch("https://chatgpt.com/backend-api/sentinel/chat-requirements", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    }
  });
  
  const sentinelData = await sentinelResponse.json();
  
  const response = await fetch(`https://chatgpt.com/backend-api/conversation/${conversationId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "openai-sentinel-chat-requirements-token": sentinelData.token
    },
    body: JSON.stringify({
      is_visible: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete: ${response.status}`);
  }
  
  return await response.json();
}

// Monitor sidebar for conversations
function collectConversations() {
  const conversationLinks = document.querySelectorAll('a[href^="/c/"]');
  
  conversationLinks.forEach(link => {
    const id = link.getAttribute('href').replace('/c/', '');
    const nameElement = link.querySelector('span[dir="auto"]');
    const name = nameElement ? nameElement.textContent : 'Untitled';
    
    if (!collectedConversations.has(id)) {
      collectedConversations.set(id, { id, name });
      updateCountBadge();
    }
  });
}

function updateCountBadge() {
  const badge = document.getElementById('chat-count');
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
  const sidebar = document.querySelector('nav');
  if (sidebar) {
    observer.observe(sidebar, {
      childList: true,
      subtree: true
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}