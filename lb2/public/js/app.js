// public/js/app.js
/* eslint-disable no-undef */
(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const API = '/api/books';
  let pendingFetch = null;
  let pendingController = null;

  // Toast helpers
  const toastContainer = document.getElementById('toast-container');
  function showToast(text, opts = {}) {
    const div = document.createElement('div');
    div.className = `toast ${opts.type || ''}`.trim();
    div.textContent = text;
    toastContainer.appendChild(div);
    setTimeout(() => div.style.opacity = '1', 10);
    const ttl = opts.ttl || 4500;
    setTimeout(() => div.style.opacity = '0', ttl - 300);
    setTimeout(() => div.remove(), ttl);
  }

  // Utils
  const modal = (id) => document.getElementById(id);
  function openModal(el) { if (!el) return; el.setAttribute('aria-hidden', 'false'); el.focus?.(); }
  function closeModal(el) { if (!el) return; el.setAttribute('aria-hidden', 'true'); }
  const loading = qs('#loading');
  const showLoading = () => loading?.classList.remove('hidden');
  const hideLoading = () => loading?.classList.add('hidden');

  function escapeHtml(text) {
    if (text == null) return '';
    return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  // debounce
  function debounce(fn, wait = 250) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  // Abortable fetch with timeout
  async function safeFetch(url, opts = {}, timeout = 15000) {
    if (pendingController) {
      pendingController.abort();
      pendingController = null;
    }
    const controller = new AbortController();
    pendingController = controller;
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      pendingController = null;
      return res;
    } catch (e) {
      clearTimeout(id);
      pendingController = null;
      throw e;
    }
  }

  // --- progressive table rendering with small animations ---
  function renderTable(books) {
    const tbody = qs('#books-table-body');
    if (!tbody) return;
    // fade out current rows
    tbody.style.transition = 'opacity .12s';
    tbody.style.opacity = '0.2';
    requestAnimationFrame(() => {
      // replace content
      if (!books || books.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#6b7280">Нет книг, соответствующих фильтрам</td></tr>`;
      } else {
        tbody.innerHTML = books.map(b => {
          const pub = new Date(b.publicationDate).toLocaleDateString('ru-RU');
          const overdue = b.dueDate && new Date(b.dueDate) < new Date();
          const status = b.isAvailable
            ? `<span class="tag tag-available">В наличии</span>`
            : `<span class="tag tag-borrowed">Выдана</span>${overdue ? '<span class="tag tag-overdue">Просрочена</span>' : ''}`;
          return `
            <tr data-id="${b.id}">
              <td class="title">${escapeHtml(b.title)}</td>
              <td class="author">${escapeHtml(b.author)}</td>
              <td>${pub}</td>
              <td>${status}</td>
              <td>
                <a class="icon-btn" href="/books/${b.id}" title="Просмотр"><i class="fas fa-eye"></i></a>
                <a class="icon-btn" href="/books/${b.id}/edit" title="Редактировать"><i class="fas fa-edit"></i></a>
                <button class="icon-btn icon-delete" data-id="${b.id}" title="Удалить"><i class="fas fa-trash"></i></button>
                ${b.isAvailable
              ? `<button class="icon-btn" data-action="open-borrow" data-id="${b.id}" title="Выдать"><i class="fas fa-hand-holding"></i></button>`
              : `<button class="icon-btn" data-action="do-return" data-id="${b.id}" title="Вернуть"><i class="fas fa-undo"></i></button>`}
              </td>
            </tr>
          `;
        }).join('');
      }
      // small delay then fade in
      setTimeout(() => { tbody.style.opacity = '1'; tbody.style.transition = ''; }, 130);
    });
  }

  // Fetch list (used by filter)
  const fetchBooks = debounce(async (params = '') => {
    try {
      showLoading();
      const res = await safeFetch(`/api/books${params ? '?' + params : ''}`);
      if (!res.ok) throw new Error('Не удалось загрузить книги');
      const books = await res.json();
      renderTable(books);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Ошибка при загрузке', { type: 'error' });
    } finally {
      hideLoading();
    }
  }, 180);

  // Handlers: deletion (optimistic)
  let lastDeleted = null;
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.icon-delete');
    if (!btn) return;
    const id = btn.dataset.id;
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;
    // optimistic remove with small animation
    row.classList.add('removed');
    setTimeout(() => row.remove(), 220);

    try {
      const res = await safeFetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const js = await res.json().catch(() => null);
        throw new Error(js?.error || 'Не удалось удалить книгу');
      }
      lastDeleted = null;
      showToast('Книга удалена', { type: 'success' });
    } catch (err) {
      // re-fetch to restore state and show error
      showToast(err.message || 'Ошибка удаления', { type: 'error' });
      fetchBooks(new URLSearchParams(new FormData(qs('#filter-form') || new FormData())).toString());
    }
  });

  // Borrow flow
  let borrowId = null;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="open-borrow"]');
    if (!btn) return;
    borrowId = btn.dataset.id;
    const form = qs('#form-borrow');
    if (form) form.reset();
    const dateInput = qs('input[name="dueDate"]', form);
    if (dateInput) dateInput.min = (new Date()).toISOString().split('T')[0];
    openModal(modal('modal-borrow'));
  });

  // Cancel borrow
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="cancel-borrow"]') || e.target.closest('[data-action="close-modal"]')) {
      borrowId = null;
      closeModal(modal('modal-borrow'));
      closeModal(modal('modal-delete'));
    }
  });

  qs('#form-borrow')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!borrowId) return;
    const form = e.target;
    const fd = new FormData(form);
    const borrowerName = fd.get('borrowerName');
    const dueDate = fd.get('dueDate');
    if (!borrowerName || !dueDate) {
      showToast('Укажите имя и дату', { type: 'error' });
      return;
    }
    try {
      showLoading();
      const res = await safeFetch(`${API}/${borrowId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrowerName, dueDate })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Ошибка при выдаче');
      }
      showToast('Книга выдана', { type: 'success' });
      // refresh table via filter
      fetchBooks(new URLSearchParams(new FormData(qs('#filter-form') || new FormData())).toString());
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Ошибка при выдаче', { type: 'error' });
    } finally {
      hideLoading();
      closeModal(modal('modal-borrow'));
      borrowId = null;
    }
  });

  // Return flow
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="do-return"]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!confirm('Подтвердите возврат книги')) return;
    try {
      showLoading();
      const res = await safeFetch(`${API}/${id}/return`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Ошибка при возврате');
      }
      showToast('Книга возвращена', { type: 'success' });
      fetchBooks(new URLSearchParams(new FormData(qs('#filter-form') || new FormData())).toString());
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Ошибка при возврате', { type: 'error' });
    } finally {
      hideLoading();
    }
  });

  // Filter form: supports both submit and live search
  qs('#filter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(e.target)).toString();
    history.replaceState({}, '', `${window.location.pathname}?${params}`);
    fetchBooks(params);
  });

  // reset filters
  qs('#reset-filters')?.addEventListener('click', () => {
    const form = qs('#filter-form');
    if (!form) return;
    form.reset();
    history.replaceState({}, '', '/');
    fetchBooks();
  });

  // Quick search (live)
  qs('#quick-search')?.addEventListener('input', debounce((e) => {
    const input = qs('#quick-search');
    if (!input) return;
    const v = (input.value || '').trim();
    const params = v ? `q=${encodeURIComponent(v)}` : '';
    history.replaceState({}, '', params ? `/books?${params}` : '/');
    fetchBooks(params);
  }, 350));

  // Enhance forms: add AJAX submit for add/edit if present
  function ajaxForm(selector) {
    const form = qs(selector);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn?.innerHTML;
      try {
        showLoading();
        if (btn) { btn.disabled = true; btn.innerHTML = 'Сохранение...'; }
        const hasFile = !!form.querySelector('input[type="file"]')?.files?.length;
        let res;
        const action = form.getAttribute('action') || window.location.pathname;
        if (hasFile) {
          res = await safeFetch(action, { method: 'POST', body: new FormData(form) });
        } else {
          const data = Object.fromEntries(new FormData(form).entries());
          res = await safeFetch(action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        }
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || 'Ошибка при сохранении');
        }
        showToast('Сохранено', { type: 'success' });
        // redirect to list or follow Location header
        const loc = res.headers.get('Location') || '/';
        setTimeout(() => { window.location.href = loc; }, 350);
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Ошибка при сохранении', { type: 'error' });
      } finally {
        hideLoading();
        if (btn) { btn.disabled = false; btn.innerHTML = orig; }
      }
    });
  }

  ajaxForm('#add-form');
  ajaxForm('#edit-form');

  // Theme toggle (simple)
  qs('#theme-toggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });
  // restore theme
  if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');

  // initial fetch if page had no server-rendered data (or to refresh)
  // We prefer to fetch only if there's no server rendered rows (server-side rendering kept)
  (function init() {
    const tbody = qs('#books-table-body');
    // if table is empty or contains only the skeleton, fetch fresh
    if (!tbody || tbody.children.length === 0 || tbody.textContent.trim().length < 10) {
      fetchBooks();
    }
    // hide modals on init
    qsa('.modal').forEach(m => m.setAttribute('aria-hidden', 'true'));
    hideLoading();
  })();

})();
