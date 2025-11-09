// public/js/app.js
/* eslint-disable no-undef */
(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const API = '/api/books';

  // Modal utils
  const modal = (id) => qs(`#${id}`);
  const showModal = (el) => { if (!el) return; el.classList.remove('hidden'); el.removeAttribute('aria-hidden'); };
  const hideModal = (el) => { if (!el) return; el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); };

  // Loading
  const loading = qs('#loading');
  const showLoading = () => loading?.classList.remove('hidden');
  const hideLoading = () => loading?.classList.add('hidden');

  // Escape text to avoid XSS
  function escapeHtml(text) {
    if (text == null) return '';
    return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  // Delete flow
  let deleteId = null;
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button.icon-delete');
    if (btn) {
      deleteId = btn.dataset.id;
      showModal(document.getElementById('modal-delete'));
    }
  });

  document.querySelectorAll('[data-action="cancel-delete"]').forEach(b => b.addEventListener('click', () => {
    deleteId = null; hideModal(document.getElementById('modal-delete'));
  }));

  document.querySelectorAll('[data-action="confirm-delete"]').forEach(b => b.addEventListener('click', async () => {
    if (!deleteId) return;
    try {
      showLoading();
      const res = await fetch(`${API}/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить книгу');
      location.reload();
    } catch (err) {
      alert(err.message || 'Ошибка');
    } finally {
      hideLoading();
      deleteId = null;
      hideModal(document.getElementById('modal-delete'));
    }
  }));

  // Borrow flow
  let borrowId = null;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="open-borrow"]');
    if (btn) {
      borrowId = btn.dataset.id;
      const form = qs('#form-borrow');
      form.reset();
      const dateInput = qs('input[name="dueDate"]', form);
      if (dateInput) dateInput.min = (new Date()).toISOString().split('T')[0];
      showModal(document.getElementById('modal-borrow'));
    }
  });

  document.querySelectorAll('[data-action="cancel-borrow"]').forEach(b => b.addEventListener('click', () => {
    borrowId = null; hideModal(document.getElementById('modal-borrow'));
  }));

  qs('#form-borrow')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!borrowId) return;
    const form = e.target;
    const fd = new FormData(form);
    const borrowerName = fd.get('borrowerName');
    const dueDate = fd.get('dueDate');

    if (!borrowerName || !dueDate) { alert('Укажите имя читателя и дату'); return; }
    try {
      showLoading();
      const res = await fetch(`${API}/${borrowId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrowerName, dueDate })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Ошибка при выдаче');
      }
      location.reload();
    } catch (err) {
      alert(err.message || 'Ошибка');
    } finally {
      hideLoading();
      hideModal(document.getElementById('modal-borrow'));
      borrowId = null;
    }
  });

  // Return flow (confirmation)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="do-return"]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!confirm('Подтвердите возврат книги')) return;
    try {
      showLoading();
      const res = await fetch(`${API}/${id}/return`, { method: 'POST' });
      if (!res.ok) throw new Error('Ошибка при возврате');
      location.reload();
    } catch (err) {
      alert(err.message || 'Ошибка');
    } finally { hideLoading(); }
  });

  // Filter form (progressive enhancement: update via AJAX)
  qs('#filter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const params = new URLSearchParams(new FormData(form));
    const url = `${window.location.pathname}?${params.toString()}`;
    history.replaceState({}, '', url);
    try {
      showLoading();
      const res = await fetch(`/api/books?${params.toString()}`);
      if (!res.ok) throw new Error('Не удалось загрузить книги');
      const books = await res.json();
      renderTable(books);
    } catch (err) {
      alert(err.message || 'Ошибка');
    } finally {
      hideLoading();
    }
  });

  function renderTable(books) {
    const tbody = qs('#books-table-body');
    if (!tbody) return;
    if (!books || books.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#6b7280">Нет книг</td></tr>`;
      return;
    }
    tbody.innerHTML = books.map(b => {
      const pub = new Date(b.publicationDate).toLocaleDateString('ru-RU');
      const overdue = b.dueDate && new Date(b.dueDate) < new Date();
      const status = b.isAvailable ? `<span class="tag tag-available">В наличии</span>` : `<span class="tag tag-borrowed">Выдана</span>${overdue ? '<span class="tag tag-overdue">Просрочена</span>' : ''}`;
      return `<tr data-id="${b.id}"><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td><td>${pub}</td><td>${status}</td><td>
        <a class="icon-btn" href="/books/${b.id}" title="Просмотр"><i class="fas fa-eye"></i></a>
        <a class="icon-btn" href="/books/${b.id}/edit" title="Редактировать"><i class="fas fa-edit"></i></a>
        <button class="icon-btn icon-delete" data-id="${b.id}" title="Удалить"><i class="fas fa-trash"></i></button>
      </td></tr>`;
    }).join('');
  }

  // Attach delete handlers to dynamic content via event delegation already above

  // enhance create/edit forms to use fetch to API when present
  const ajaxForm = (selector, method = 'POST', url) => {
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
        if (hasFile) {
          res = await fetch(url, { method, body: new FormData(form) });
        } else {
          const data = Object.fromEntries(new FormData(form).entries());
          res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        }
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || 'Ошибка при сохранении');
        }
        window.location.href = '/';
      } catch (err) {
        alert(err.message || 'Ошибка');
      } finally {
        hideLoading();
        if (btn) { btn.disabled = false; btn.innerHTML = orig; }
      }
    });
  };

  ajaxForm('#add-form', 'POST', '/api/books');
  // edit form uses method override via action in template
  const editForm = qs('#edit-form');
  if (editForm) {
    const action = editForm.getAttribute('action') || window.location.pathname;
    // if action contains ?_method=PUT we'll use PUT to the API
    const url = action.split('?')[0];
    ajaxForm('#edit-form', 'POST', url);
  }

  // initial hide modals
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  hideLoading();
})();
