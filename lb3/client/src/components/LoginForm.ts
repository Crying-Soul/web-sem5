export function renderLoginForm(onLoginSuccess: (user: any, token: string) => void): HTMLElement {
  // Получаем HTML из скомпилированного Pug-шаблона
  const container = document.createElement('div');
  fetch('/src/templates/login.pug')
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;
      const form = container.querySelector('#loginForm') as HTMLFormElement;
      form.onsubmit = async (e) => {
        e.preventDefault();
        const email = (form.querySelector('#email') as HTMLInputElement).value;
        const password = (form.querySelector('#password') as HTMLInputElement).value;
        const errorDiv = form.querySelector('#login-error') as HTMLElement;
        errorDiv.style.display = 'none';
        try {
          const res = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) {
            errorDiv.textContent = data.error || 'Ошибка входа';
            errorDiv.style.display = 'block';
            return;
          }
          onLoginSuccess(data.user, data.token);
        } catch (err) {
          errorDiv.textContent = 'Ошибка сервера';
          errorDiv.style.display = 'block';
        }
      };
    });
  return container;
}
