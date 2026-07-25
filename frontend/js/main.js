document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- mobile menu ---------- */
const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
burgerBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burgerBtn.setAttribute('aria-expanded', open);
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  burgerBtn.setAttribute('aria-expanded', false);
}));

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- open / closed status (Mountain Time) ---------- */
const HOURS = {
  0: [10 * 60, 18 * 60], // Sunday
  1: null,                // Monday
  2: null,
  3: null,
  4: null,
  5: [16 * 60, 20 * 60],  // Friday
  6: [10 * 60, 20 * 60],  // Saturday
};
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getEdmontonParts() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Edmonton', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = fmt.formatToParts(new Date());
  const map = {};
  parts.forEach(p => map[p.type] = p.value);
  const weekdayIdx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[map.weekday];
  const minutes = parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10);
  return { day: weekdayIdx, minutes };
}

function formatTime(mins) {
  let h = Math.floor(mins / 60), m = mins % 60;
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12; if (h === 0) h = 12;
  return h + (m ? ':' + String(m).padStart(2, '0') : '') + ap;
}

function updateStatus() {
  const { day, minutes } = getEdmontonParts();
  const today = HOURS[day];
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');

  if (today && minutes >= today[0] && minutes < today[1]) {
    dot.className = 'status-dot open';
    text.textContent = `Open now · till ${formatTime(today[1])} MT`;
  } else {
    dot.className = 'status-dot closed';
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) {
        const label = i === 1 ? 'tomorrow' : DAY_NAMES[d];
        text.textContent = `Closed · opens ${label} ${formatTime(HOURS[d][0])} MT`;
        break;
      }
    }
  }

  document.querySelectorAll('#hoursTable tr').forEach(tr => {
    tr.classList.toggle('today', parseInt(tr.dataset.day, 10) === day);
  });
}
updateStatus();
setInterval(updateStatus, 60000);

/* ---------- menu: fetched live from the backend API ---------- */
const menuGrid = document.getElementById('menuGrid');
const searchInput = document.getElementById('searchInput');
const tabs = document.querySelectorAll('.tab');
let activeCat = 'all';
let allProducts = [];

const CATEGORY_LABELS = { beef: 'Beef Burger', chicken: 'Chicken Burger', drink: 'Drinks' };
const CATEGORY_EMOJI = { beef: '🥩', chicken: '🍗', drink: '🥤' };

function renderMenu() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = allProducts.filter(item => {
    const matchesCat = activeCat === 'all' || item.category === activeCat;
    const matchesQuery = !q ||
      item.name.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      (CATEGORY_LABELS[item.category] || '').toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  if (!filtered.length) {
    menuGrid.innerHTML = `<div class="empty-state"><span>🍽️</span>No dishes match your search yet.<br>Try another word, or ask us directly on WhatsApp.</div>`;
    return;
  }

  menuGrid.innerHTML = filtered.map(item => {
    const media = item.image
      ? `<img class="photo" src="/uploads/${item.image}" alt="${item.name}" loading="lazy">`
      : `<div class="art ${item.category}">${CATEGORY_EMOJI[item.category] || '🍽️'}</div>`;
    return `
    <div class="menu-card ${item.available ? '' : 'unavailable'}">
      ${media}
      <div class="body">
        <div class="top-row">
          <span class="cat-label">${CATEGORY_LABELS[item.category] || item.category}</span>
          <span class="avail-badge ${item.available ? 'yes' : 'no'}">${item.available ? 'Available' : 'Sold out'}</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <div class="price-row">
          <span class="price">${item.price}</span>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

async function loadMenu() {
  menuGrid.innerHTML = `<div class="empty-state"><span>⏳</span>Loading the menu…</div>`;
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) throw new Error('Failed to load menu');
    allProducts = await res.json();
    renderMenu();
  } catch (err) {
    menuGrid.innerHTML = `<div class="empty-state"><span>⚠️</span>Couldn't reach the menu right now.<br>Make sure the backend server is running.</div>`;
  }
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCat = tab.dataset.cat;
    renderMenu();
  });
});
searchInput.addEventListener('input', renderMenu);
loadMenu();
