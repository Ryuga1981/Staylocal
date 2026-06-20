/* StayLocal — Guest Auth & Session */

const NETLIFY_SITE_URL = 'https://staylocalzahra.netlify.app';

/* ── SESSION ── */
function getGuest() {
  try { return JSON.parse(localStorage.getItem('sl_guest') || 'null'); } catch { return null; }
}
function setGuest(user) {
  localStorage.setItem('sl_guest', JSON.stringify(user));
}
function clearGuest() {
  localStorage.removeItem('sl_guest');
}
function isLoggedIn() {
  return !!getGuest();
}

/* ── RENDER NAV USER STATE ── */
function renderGuestNav() {
  const el = document.getElementById('guestNav');
  if (!el) return;
  const guest = getGuest();
  if (guest) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600">${guest.name.charAt(0).toUpperCase()}</div>
        <span style="font-size:14px;font-weight:500">${guest.name.split(' ')[0]}</span>
        <button onclick="showGuestMenu(this)" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--ink-mid)">▾</button>
      </div>`;
  } else {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <button onclick="openAuthModal('login')" style="background:none;border:none;font-size:14px;font-weight:500;cursor:pointer;color:var(--ink-mid);padding:8px 12px">Log in</button>
        <button onclick="openAuthModal('signup')" class="btn-auth-signup">Sign up</button>
      </div>`;
  }
}

function showGuestMenu(btn) {
  const existing = document.getElementById('guestDropdown');
  if (existing) { existing.remove(); return; }
  const drop = document.createElement('div');
  drop.id = 'guestDropdown';
  drop.style = 'position:fixed;top:68px;right:20px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);padding:8px;z-index:200;min-width:180px';
  drop.innerHTML = `
    <a href="trips.html" style="display:block;padding:10px 14px;font-size:14px;text-decoration:none;color:var(--ink);border-radius:8px" onmouseover="this.style.background='#f5f5f0'" onmouseout="this.style.background=''">🧳 My Trips</a>
    <a href="wishlist.html" style="display:block;padding:10px 14px;font-size:14px;text-decoration:none;color:var(--ink);border-radius:8px" onmouseover="this.style.background='#f5f5f0'" onmouseout="this.style.background=''">♥ Saved</a>
    <hr style="margin:6px 0;border:none;border-top:1px solid rgba(0,0,0,0.08)">
    <button onclick="guestLogout()" style="display:block;width:100%;text-align:left;padding:10px 14px;font-size:14px;background:none;border:none;cursor:pointer;color:var(--red,#ef4444);border-radius:8px">Log out</button>`;
  document.body.appendChild(drop);
  setTimeout(() => document.addEventListener('click', () => drop.remove(), { once: true }), 100);
}

/* ── AUTH MODAL ── */
function openAuthModal(mode = 'login') {
  const existing = document.getElementById('authModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.style = 'position:fixed;inset:0;background:rgba(18,17,15,0.5);display:flex;align-items:center;justify-content:center;z-index:500;padding:20px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:22px;padding:36px 32px;max-width:400px;width:100%;position:relative;box-shadow:0 24px 64px rgba(0,0,0,0.2)">
      <button onclick="document.getElementById('authModal').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:20px;cursor:pointer;color:#8A8784">✕</button>
      <div style="font-family:'Fraunces',serif;font-size:24px;font-weight:600;margin-bottom:6px" id="authTitle">${mode === 'login' ? 'Welcome back' : 'Create account'}</div>
      <div style="font-size:13px;color:#8A8784;margin-bottom:24px" id="authSub">${mode === 'login' ? 'Log in to book your stay' : 'Join StayLocal — it\'s free'}</div>

      <div id="authError" style="display:none;background:rgba(239,68,68,0.1);color:#b91c1c;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:14px"></div>

      <div id="signupFields" style="display:${mode === 'signup' ? 'block' : 'none'}">
        <div style="margin-bottom:14px">
          <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:5px">Full Name</label>
          <input id="authName" type="text" placeholder="Budi Santoso" style="width:100%;padding:11px 14px;border:1.5px solid rgba(18,17,15,0.1);border-radius:8px;font-size:14px;font-family:inherit;outline:none" onfocus="this.style.borderColor='#0D5C63'" onblur="this.style.borderColor='rgba(18,17,15,0.1)'">
        </div>
      </div>

      <div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:5px">Email</label>
        <input id="authEmail" type="email" placeholder="you@email.com" style="width:100%;padding:11px 14px;border:1.5px solid rgba(18,17,15,0.1);border-radius:8px;font-size:14px;font-family:inherit;outline:none" onfocus="this.style.borderColor='#0D5C63'" onblur="this.style.borderColor='rgba(18,17,15,0.1)'">
      </div>

      <div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:5px">Password</label>
        <input id="authPassword" type="password" placeholder="Min. 8 characters" style="width:100%;padding:11px 14px;border:1.5px solid rgba(18,17,15,0.1);border-radius:8px;font-size:14px;font-family:inherit;outline:none" onfocus="this.style.borderColor='#0D5C63'" onblur="this.style.borderColor='rgba(18,17,15,0.1)'">
      </div>

      <div id="signupPhoneField" style="display:${mode === 'signup' ? 'block' : 'none'};margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:5px">Phone (optional)</label>
        <input id="authPhone" type="tel" placeholder="+62 812 3456 7890" style="width:100%;padding:11px 14px;border:1.5px solid rgba(18,17,15,0.1);border-radius:8px;font-size:14px;font-family:inherit;outline:none" onfocus="this.style.borderColor='#0D5C63'" onblur="this.style.borderColor='rgba(18,17,15,0.1)'">
      </div>

      <button id="authSubmitBtn" onclick="submitAuth('${mode}')" style="width:100%;padding:13px;background:#E8472A;color:#fff;border:none;border-radius:100px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:16px">
        ${mode === 'login' ? 'Log in' : 'Create account'}
      </button>

      <div style="text-align:center;font-size:13px;color:#8A8784">
        ${mode === 'login'
          ? `Don't have an account? <button onclick="switchAuthMode('signup')" style="background:none;border:none;color:#0D5C63;font-weight:600;cursor:pointer;font-size:13px">Sign up</button>`
          : `Already have an account? <button onclick="switchAuthMode('login')" style="background:none;border:none;color:#0D5C63;font-weight:600;cursor:pointer;font-size:13px">Log in</button>`}
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function switchAuthMode(mode) {
  openAuthModal(mode);
}

async function submitAuth(mode) {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errBox = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');

  if (!email || !password) {
    errBox.textContent = 'Please fill in all fields.';
    errBox.style.display = 'block';
    return;
  }
  if (password.length < 8) {
    errBox.textContent = 'Password must be at least 8 characters.';
    errBox.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = mode === 'login' ? 'Logging in…' : 'Creating account…';
  errBox.style.display = 'none';

  try {
    if (mode === 'signup') {
      const name = document.getElementById('authName').value.trim();
      if (!name) throw new Error('Please enter your full name.');
      // Register via Netlify Identity
      const res = await fetch(`${NETLIFY_SITE_URL}/.netlify/identity/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, data: { full_name: name, phone: document.getElementById('authPhone').value.trim() } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || data.error_description || 'Signup failed');
      // Auto login after signup
      await loginGuest(email, password);
    } else {
      await loginGuest(email, password);
    }
  } catch(e) {
    errBox.textContent = e.message;
    errBox.style.display = 'block';
    btn.disabled = false;
    btn.textContent = mode === 'login' ? 'Log in' : 'Create account';
  }
}

async function loginGuest(email, password) {
  const res = await fetch(`${NETLIFY_SITE_URL}/.netlify/identity/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Invalid email or password.');

  // Get user profile
  const profile = await fetch(`${NETLIFY_SITE_URL}/.netlify/identity/user`, {
    headers: { Authorization: `Bearer ${data.access_token}` }
  });
  const user = await profile.json();

  setGuest({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || email.split('@')[0],
    phone: user.user_metadata?.phone || '',
    token: data.access_token,
    expires: Date.now() + (data.expires_in * 1000)
  });

  document.getElementById('authModal')?.remove();
  renderGuestNav();

  // Trigger post-login callback if any
  if (window._authCallback) { window._authCallback(); window._authCallback = null; }
}

function guestLogout() {
  clearGuest();
  renderGuestNav();
  document.getElementById('guestDropdown')?.remove();
  if (window.location.pathname.includes('trips') || window.location.pathname.includes('booking')) {
    window.location.href = 'index.html';
  }
}

/* Require login — shows modal and resolves promise when logged in */
function requireGuestLogin() {
  return new Promise(resolve => {
    if (isLoggedIn()) { resolve(getGuest()); return; }
    window._authCallback = () => resolve(getGuest());
    openAuthModal('login');
  });
}

/* ── BOOKING STORAGE ── */
function getBookings() {
  try { return JSON.parse(localStorage.getItem('sl_bookings') || '[]'); } catch { return []; }
}
function saveBooking(booking) {
  const bookings = getBookings();
  bookings.unshift(booking);
  localStorage.setItem('sl_bookings', JSON.stringify(bookings));
}

/* ── FORMAT HELPERS ── */
function formatIDR(n) {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}
function nightsBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}
function formatDate(str) {
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
