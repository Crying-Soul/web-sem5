import { getUsers } from '../api/users';
import { UserEditForm } from './UserEditForm';

export async function UserList() {
  const users = await getUsers();
  const container = document.createElement('div');
  container.className = 'container mt-4';
  container.innerHTML = `
    <h2>Пользователи</h2>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Фото</th>
          <th>ФИО</th>
          <th>Дата рождения</th>
          <th>Email</th>
          <th>Роль</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        ${users.map((u: any) => `
          <tr data-id="${u.id}">
            <td><img src="${u.photo}" width="40"/></td>
            <td>${u.fullName}</td>
            <td>${u.birthDate}</td>
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>${u.status}</td>
            <td>
              <button class="btn btn-sm btn-secondary edit-btn">Редактировать</button>
              <button class="btn btn-sm btn-warning role-btn">Роль</button>
              <button class="btn btn-sm btn-info status-btn">Статус</button>
              <button class="btn btn-sm btn-danger delete-btn">Удалить</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div id="user-action-error" class="text-danger mt-2" style="display:none"></div>
  `;

  // Обработчики действий
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tr = (e.target as HTMLElement).closest('tr');
      const id = tr?.getAttribute('data-id');
      const user = users.find((u: any) => u.id == id);
      if (!user) return;
      const modal = document.createElement('div');
      modal.innerHTML = UserEditForm(user);
      document.body.appendChild(modal);
      const form = modal.querySelector('#editForm') as HTMLFormElement;
      form.onsubmit = async (ev) => {
        ev.preventDefault();
        const formData = new FormData(form);
        const updatedUser = Object.fromEntries(formData.entries());
        try {
          const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
          });
          if (!res.ok) throw new Error('Ошибка сохранения');
          location.reload();
        } catch (err) {
          showError('user-action-error', 'Ошибка сохранения пользователя');
        }
      };
    });
  });
  container.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tr = (e.target as HTMLElement).closest('tr');
      const id = tr?.getAttribute('data-id');
      const newRole = prompt('Введите новую роль (admin/user):');
      if (!newRole) return;
      try {
        const res = await fetch(`/api/users/${id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });
        if (!res.ok) throw new Error('Ошибка смены роли');
        location.reload();
      } catch (err) {
        showError('user-action-error', 'Ошибка смены роли');
      }
    });
  });
  container.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tr = (e.target as HTMLElement).closest('tr');
      const id = tr?.getAttribute('data-id');
      const newStatus = prompt('Введите новый статус (active/pending/blocked):');
      if (!newStatus) return;
      try {
        const res = await fetch(`/api/users/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('Ошибка смены статуса');
        location.reload();
      } catch (err) {
        showError('user-action-error', 'Ошибка смены статуса');
      }
    });
  });
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tr = (e.target as HTMLElement).closest('tr');
      const id = tr?.getAttribute('data-id');
      if (!confirm('Удалить пользователя?')) return;
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Ошибка удаления');
        location.reload();
      } catch (err) {
        showError('user-action-error', 'Ошибка удаления пользователя');
      }
    });
  });

  function showError(id: string, msg: string) {
    const el = container.querySelector('#' + id) as HTMLElement;
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  return container;
}
