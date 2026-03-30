window.onload = loadContacts;
// ── Colour palette for avatars ──
  const PALETTES = [
    ['#7c5cfc','#fff'], ['#fc5c7d','#fff'], ['#4fffb0','#0a0a0f'],
    ['#f5a623','#0a0a0f'], ['#00c9ff','#0a0a0f'], ['#ff6b6b','#fff']
  ];
  function avatarStyle(name) {
    const idx = name.charCodeAt(0) % PALETTES.length;
    return `background:${PALETTES[idx][0]};color:${PALETTES[idx][1]}`;
  }
  function initials(f, l) { return (f[0]||'').toUpperCase() + (l[0]||'').toUpperCase(); }

  // ── Console logger ──
  function logToConsole(action, data) {
    const panel = document.getElementById('consoleOut');
    const now = new Date();
    const ts = now.toTimeString().slice(0,8);

    // Also log to real browser console
    console.log(`[${ts}] [${action}]`, data);

    const line = document.createElement('div');
    line.className = 'log-line';

    let inner = `<span class="log-ts">${ts}</span><span class="log-action">${action.padEnd(10)}</span> `;

    if (typeof data === 'object' && data !== null) {
      const pairs = Object.entries(data).map(([k,v]) =>
        `<span class="log-key">${k}</span>: <span class="log-val">"${v}"</span>`
      ).join(' &nbsp;│&nbsp; ');
      inner += pairs;
    } else {
      inner += `<span class="log-val">${data}</span>`;
    }

    line.innerHTML = inner;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
  }

  // ── Validation ──
  function validate() {
    const f = document.getElementById('firstName').value.trim();
    const l = document.getElementById('lastName').value.trim();
    const e = document.getElementById('email').value.trim();
    if (!f) { alert('First name is required.'); return false; }
    if (!l) { alert('Last name is required.'); return false; }
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { alert('Valid email is required.'); return false; }
    return true;
  }

  // ── Gather form data ──
  function getFormData() {
    return {
      firstName : document.getElementById('firstName').value.trim(),
      lastName  : document.getElementById('lastName').value.trim(),
      email     : document.getElementById('email').value.trim(),
      phone     : document.getElementById('phone').value.trim(),
      category  : document.getElementById('category').value,
      company   : document.getElementById('company').value.trim(),
      notes     : document.getElementById('notes').value.trim(),
    };
  }

  // ── Submit ──
  async function handleSubmit() {
    if (!validate()) return;

    const data = getFormData();
    const editId = document.getElementById('editId').value;

    if (editId) {
        // UPDATE
        await fetch(`http://127.0.0.1:5000/contacts/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
        });

        logToConsole('UPDATE', { id: editId, ...data });
        showToast('✏️ Contact updated!');
    } else {
        // CREATE
        await fetch("http://127.0.0.1:5000/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
        });

        logToConsole('ADD', data);
        showToast('✓ Contact added!');
    }

    resetForm();
    loadContacts();
    }
  // ── Edit ──
  function editContact(id) {
    const c = contacts.find(x => x.id === id);
    if (!c) return;

    document.getElementById('editId').value      = id;
    document.getElementById('firstName').value   = c.firstName;
    document.getElementById('lastName').value    = c.lastName;
    document.getElementById('email').value       = c.email;
    document.getElementById('phone').value       = c.phone;
    document.getElementById('category').value    = c.category;
    document.getElementById('company').value     = c.company;
    document.getElementById('notes').value       = c.notes;
    document.getElementById('formTitle').textContent = 'Edit Contact';
    logToConsole('EDIT_OPEN', { id, name: `${c.firstName} ${c.lastName}` });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Delete ──
 async function deleteContact(id) {
    await fetch(`http://127.0.0.1:5000/contacts/${id}`, {
        method: "DELETE"
    });

    logToConsole('DELETE', { id });
    loadContacts();
    showToast('🗑️ Contact deleted!');
}

async function loadContacts() {
  const res = await fetch("http://127.0.0.1:5000/contacts");
  contacts = await res.json();

  renderContacts();
  updateStats();
}

async function loadContacts() {
  const res = await fetch("http://127.0.0.1:5000/contacts");
  contacts = await res.json();

  renderContacts();
  updateStats();
}

  // ── Reset form ──
  function resetForm() {
    ['firstName','lastName','email','phone','company','notes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('category').value = 'work';
    document.getElementById('editId').value = '';
    document.getElementById('formTitle').textContent = 'Add New Contact';
  }

  // ── Render ──
  function renderContacts() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    const list = document.getElementById('contactList');
    const filtered = contacts.filter(c =>
      `${c.firstName} ${c.lastName} ${c.email} ${c.company}`.toLowerCase().includes(q)
    );

    if (!filtered.length) {
      list.innerHTML = `<div class="empty-state"><div class="big">${q ? '🔍' : '📋'}</div>${q ? 'No matching contacts.' : 'No contacts yet.<br/>Add one using the form!'}</div>`;
      return;
    }

    list.innerHTML = filtered.map(c => `
      <div class="contact-card" onclick="editContact(${c.id})">
        <div class="avatar" style="${avatarStyle(c.firstName)}">${initials(c.firstName, c.lastName)}</div>
        <div class="card-info">
          <div class="card-name">${c.firstName} ${c.lastName}</div>
          <div class="card-sub">${c.email}${c.company ? ' · ' + c.company : ''}</div>
        </div>
        <span class="tag tag-${c.category}">${c.category}</span>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="icon-btn edit"   title="Edit"   onclick="editContact(${c.id})">✎</button>
          <button class="icon-btn delete" title="Delete" onclick="deleteContact(${c.id})">✕</button>
        </div>
      </div>
    `).join('');
  }

  // ── Stats ──
  function updateStats() {
    document.getElementById('totalCount').textContent    = contacts.length;
    document.getElementById('workCount').textContent     = contacts.filter(c => c.category === 'work').length;
    document.getElementById('personalCount').textContent = contacts.filter(c => c.category === 'personal').length;
  }

  // ── Toast ──
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }
