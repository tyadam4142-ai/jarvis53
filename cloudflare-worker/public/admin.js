(function () {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const loginScreen = $('#login-screen');
  const shell = $('#app-shell');
  const loginForm = $('#login-form');
  const loginError = $('#login-error');
  const notice = $('#global-notice');
  const toast = $('#toast');
  let toastTimer = null;
  let currentView = 'overview';
  let customersCache = [];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function toastMsg(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function showNotice(msg, isError = false) {
    notice.hidden = false;
    notice.classList.toggle('error', !!isError);
    notice.textContent = msg;
  }
  function clearNotice() { notice.hidden = true; notice.textContent = ''; notice.classList.remove('error'); }

  async function api(path, options = {}) {
    const response = await fetch(path, Object.assign({ cache: 'no-store', credentials: 'same-origin' }, options));
    const contentType = response.headers.get('content-type') || '';
    let data = {};
    if (contentType.includes('application/json')) data = await response.json().catch(() => ({}));
    else if (!response.ok) data = { error: (await response.text().catch(() => '')).slice(0, 240) };
    if (!response.ok) {
      const error = new Error(data.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function setSignedIn(isSignedIn) {
    loginScreen.hidden = !!isSignedIn;
    shell.hidden = !isSignedIn;
    if (!isSignedIn) $('#admin-password').value = '';
  }
  async function checkSession() {
    try { await api('/api/admin/session'); setSignedIn(true); await refreshAll(); }
    catch (_) { setSignedIn(false); }
  }
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); loginError.textContent = '';
    const button = $('button[type="submit"]', loginForm);
    button.disabled = true; button.textContent = 'Checking…';
    try {
      await api('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: $('#admin-password').value }) });
      setSignedIn(true); await refreshAll(); toastMsg('Signed in securely.');
    } catch (error) { loginError.textContent = error.message || 'Sign-in failed.'; }
    finally { button.disabled = false; button.innerHTML = 'Unlock control panel <span>→</span>'; }
  });
  $('#logout-btn').addEventListener('click', async () => {
    try { await api('/api/admin/logout', { method: 'POST' }); } catch (_) {}
    setSignedIn(false); toastMsg('Signed out.');
  });
  $('#refresh-btn').addEventListener('click', () => refreshAll(true));

  function navigate(view) {
    currentView = view;
    $$('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    $$('.view').forEach(panel => { panel.hidden = panel.dataset.panel !== view; });
    const titles = { overview: 'Overview', customers: 'Customers & activation', settings: 'Payment settings', keys: 'AI provider keys', announcements: 'Announcements', audit: 'Audit log' };
    $('#page-title').textContent = titles[view] || 'Overview';
    clearNotice();
    if (view === 'customers') loadCustomers();
    if (view === 'settings') loadSettings();
    if (view === 'keys') loadKeys();
    if (view === 'announcements') loadAnnouncements();
    if (view === 'audit') loadAudit('#audit-table');
  }
  $('#side-nav').addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (button) navigate(button.dataset.view);
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-go]');
    if (button) navigate(button.dataset.go);
  });
  $('#customer-filter').addEventListener('change', loadCustomers);

  async function refreshAll(withToast = false) {
    clearNotice();
    try { await loadOverview(); if (currentView === 'customers') await loadCustomers(); if (withToast) toastMsg('Data refreshed.'); }
    catch (error) { showNotice(error.message || 'Unable to refresh the dashboard.', true); if (error.status === 401) setSignedIn(false); }
  }
  async function loadOverview() {
    const data = await api('/api/admin/stats');
    const s = data.stats || {};
    $('#stats-grid').innerHTML = [
      ['Total customers', s.total ?? 0], ['Pending review', s.pending ?? 0], ['Active subscriptions', s.active ?? 0], ['Requests today', s.requestsToday ?? 0]
    ].map(([label, value]) => `<article class="stat"><span>${esc(label)}</span><b>${Number(value) || 0}</b></article>`).join('');
    const pending = Number(s.pending || 0);
    const pill = $('#pending-pill'); pill.textContent = String(pending); pill.hidden = !pending;
    await loadAudit('#overview-audit', 6);
  }
  function fmtDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
  function statusPill(status) { return `<span class="status ${esc(String(status).toLowerCase())}">${esc(status || 'unknown')}</span>`; }
  async function loadAudit(target, limit = 100) {
    const data = await api('/api/admin/audit');
    const rows = (data.audit || []).slice(0, limit);
    const node = $(target);
    if (!rows.length) { node.innerHTML = '<p class="empty">No recorded activity yet.</p>'; return; }
    node.innerHTML = `<table class="data-table"><thead><tr><th>When</th><th>Action</th><th>Target</th><th>Details</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(fmtDate(r.createdAt))}</td><td>${esc(r.action)}</td><td>${esc(r.target || '—')}</td><td>${esc(r.details || '—')}</td></tr>`).join('')}</tbody></table>`;
  }
  async function loadCustomers() {
    const node = $('#customers-table'); node.innerHTML = '<p class="empty">Loading customers…</p>';
    try {
      const filter = $('#customer-filter').value;
      const data = await api('/api/admin/customers' + (filter !== 'all' ? '?status=' + encodeURIComponent(filter) : ''));
      customersCache = data.customers || [];
      if (!customersCache.length) { node.innerHTML = '<p class="empty">No customers in this view. Requests made on the public website or desktop app will appear here.</p>'; return; }
      node.innerHTML = `<table class="data-table"><thead><tr><th>Customer</th><th>Subscription</th><th>Payment</th><th>Expires</th><th>Actions</th></tr></thead><tbody>${customersCache.map(c => {
        const cycle = c.billingCycle === 'annual' ? 'Annual' : 'Monthly';
        const payment = c.paymentRef ? `<span class="phone">${esc(c.paymentRef)}</span><span class="subline">${esc(c.paymentStatus || 'pending')}</span>` : '<span class="muted">No reference</span>';
        const actions = [];
        if (c.status === 'pending') { actions.push(`<button class="mini-btn approve" data-customer-action="approve" data-id="${c.id}">Approve</button>`, `<button class="mini-btn danger" data-customer-action="decline" data-id="${c.id}">Decline</button>`); }
        if (c.status === 'active') actions.push(`<button class="mini-btn danger" data-customer-action="suspend" data-id="${c.id}">Suspend</button>`);
        if (c.status !== 'active' && c.status !== 'pending' && c.subscriptionEndsAt && Date.parse(c.subscriptionEndsAt) > Date.now()) actions.push(`<button class="mini-btn approve" data-customer-action="reactivate" data-id="${c.id}">Reactivate</button>`);
        actions.push(`<button class="mini-btn" data-customer-action="reset-activation" data-id="${c.id}">Reset token</button>`);
        actions.push(`<button class="mini-btn danger" data-customer-action="delete" data-id="${c.id}">Delete</button>`);
        return `<tr><td><span class="phone">${esc(c.name || 'J53 customer')}</span><span class="subline">${esc(c.phone)}</span><span class="subline">Requested ${esc(fmtDate(c.createdAt))}</span></td><td>${statusPill(c.status)}<span class="subline">${esc(cycle)} · ${esc(c.plan || 'all-access')}</span></td><td>${payment}</td><td>${esc(fmtDate(c.subscriptionEndsAt))}</td><td><div class="actions">${actions.join('')}</div></td></tr>`;
      }).join('')}</tbody></table>`;
    } catch (error) { node.innerHTML = `<p class="empty">${esc(error.message)}</p>`; if (error.status === 401) setSignedIn(false); }
  }
  $('#customers-table').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-customer-action]');
    if (!button) return;
    const action = button.dataset.customerAction; const id = Number(button.dataset.id);
    const customer = customersCache.find(c => Number(c.id) === id);
    if (!customer) return;
    if (action === 'approve' && (!customer.paymentRef || String(customer.paymentRef).trim().length < 4)) { showNotice('Cannot approve: this customer has no valid payment reference.', true); return; }
    const confirmations = {
      approve: `Have you verified the payment for ${customer.phone} in your bank or payment app?\n\nOnly approve if the received amount and transaction reference match.`,
      decline: `Decline the payment request for ${customer.phone}?`,
      suspend: `Suspend access for ${customer.phone}?`,
      reactivate: `Reactivate ${customer.phone}? The existing subscription expiry must still be in the future.`,
      'reset-activation': `Generate a fresh activation token for ${customer.phone}? Their current token will stop working.`,
      delete: `Permanently delete ${customer.phone} and its subscription record? This cannot be undone.`
    };
    if (!window.confirm(confirmations[action] || 'Continue?')) return;
    button.disabled = true;
    try {
      const data = await api('/api/admin/customers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, action }) });
      if (action === 'reset-activation' && data.activationToken) {
        const copied = await navigator.clipboard?.writeText(data.activationToken).then(() => true).catch(() => false);
        window.prompt('One-time activation token for ' + customer.phone + '. Send it to the customer through a private channel. It will not be shown again.', data.activationToken);
        toastMsg(copied ? 'New token copied to clipboard.' : 'New token generated. Copy it from the prompt.');
      } else toastMsg(action === 'approve' ? 'Payment marked verified; subscription activated.' : `Customer ${action} complete.`);
      await refreshAll();
      if (currentView === 'customers') await loadCustomers();
    } catch (error) { showNotice(error.message || 'Customer action failed.', true); }
    finally { button.disabled = false; }
  });

  async function loadSettings() {
    const data = await api('/api/admin/settings');
    $('#payment-instructions').value = data.paymentInstructions || '';
    $('#monthly-price').value = data.monthlyPrice || 553;
    $('#annual-price').value = data.annualPrice || 5530;
  }
  $('#settings-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const button = $('button[type="submit"]', event.currentTarget); button.disabled = true;
    try {
      const settings = { paymentInstructions: $('#payment-instructions').value, monthlyPrice: Number($('#monthly-price').value), annualPrice: Number($('#annual-price').value) };
      await api('/api/admin/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(settings) });
      toastMsg('Payment settings saved. The public activation panel uses the same database.');
    } catch (error) { showNotice(error.message || 'Settings could not be saved.', true); }
    finally { button.disabled = false; }
  });

  async function loadKeys() {
    const data = await api('/api/admin/keys');
    const byProvider = new Map((data.keys || []).map(k => [k.provider, k]));
    $$('.key-card').forEach(card => {
      const item = byProvider.get(card.dataset.provider);
      const status = $('[data-key-status]', card);
      status.textContent = item && item.configured ? '● Key stored encrypted' : '○ Not configured';
      status.classList.toggle('ready', !!(item && item.configured));
      const input = $('input[name="key"]', card); input.value = '';
      input.required = !(item && item.configured);
      const btn = $('button[type="submit"]', card); btn.textContent = item && item.configured ? 'Replace key' : 'Save key';
      const remove = $('[data-remove-key]', card); remove.disabled = !(item && item.configured);
    });
  }
  $$('.key-card').forEach(card => {
    card.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = $('button[type="submit"]', card); button.disabled = true;
      try {
        await api('/api/admin/keys', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: card.dataset.provider, key: $('input[name="key"]', card).value, action: 'add' }) });
        toastMsg(card.dataset.provider + ' key stored encrypted.'); await loadKeys();
      } catch (error) { showNotice(error.message || 'Could not store provider key.', true); }
      finally { button.disabled = false; }
    });
    $('[data-remove-key]', card).addEventListener('click', async () => {
      if (!window.confirm('Remove the saved ' + card.dataset.provider + ' key?')) return;
      try { await api('/api/admin/keys', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: card.dataset.provider, action: 'remove' }) }); toastMsg('Provider key removed.'); await loadKeys(); }
      catch (error) { showNotice(error.message || 'Could not remove key.', true); }
    });
  });

  async function loadAnnouncements() {
    const data = await api('/api/admin/announcements'); const items = data.announcements || [];
    const box = $('#announcements-list');
    if (!items.length) { box.innerHTML = '<p class="empty">No announcements yet.</p>'; return; }
    box.innerHTML = items.map(a => `<article class="announcement-item"><div><h4>${esc(a.title)} ${a.active ? '<span class="status active">active</span>' : '<span class="status">inactive</span>'}</h4><p>${esc(a.body)}</p><div class="muted">${esc(a.level)} · ${esc(fmtDate(a.createdAt))}</div></div><div class="actions"><button class="mini-btn" data-ann-action="toggle" data-id="${a.id}" data-active="${a.active ? '0' : '1'}">${a.active ? 'Hide' : 'Publish'}</button><button class="mini-btn danger" data-ann-action="delete" data-id="${a.id}">Delete</button></div></article>`).join('');
  }
  $('#announcement-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const button = $('button[type="submit"]', event.currentTarget); button.disabled = true;
    try {
      await api('/api/admin/announcements', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: $('#announcement-title').value, body: $('#announcement-body').value, level: $('#announcement-level').value }) });
      event.currentTarget.reset(); toastMsg('Announcement published.'); await loadAnnouncements();
    } catch (error) { showNotice(error.message || 'Announcement could not be published.', true); }
    finally { button.disabled = false; }
  });
  $('#announcements-list').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-ann-action]'); if (!button) return;
    const action = button.dataset.annAction; const id = Number(button.dataset.id);
    if (action === 'delete' && !window.confirm('Delete this announcement permanently?')) return;
    try { await api('/api/admin/announcements', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(action === 'delete' ? { action, id } : { action, id, active: button.dataset.active === '1' }) }); toastMsg('Announcement updated.'); await loadAnnouncements(); }
    catch (error) { showNotice(error.message || 'Announcement update failed.', true); }
  });

  checkSession();
})();
