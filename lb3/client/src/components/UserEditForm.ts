import { User } from './types.js';
import { updateUser } from '../api/users';

export function UserEditForm(user: User): string {
  return `
    <form id="editForm" class="mb-3">
      <input type="hidden" name="id" value="${user.id}" />
      <div class="mb-2">
        <label>ФИО</label>
        <input type="text" name="name" value="${user.name}" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Email</label>
        <input type="email" name="email" value="${user.email}" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Дата рождения</label>
        <input type="date" name="birthDate" value="${user.birthDate}" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Роль</label>
        <select name="role" class="form-select">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
        </select>
      </div>
      <div class="mb-2">
        <label>Статус</label>
        <select name="status" class="form-select">
          <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Не подтверждённый</option>
          <option value="active" ${user.status === 'active' ? 'selected' : ''}>Активный</option>
          <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Заблокированный</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Сохранить</button>
    </form>
  `;
}
