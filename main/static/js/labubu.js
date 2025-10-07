// ===== CSRF + fetch helper =====
function getCookie(name){
  const m = document.cookie.match('(?:^|; )' + name.replace(/([$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)');
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchJSON(url, opts = {}){
  const headers = Object.assign({}, opts.headers);
  headers['X-Requested-With'] = 'XMLHttpRequest';
  const method = (opts.method || 'GET').toUpperCase();
  if (method !== 'GET') headers['X-CSRFToken'] = getCookie('csrftoken');

  const resp = await fetch(url, {...opts, headers});
  const ct = resp.headers.get('content-type') || '';
  if (!resp.ok){
    let msg = '';
    try { msg = await resp.text(); } catch(e){}
    throw new Error(msg || ('HTTP ' + resp.status));
  }
  if (ct.includes('application/json')) return resp.json();
  return resp.text();
}

// ===== Products (AJAX list + create + edit + delete) =====
const Products = (() => {
  const els = {
    list: null, loading: null, empty: null, error: null,
    refreshBtn: null,
    editModal: null, editBody: null, closeEdit: null,
    createModal: null, createBody: null, closeCreate: null,
    confirmModal: null, confirmText: null, confirmBtn: null, cancelDelete: null,
  };

  function init(){
    // placeholders on main page
    els.list = document.querySelector('[data-products-list]');
    if (!els.list) return; // nothing to do on pages without the list

    els.loading = document.querySelector('[data-products-loading]');
    els.empty   = document.querySelector('[data-products-empty]');
    els.error   = document.querySelector('[data-products-error]');
    els.refreshBtn = document.querySelector('[data-products-refresh]');

    // modals (some may not exist; we guard each use)
    els.editModal = document.getElementById('editProductModal');
    els.editBody  = document.getElementById('editModalBody');
    els.closeEdit = document.getElementById('closeEditModal');

    els.createModal = document.getElementById('createProductModal');
    els.createBody  = document.getElementById('createModalBody');
    els.closeCreate = document.getElementById('closeCreateModal');

    els.confirmModal = document.getElementById('confirmModal');
    els.confirmText  = document.getElementById('confirmText');
    els.confirmBtn   = document.getElementById('confirmDeleteBtn');
    els.cancelDelete = document.getElementById('cancelDelete');

    if (els.refreshBtn) els.refreshBtn.addEventListener('click', refresh);
    if (els.closeEdit)  els.closeEdit.addEventListener('click', () => closeModal(els.editModal));
    if (els.closeCreate) els.closeCreate.addEventListener('click', () => closeModal(els.createModal));
    if (els.cancelDelete) els.cancelDelete.addEventListener('click', () => closeModal(els.confirmModal));

    // global click delegation
    document.addEventListener('click', (ev) => {
      const editBtn = ev.target.closest('.open-edit-modal');
      if (editBtn){
        ev.preventDefault();
        openEdit(editBtn.getAttribute('href') || editBtn.dataset.url);
        return;
      }
      const createBtn = ev.target.closest('[data-open-create]');
      if (createBtn){
        ev.preventDefault();
        openCreate(createBtn.getAttribute('href') || window.CREATE_PRODUCT_URL);
        return;
      }
      const delBtn = ev.target.closest('.js-open-delete');
      if (delBtn){
        ev.preventDefault();
        askDelete(delBtn.dataset.url, delBtn.dataset.title || 'this item');
        return;
      }
    });

    refresh(); // initial load
  }

  async function refresh(){
    show(els.loading, true); show(els.error, false); show(els.empty, false);
    try{
      const url = window.PRODUCTS_JSON_URL || '/json/';
      const data = await fetchJSON(url);
      renderList(Array.isArray(data) ? data : []);
      toast('Products refreshed', 'Showing latest data', 'success', 1400);
    }catch(e){
      console.error(e);
      show(els.error, true);
      toast('Failed to load', e.message || 'Unknown error', 'error');
    }finally{
      show(els.loading, false);
    }
  }

  function renderList(items){
    els.list.innerHTML = '';
    if (!items.length){ show(els.empty, true); return; }

    const row = document.createElement('div');
    row.className = 'row g-4';

    for (const p of items){
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-lg-4';
      col.innerHTML = `
        <article class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="ratio ratio-16x9 position-relative bg-light">
            ${p.thumbnail ? `<img src="${p.thumbnail}" class="object-fit-cover w-100 h-100" alt="">`
                          : `<div class="d-flex align-items-center justify-content-center w-100 h-100 text-muted small">No image</div>`}
            <span class="badge bg-success position-absolute top-0 start-0 m-2 px-2 py-1">${p.category ?? 'General'}</span>
            ${p.is_featured ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2 px-2 py-1"><i class="bi bi-star-fill me-1"></i>Featured</span>` : ''}
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center text-muted small mb-2">
              <i class="bi bi-calendar-event me-1"></i>
              <time datetime="${p.created_at ?? ''}">${p.created_at ? (new Date(p.created_at)).toLocaleDateString() : ''}</time>
            </div>
            <h5 class="card-title mb-1"><a href="/product/${p.id}/" class="text-decoration-none link-success">${escapeHtml(p.title || '')}</a></h5>
            <p class="text-muted small mb-3">${escapeHtml((p.content || '').slice(0, 160))}</p>
            <div class="d-flex justify-content-between align-items-center">
              <div class="fw-bold text-success">Rp${p.price ?? '-'}</div>
              <div class="d-flex gap-2">
                ${p.can_edit
                  ? `<a href="/edit-product/${p.id}/" class="btn btn-sm btn-outline-secondary open-edit-modal"><i class="bi bi-pencil-square me-1"></i>Edit</a>
                     <button type="button" class="btn btn-sm btn-outline-danger js-open-delete" data-url="/delete-product/${p.id}/" data-title="${escapeHtml(p.title||'')}"><i class="bi bi-trash me-1"></i>Delete</button>`
                  : `<a href="/product/${p.id}/" class="btn btn-sm btn-outline-success rounded-pill">Read more</a>`}
              </div>
            </div>
          </div>
        </article>`;
      row.appendChild(col);
    }

    els.list.appendChild(row);
  }

  // ===== Create =====
  async function openCreate(url){
    if (!els.createModal || !els.createBody){
      // no modal shell — fallback to normal navigation
      window.location.href = url;
      return;
    }
    openModal(els.createModal);
    els.createBody.innerHTML = `<div class="text-white-50 py-5 text-center">Loading…</div>`;
    try{
      const html = await fetchJSON(url, { method:'GET' });
      els.createBody.innerHTML = html;
      wireCreateForm();
    }catch(e){
      els.createBody.innerHTML = `<div class="alert alert-danger m-3">Failed to load form. ${escapeHtml(e.message||'')}</div>`;
    }
  }

  function wireCreateForm(){
    const form = document.getElementById('createProductForm');
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try{
        const fd = new FormData(form);
        const data = await fetchJSON(form.action || window.location.href, { method:'POST', body: fd });
        if (data && data.ok){
          toast('Product created', 'Your product is live.', 'success');
          closeModal(els.createModal);
          refresh();
        }else if (typeof data === 'string'){
          els.createBody.innerHTML = data;
          wireCreateForm();
        }
      }catch(e){
        toast('Create failed', e.message || 'Unknown error', 'error');
      }
    });
  }

  // ===== Edit =====
  async function openEdit(url){
    if (!els.editModal || !els.editBody){
      window.location.href = url;
      return;
    }
    openModal(els.editModal);
    els.editBody.innerHTML = `<div class="p-4">Loading…</div>`;
    try{
      const html = await fetchJSON(url, { method:'GET' });
      els.editBody.innerHTML = html;
      wireEditForm();
    }catch(e){
      els.editBody.innerHTML = `<div class="alert alert-danger m-3">Failed to load form. ${escapeHtml(e.message||'')}</div>`;
    }
  }

  function wireEditForm(){
    const form = document.getElementById('editProductForm');
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try{
        const fd = new FormData(form);
        const data = await fetchJSON(form.action || window.location.href, { method:'POST', body: fd });
        if (data && data.ok){
          toast('Product edited', 'Your changes have been saved.', 'success');
          closeModal(els.editModal);
          refresh();
        }else if (typeof data === 'string'){
          els.editBody.innerHTML = data;
          wireEditForm();
        }
      }catch(e){
        toast('Update failed', e.message || 'Unknown error', 'error');
      }
    });
  }

  // ===== Delete =====
  let deleteUrl = null;
  function askDelete(url, title){
    deleteUrl = url;

    if (els.confirmModal && els.confirmBtn){
      if (els.confirmText) els.confirmText.textContent = `You’re about to delete “${title}”.`;
      openModal(els.confirmModal);
      els.confirmBtn.onclick = doDelete;
      return;
    }
    // fallback
    if (confirm(`Delete "${title}"?`)) doDelete();
  }

  async function doDelete(){
    if (!deleteUrl) return;
    try{
      const data = await fetchJSON(deleteUrl, { method:'POST' });
      if (data && data.ok){
        toast('Deleted', 'Product removed.', 'success');
        closeModal(els.confirmModal);
        refresh();
      }else{
        toast('Delete failed', 'Unexpected response', 'error');
      }
    }catch(e){
      toast('Delete failed', e.message || 'Unknown error', 'error');
    }finally{
      deleteUrl = null;
    }
  }

  // ===== helpers =====
  function openModal(node){
    if (!node) return;
    node.classList.remove('hidden');
    node.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(node){
    if (!node) return;
    node.classList.add('hidden');
    node.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function show(node, visible){
    if (!node) return;
    node.style.display = visible ? '' : 'none';
  }
  function escapeHtml(s){
    return (s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function toast(title, msg, type, d){
    if (typeof window.showToast === 'function') window.showToast(title, msg, type, d || 2200);
  }

  return { init };
})();

// ===== Optional: Login modal loader (if you use it) =====
const Auth = (() => {
  const modal = document.getElementById('loginModal');
  const body = document.getElementById('loginModalBody');
  const openBtn = document.getElementById('openLoginModal');
  const closeBtn = document.getElementById('closeLoginModal');

  function init(){
    if (!modal || !body || !openBtn) return;
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
      load('/login/');
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
  }
  function open(){
    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  async function load(url){
    body.innerHTML = '<div class="p-4">Loading…</div>';
    try{
      const html = await fetchJSON(url, { method:'GET' });
      body.innerHTML = html;
      wire();
    }catch(e){
      body.innerHTML = `<div class="alert alert-danger m-3">Failed to load. ${e.message||''}</div>`;
    }
  }
  function wire(){
    const form = body.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try{
        const fd = new FormData(form);
        const data = await fetchJSON(form.action || '/login/', { method:'POST', body: fd });
        if (data && data.ok){
          if (typeof window.showToast === 'function') window.showToast('Welcome back', 'Login success.', 'success');
          window.location.href = '/';
        }else if (typeof data === 'string'){
          body.innerHTML = data;
          wire();
        }
      }catch(e){
        if (typeof window.showToast === 'function') window.showToast('Login failed', e.message||'Unknown error', 'error');
      }
    });
  }
  return { init };
})();

// ===== boot =====
document.addEventListener('DOMContentLoaded', () => {
  Products.init();
  Auth.init();
});
