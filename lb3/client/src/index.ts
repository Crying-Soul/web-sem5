import { HomePage } from './pages/HomePage';
import { UsersPage } from './pages/UsersPage';
import { FriendsPage } from './pages/FriendsPage';
import { NewsFeedPage } from './pages/NewsFeedPage';
import { renderRegisterForm } from './components/RegisterForm';
import { AdminPage } from './pages/AdminPage';
import { renderLoginForm } from './components/LoginForm';
import type { User } from './components/types';

interface RouteHandler {
  [key: string]: () => Promise<HTMLElement | string>;
}

class AppRouter {
  private currentUser: User | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.loadCurrentUser();
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }

  private loadCurrentUser(): void {
    try {
      const userData = localStorage.getItem('currentUser');
      this.currentUser = userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error loading current user:', error);
      this.currentUser = null;
    }
  }

  private async handleRouting(): Promise<HTMLElement | string> {
    const hash = window.location.hash.replace('#', '');
    
    // Redirect to login if not authenticated
    if (!this.currentUser && hash !== 'register') {
      return this.renderLoginPage();
    }

    const routes: RouteHandler = {
      '': () => Promise.resolve(HomePage()),
      'register': () => Promise.resolve(HomePage()),
      'admin': () => AdminPage(),
      'users': () => UsersPage(),
      'friends': () => FriendsPage(this.currentUser?.id || ''),
      'news': () => NewsFeedPage(this.currentUser?.id || '')
    };

    return routes[hash]?.() || Promise.resolve(HomePage());
  }

  private renderLoginPage(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'd-flex justify-content-center align-items-center min-vh-100 bg-light';
    container.appendChild(renderLoginForm(this.handleLogin.bind(this)));
    return container;
  }

  private async handleLogin(email: string): Promise<void> {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      
      const users: User[] = await res.json();
      const user = users.find((u: User) => u.email === email);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
        window.location.hash = 'users';
        this.render();
      } else {
        alert('Пользователь не найден!');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Ошибка при входе в систему');
    }
  }

  public async render(): Promise<void> {
    try {
      this.loadCurrentUser();
      const page = await this.handleRouting();
      
      document.body.innerHTML = '';
      
      if (typeof page === 'string') {
        document.body.innerHTML = page;
        this.injectDynamicElements();
      } else {
        document.body.appendChild(page);
      }
      
      this.setupAdminEvents();
    } catch (error) {
      console.error('Render error:', error);
      document.body.innerHTML = '<div class="container mt-5 text-center"><h2>Ошибка загрузки</h2></div>';
    }
  }

  private injectDynamicElements(): void {
    // Inject register form
    const hash = window.location.hash.replace('#', '');
    if (!hash || hash === '' || hash === 'register') {
      const container = document.getElementById('registerFormContainer');
      if (container) {
        container.appendChild(renderRegisterForm(this.handleRegister.bind(this)));
      }
    }

    // Inject admin button for admins
    if (this.currentUser?.role === 'admin') {
      const adminBtn = document.createElement('a');
      adminBtn.href = '#admin';
      adminBtn.className = 'btn btn-dark w-100 mt-3';
      adminBtn.textContent = 'Админ-панель';
      document.querySelector('.card .mt-4')?.appendChild(adminBtn);
    }

    // Inject logout button
    if (this.currentUser) {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn btn-outline-danger w-100 mt-3';
      logoutBtn.textContent = 'Выйти';
      logoutBtn.onclick = this.handleLogout.bind(this);
      document.querySelector('.card .mt-4')?.appendChild(logoutBtn);
    }
  }

  private async handleRegister(userData: Omit<User, 'id' | 'role' | 'status'>): Promise<void> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          role: 'user',
          status: 'pending'
        })
      });
      
      if (!res.ok) throw new Error('Registration failed');
      
      const created: User = await res.json();
      localStorage.setItem('currentUser', JSON.stringify(created));
      this.currentUser = created;
      window.location.hash = 'users';
    } catch (error) {
      console.error('Registration error:', error);
      alert('Ошибка при регистрации');
    }
  }

  private handleLogout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    window.location.hash = '';
    this.render();
  }

  private setupAdminEvents(): void {
    document.addEventListener('click', this.handleAdminClick.bind(this));
    document.addEventListener('change', this.handleAdminChange.bind(this));
  }

  private async handleAdminClick(e: Event): Promise<void> {
    const target = e.target as HTMLElement;
    
    if (target.matches('button[data-action="edit"]')) {
      await this.handleEditUser(target);
    }
    
    if (target.matches('button[data-action="delete"]')) {
      await this.handleDeleteUser(target);
    }
  }

  private async handleAdminChange(e: Event): Promise<void> {
    const target = e.target as HTMLSelectElement;
    
    if (target.matches('select[data-field]')) {
      await this.handleUserFieldUpdate(target);
    }
  }

  private async handleEditUser(button: HTMLElement): Promise<void> {
    const id = button.getAttribute('data-id');
    const card = button.closest('.admin-user-card');
    
    if (!id || !card) return;

    const name = prompt('Новое ФИО:', card.querySelector('.card-title')?.textContent || '');
    const email = prompt('Новый email:', card.querySelector('.text-muted')?.textContent || '');
    const birthDate = prompt('Новая дата рождения:', card.querySelector('p')?.textContent?.replace(/[^\d\-]/g, '') || '');

    if (name && email && birthDate) {
      await this.updateUserData(id, { name, email, birthDate });
    }
  }

  private async handleDeleteUser(button: HTMLElement): Promise<void> {
    const id = button.getAttribute('data-id');
    if (id && confirm('Удалить пользователя?')) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      this.render();
    }
  }

  private async handleUserFieldUpdate(select: HTMLSelectElement): Promise<void> {
    const id = select.getAttribute('data-id');
    const field = select.getAttribute('data-field');
    const value = select.value;

    if (id && field) {
      await this.updateUserData(id, { [field]: value });
    }
  }

  private async updateUserData(userId: string, data: Partial<User>): Promise<void> {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Update failed');
      this.render();
    } catch (error) {
      console.error('Update error:', error);
      alert('Ошибка при обновлении данных');
    }
  }
}

// Initialize app
new AppRouter();