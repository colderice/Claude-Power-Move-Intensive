// Shared JS utilities for admin pages

const API_BASE = '/api';

function getToken() { return localStorage.getItem('ds_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('ds_user')); } catch { return null; } }
function setAuth(token, user) { localStorage.setItem('ds_token', token); localStorage.setItem('ds_user', JSON.stringify(user)); }
function clearAuth() { localStorage.removeItem('ds_token'); localStorage.removeItem('ds_user'); }

function requireAuth() {
  if (!getToken()) { window.location.href = '/login'; return false; }
  return true;
}

function logout() {
  clearAuth();
  window.location.href = '/login';
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function statusBadge(status) {
  const labels = { sent: 'Awaiting Client', client_signed: 'Needs Countersign', completed: 'Completed', voided: 'Voided', draft: 'Draft' };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showAlert(msg, type = 'error', container = document.body) {
  const el = document.createElement('div');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  const first = container.firstChild;
  container.insertBefore(el, first);
  setTimeout(() => el.remove(), 5000);
}

function initSidebar() {
  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('sidebar-name');
    const emailEl = document.getElementById('sidebar-email');
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
  }
  // Mark active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// Reusable confirm modal
function confirmModal({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h2>${title}</h2>
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="mc-cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="mc-confirm">${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#mc-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#mc-confirm').onclick = () => { overlay.remove(); resolve(true); };
  });
}
