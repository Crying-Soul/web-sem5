import { getUsers } from '../api/users';
import type { User } from '../components/types';

export async function AdminPage(): Promise<string> {
  // Проверяем роль текущего пользователя (например, из localStorage)
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser || currentUser.role !== 'admin') {
    return `<div class="container mt-5 text-center"><h2 class="text-danger">Доступ запрещён</h2><p>Только администратор может просматривать эту страницу.</p></div>`;
  }

  const users: User[] = await getUsers();
  return `
    <div class="container mt-4">
      <h2 class="mb-4">Админ-панель пользователей</h2>
      <input type="text" class="form-control mb-3" id="searchUser" placeholder="Поиск по ФИО или email" oninput="window.filterAdminUsers(this.value)">
      <div class="row g-4" id="adminUserList">
        ${users.map((u: User) => `
          <div class="col-md-4 admin-user-card" data-name="${u.name.toLowerCase()}" data-email="${u.email.toLowerCase()}">
            <div class="card shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                  <img src="${u.photo}" class="rounded-circle me-3" width="60" height="60" alt="Фото"/>
                  <div>
                    <h5 class="card-title mb-0">${u.name}</h5>
                    <small class="text-muted">${u.email}</small>
                  </div>
                </div>
                <p><b>Дата рождения:</b> ${u.birthDate}</p>
                <div class="mb-2">
                  <b>Роль:</b>
                  <select class="form-select form-select-sm w-auto d-inline" data-id="${u.id}" data-field="role">
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Администратор</option>
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>Пользователь</option>
                  </select>
                </div>
                <div class="mb-2">
                  <b>Статус:</b>
                  <select class="form-select form-select-sm w-auto d-inline" data-id="${u.id}" data-field="status">
                    <option value="pending" ${u.status === 'pending' ? 'selected' : ''}>Не подтверждённый</option>
                    <option value="active" ${u.status === 'active' ? 'selected' : ''}>Активный</option>
                    <option value="blocked" ${u.status === 'blocked' ? 'selected' : ''}>Заблокированный</option>
                  </select>
                </div>
                <div class="d-flex gap-2 mt-3">
                  <button class="btn btn-outline-secondary btn-sm" data-id="${u.id}" data-action="edit">Редактировать</button>
                  <button class="btn btn-outline-danger btn-sm" data-id="${u.id}" data-action="delete">Удалить</button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <script>
      window.filterAdminUsers = function(query) {
        query = query.toLowerCase();
        document.querySelectorAll('.admin-user-card').forEach(card => {
          const name = card.getAttribute('data-name');
          const email = card.getAttribute('data-email');
          card.style.display = (name.includes(query) || email.includes(query)) ? '' : 'none';
        });
      };
    </script>
  `;
}
