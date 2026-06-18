/* StayLocal Admin — shared logic */

const GITHUB_REPO = 'Ryuga1981/Staylocal';
const GITHUB_BRANCH = 'main';
const NETLIFY_SITE = 'https://staylocalzahra.netlify.app';

const AMENITIES_LIST = [
  'Pool','WiFi','Kitchen','Air Conditioning','Free Parking',
  'Gym','BBQ Area','Washer','TV','Workspace',
  'Hot Tub','Sea View','Garden','Pet Friendly','Breakfast Included'
];

const PHOTO_CATEGORIES = ['outdoor','bedroom','living room','bathroom','facilities','kitchen'];

/* ── TOKEN STORAGE ── */
function getToken(){ return localStorage.getItem('sl_github_token') || ''; }
function setToken(t){ localStorage.setItem('sl_github_token', t); }

/* ── AUTH GUARD ── */
// Returns a Promise that resolves once the user is logged in AND a token exists.
function requireAuth(){
  return new Promise((resolve) => {
    if (!window.netlifyIdentity) { resolve(); return; }
    netlifyIdentity.on('init', user => {
      if (!user) {
        window.location.href = 'index.html';
        return; // never resolves — page is navigating away
      }
      renderUserBadge(user);
      if (getToken()) {
        resolve();
      } else {
        showTokenSetup(() => resolve());
      }
    });
    netlifyIdentity.init();
  });
}

function renderUserBadge(user){
  const el = document.getElementById('sidebarUser');
  if (!el) return;
  const email = user.email || 'Admin';
  const initial = email.charAt(0).toUpperCase();
  el.innerHTML = `<div class="sidebar-avatar">${initial}</div><span>${email}</span>`;
}

function doLogout(){
  if (window.netlifyIdentity) netlifyIdentity.logout();
  window.location.href = 'index.html';
}

/* ── TOKEN SETUP MODAL ── */
function showTokenSetup(onSaved){
  const wrap = document.createElement('div');
  wrap.style = 'position:fixed;inset:0;background:rgba(18,17,15,0.5);display:flex;align-items:center;justify-content:center;z-index:2000';
  wrap.innerHTML = `
    <div class="card" style="max-width:440px;width:90%">
      <h3 style="font-family:'Fraunces',serif;font-size:20px;margin-bottom:8px">One-time setup</h3>
      <p style="font-size:13px;color:var(--ink-lt);margin-bottom:16px">Paste a GitHub Personal Access Token (repo scope) so the dashboard can save listings directly to your repo.</p>
      <input type="password" id="tokenInput" class="field-input" placeholder="ghp_... or github_pat_..." style="margin-bottom:8px">
      <div id="tokenError" style="color:var(--red, #EF4444);font-size:12px;margin-bottom:8px;display:none"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" id="tokenSaveBtn">Save & Continue</button>
    </div>`;
  document.body.appendChild(wrap);

  const input = document.getElementById('tokenInput');
  const errBox = document.getElementById('tokenError');
  const btn = document.getElementById('tokenSaveBtn');

  btn.onclick = async () => {
    const val = input.value.trim();
    if (!val) return;
    btn.disabled = true;
    btn.textContent = 'Checking…';
    errBox.style.display = 'none';

    // Verify the token actually works before saving/closing
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
        headers: { Authorization: `Bearer ${val}` }
      });
      if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.message || `GitHub returned ${res.status}`);
      }
      setToken(val);
      wrap.remove();
      toast('Token saved', 'success');
      if (onSaved) onSaved();
    } catch(e){
      errBox.textContent = '❌ ' + e.message + ' — check the token has "repo" scope and was copied in full.';
      errBox.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Save & Continue';
    }
  };
}

/* ── TOAST ── */
function toast(msg, type='success'){
  let container = document.querySelector('.toast-container');
  if (!container){
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success:'✅', error:'❌', warn:'⚠️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── LOADING OVERLAY ── */
function showLoading(){
  if (document.getElementById('loadingOverlay')) return;
  const el = document.createElement('div');
  el.id = 'loadingOverlay';
  el.className = 'loading-overlay';
  el.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(el);
}
function hideLoading(){
  const el = document.getElementById('loadingOverlay');
  if (el) el.remove();
}

/* ── GITHUB API ── */
async function ghFetch(path, options={}){
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}`, ...(options.headers||{}) };
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, { ...options, headers });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }
  return res;
}

function slugify(str){
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-');
}

/* Parse YAML-ish frontmatter into an object. Supports nested arrays/objects via JSON fallback. */
function parseFrontmatter(text){
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { _body: text };
  const yamlBlock = match[1];
  const body = match[2] || '';
  const obj = { _body: body.trim() };
  const lines = yamlBlock.split('\n');
  let i = 0;
  while (i < lines.length){
    const line = lines[i];
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!kv){ i++; continue; }
    const key = kv[1];
    let val = kv[2].trim();
    if (val === '' ) {
      // could be a block (array of objects or list) — collect indented lines
      const blockLines = [];
      let j = i+1;
      while (j < lines.length && /^\s+/.test(lines[j])){ blockLines.push(lines[j]); j++; }
      obj[key] = parseYamlBlock(blockLines);
      i = j;
      continue;
    }
    if (val.startsWith('[') && val.endsWith(']')){
      obj[key] = val.slice(1,-1).split(',').map(s=>s.trim().replace(/^["']|["']$/g,'')).filter(Boolean);
    } else if (val === 'true') obj[key] = true;
    else if (val === 'false') obj[key] = false;
    else if (!isNaN(val) && val !== '') obj[key] = Number(val);
    else obj[key] = val.replace(/^["']|["']$/g,'');
    i++;
  }
  return obj;
}

function parseYamlBlock(lines){
  // Handles simple "- key: val" list-of-objects or "- val" simple list
  const items = [];
  let current = null;
  lines.forEach(raw => {
    const line = raw.replace(/^\s+/, '');
    if (line.startsWith('- ')){
      if (current) items.push(current);
      current = {};
      const rest = line.slice(2);
      const kv = rest.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (kv){
        current[kv[1]] = coerce(kv[2]);
      } else if (rest.trim()){
        items.push(coerce(rest.trim()));
        current = null;
      }
    } else if (current){
      const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (kv) current[kv[1]] = coerce(kv[2]);
    }
  });
  if (current) items.push(current);
  return items;
}

function coerce(val){
  val = val.trim();
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (!isNaN(val) && val !== '') return Number(val);
  return val.replace(/^["']|["']$/g,'');
}

/* Convert listing object to frontmatter markdown */
function toMarkdown(l){
  const lines = ['---'];
  lines.push(`title: ${l.title}`);
  lines.push(`location: ${l.location}`);
  lines.push(`region: ${l.region || ''}`);
  lines.push(`lat: ${l.lat || ''}`);
  lines.push(`lng: ${l.lng || ''}`);
  lines.push(`price: ${l.price}`);
  lines.push(`bedrooms: ${l.bedrooms}`);
  lines.push(`bathrooms: ${l.bathrooms}`);
  lines.push(`guests: ${l.guests}`);
  lines.push(`rating: ${l.rating}`);
  lines.push(`available: ${l.available}`);
  lines.push(`description: ${(l.description||'').replace(/\n/g,' ')}`);
  lines.push(`amenities: [${(l.amenities||[]).join(', ')}]`);

  // photos with categories
  lines.push('photos:');
  (l.photos||[]).forEach(p => {
    lines.push(`  - url: ${p.url}`);
    lines.push(`    category: ${p.category}`);
  });

  // promotions
  if (l.promotions && l.promotions.length){
    lines.push('promotions:');
    l.promotions.forEach(p => {
      lines.push(`  - start: ${p.start}`);
      lines.push(`    end: ${p.end}`);
      lines.push(`    discountPercent: ${p.discountPercent}`);
      lines.push(`    cashbackPercent: ${p.cashbackPercent}`);
    });
  }

  // availability blocks
  if (l.blockedDates && l.blockedDates.length){
    lines.push(`blockedDates: [${l.blockedDates.join(', ')}]`);
  }
  if (l.bookedDates && l.bookedDates.length){
    lines.push(`bookedDates: [${l.bookedDates.join(', ')}]`);
  }

  lines.push('---');
  return lines.join('\n') + '\n';
}

async function getListings(){
  const res = await ghFetch('/contents/_listings');
  if (res.status === 404) return [];
  const files = await res.json();
  const listings = await Promise.all(files.filter(f=>f.name.endsWith('.md')).map(async f => {
    const r = await fetch(f.download_url);
    const text = await r.text();
    const data = parseFrontmatter(text);
    data._filename = f.name;
    data._sha = f.sha;
    return data;
  }));
  return listings;
}

async function saveListing(listing){
  const filename = listing._filename || (slugify(listing.title) + '.md');
  const content = toMarkdown(listing);
  const body = {
    message: listing._sha ? `Update listing: ${filename}` : `Create listing: ${filename}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: GITHUB_BRANCH,
  };
  if (listing._sha) body.sha = listing._sha;
  await ghFetch(`/contents/_listings/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(body),
  });
  return filename;
}

async function deleteListingFile(filename, sha){
  await ghFetch(`/contents/_listings/${filename}`, {
    method: 'DELETE',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ message:`Delete listing: ${filename}`, sha, branch: GITHUB_BRANCH }),
  });
}

/* Upload an image file to /images via GitHub API, returns the path */
async function uploadImage(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/,''))}.${ext}`;
        await ghFetch(`/contents/images/${filename}`, {
          method: 'PUT',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({
            message: `Upload image: ${filename}`,
            content: base64,
            branch: GITHUB_BRANCH,
          }),
        });
        resolve(`/images/${filename}`);
      } catch(e){ reject(e); }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatIDR(num){
  return 'Rp ' + Math.round(num||0).toLocaleString('id-ID');
}

function photoUrl(path){
  if (!path) return 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80';
  if (path.startsWith('/images/')) return NETLIFY_SITE + path;
  return path;
}
