const TOKEN_KEY = 'blbb_admin_token';
const CATEGORY_LABELS = { beef: 'Beef Burger', chicken: 'Chicken Burger', drink: 'Drinks' };
const CATEGORY_EMOJI = { beef: '🥩', chicken: '🍗', drink: '🥤' };

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const statusBanner = document.getElementById('statusBanner');
const productTableBody = document.getElementById('productTableBody');
const dashTabs = document.querySelectorAll('.dash-tab');

let allProducts = [];
let activeCat = 'all';

/* ---------- session helpers ---------- */
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.classList.add('show');
  logoutBtn.style.display = 'inline-flex';
  loadProducts();
}
function showLogin() {
  loginScreen.style.display = 'flex';
  dashboard.classList.remove('show');
  logoutBtn.style.display = 'none';
}

function showBanner(message, type = 'success') {
  statusBanner.textContent = message;
  statusBanner.className = `status-banner show ${type}`;
  setTimeout(() => statusBanner.classList.remove('show'), 3500);
}

/* ---------- login ---------- */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.remove('show');
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    loginForm.reset();
    showDashboard();
  } catch (err) {
    loginError.textContent = err.message === 'Failed to fetch'
      ? "Couldn't reach the backend server. Make sure it's running."
      : err.message;
    loginError.classList.add('show');
  }
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  showLogin();
});

/* ---------- authenticated fetch wrapper ---------- */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    showLogin();
    loginError.textContent = 'Your session expired. Please log in again.';
    loginError.classList.add('show');
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

/* ---------- load & render products ---------- */
async function loadProducts() {
  productTableBody.innerHTML = `<tr class="empty-row"><td colspan="5">Loading products…</td></tr>`;
  try {
    allProducts = await apiFetch('/products');
    renderTable();
  } catch (err) {
    productTableBody.innerHTML = `<tr class="empty-row"><td colspan="5">Couldn't load products: ${err.message}</td></tr>`;
  }
}

function renderTable() {
  const filtered = activeCat === 'all' ? allProducts : allProducts.filter(p => p.category === activeCat);

  if (!filtered.length) {
    productTableBody.innerHTML = `<tr class="empty-row"><td colspan="5">No products in this category yet.</td></tr>`;
    return;
  }

  productTableBody.innerHTML = filtered.map(p => {
    const thumb = p.image
      ? `<img src="/uploads/${p.image}" alt="" class="p-thumb">`
      : `<div class="p-thumb p-thumb-empty">${CATEGORY_EMOJI[p.category] || '🍽️'}</div>`;
    return `
    <tr data-id="${p.id}">
      <td>
        <div class="p-row">
          ${thumb}
          <div>
            <div class="p-name">${escapeHtml(p.name)}</div>
            <div class="p-desc">${escapeHtml(p.desc)}</div>
          </div>
        </div>
      </td>
      <td><span class="p-cat">${CATEGORY_LABELS[p.category] || p.category}</span></td>
      <td class="p-price">${escapeHtml(p.price)}</td>
      <td>
        <button class="avail-toggle ${p.available ? 'on' : ''}" data-action="toggle" data-id="${p.id}">
          <span class="track"></span>
          <span class="label">${p.available ? 'Available' : 'Sold out'}</span>
        </button>
      </td>
      <td>
        <div class="p-actions">
          <button class="btn btn-ghost btn-small" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-danger btn-small" data-action="delete" data-id="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

dashTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dashTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCat = tab.dataset.cat;
    renderTable();
  });
});

/* ---------- table actions: toggle / edit / delete ---------- */
productTableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  if (btn.dataset.action === 'toggle') toggleAvailability(product);
  if (btn.dataset.action === 'edit') openEditModal(product);
  if (btn.dataset.action === 'delete') openDeleteModal(product);
});

async function toggleAvailability(product) {
  try {
    const updated = await apiFetch(`/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify({ available: !product.available }),
    });
    Object.assign(product, updated);
    renderTable();
    showBanner(`${product.name} marked as ${product.available ? 'available' : 'sold out'}.`);
  } catch (err) {
    showBanner(err.message, 'error');
  }
}

/* ---------- add / edit modal ---------- */
const productModalOverlay = document.getElementById('productModalOverlay');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const addProductBtn = document.getElementById('addProductBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const imageInput = document.getElementById('p-image');
const imagePreview = document.getElementById('p-image-preview');
let currentImageFilename = null; // existing photo filename when editing, kept if no new file chosen

function resetImagePreview() {
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  currentImageFilename = null;
}

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { imagePreview.src = reader.result; imagePreview.style.display = 'block'; };
  reader.readAsDataURL(file);
});

function openAddModal() {
  productForm.reset();
  document.getElementById('productId').value = '';
  document.getElementById('p-available').checked = true;
  resetImagePreview();
  modalTitle.textContent = 'Add product';
  productModalOverlay.classList.add('show');
}

function openEditModal(product) {
  document.getElementById('productId').value = product.id;
  document.getElementById('p-name').value = product.name;
  document.getElementById('p-category').value = product.category;
  document.getElementById('p-desc').value = product.desc;
  document.getElementById('p-price').value = product.price;
  document.getElementById('p-available').checked = !!product.available;
  imageInput.value = '';
  if (product.image) {
    imagePreview.src = `/uploads/${product.image}`;
    imagePreview.style.display = 'block';
    currentImageFilename = product.image;
  } else {
    resetImagePreview();
  }
  modalTitle.textContent = 'Edit product';
  productModalOverlay.classList.add('show');
}

function closeProductModal() { productModalOverlay.classList.remove('show'); }

addProductBtn.addEventListener('click', openAddModal);
cancelModalBtn.addEventListener('click', closeProductModal);
productModalOverlay.addEventListener('click', (e) => { if (e.target === productModalOverlay) closeProductModal(); });

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;

  const formData = new FormData();
  formData.append('name', document.getElementById('p-name').value.trim());
  formData.append('category', document.getElementById('p-category').value);
  formData.append('desc', document.getElementById('p-desc').value.trim());
  formData.append('price', document.getElementById('p-price').value.trim());
  formData.append('available', document.getElementById('p-available').checked ? 'true' : 'false');
  if (imageInput.files[0]) formData.append('image', imageInput.files[0]);

  try {
    if (id) {
      const updated = await apiFetch(`/products/${id}`, { method: 'PUT', body: formData });
      const index = allProducts.findIndex(p => p.id === Number(id));
      allProducts[index] = updated;
      showBanner(`${updated.name} updated.`);
    } else {
      const created = await apiFetch('/products', { method: 'POST', body: formData });
      allProducts.push(created);
      showBanner(`${created.name} added to the menu.`);
    }
    closeProductModal();
    renderTable();
  } catch (err) {
    showBanner(err.message, 'error');
  }
});

/* ---------- delete modal ---------- */
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let pendingDeleteId = null;

function openDeleteModal(product) {
  pendingDeleteId = product.id;
  deleteModalOverlay.classList.add('show');
}
function closeDeleteModal() { deleteModalOverlay.classList.remove('show'); pendingDeleteId = null; }

cancelDeleteBtn.addEventListener('click', closeDeleteModal);
deleteModalOverlay.addEventListener('click', (e) => { if (e.target === deleteModalOverlay) closeDeleteModal(); });

confirmDeleteBtn.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  try {
    await apiFetch(`/products/${pendingDeleteId}`, { method: 'DELETE' });
    allProducts = allProducts.filter(p => p.id !== pendingDeleteId);
    showBanner('Product deleted.');
    renderTable();
  } catch (err) {
    showBanner(err.message, 'error');
  } finally {
    closeDeleteModal();
  }
});

/* ---------- init ---------- */
if (getToken()) {
  showDashboard();
} else {
  showLogin();
}
