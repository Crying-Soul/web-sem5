export function renderRegisterForm(onRegisterSuccess: (user: any) => void): HTMLElement {
  // Получаем HTML из скомпилированного Pug-шаблона
  const container = document.createElement('div');
  fetch('/src/templates/register.pug')
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;
      const form = container.querySelector('#registerForm') as HTMLFormElement;
      form.onsubmit = async (e) => {
        e.preventDefault();
        const fullName = (form.querySelector('#fullName') as HTMLInputElement).value;
        const birthDate = (form.querySelector('#birthDate') as HTMLInputElement).value;
        const email = (form.querySelector('#email') as HTMLInputElement).value;
        const photo = (form.querySelector('#photo') as HTMLInputElement).value;
        const password = (form.querySelector('#password') as HTMLInputElement).value;
        const errorDiv = form.querySelector('#register-error') as HTMLElement;
        errorDiv.style.display = 'none';
        try {
          const res = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, birthDate, email, photo, password })
          });
          const data = await res.json();
          if (!res.ok) {
            errorDiv.textContent = data.error || 'Ошибка регистрации';
            errorDiv.style.display = 'block';
            return;
          }
          onRegisterSuccess(data);
        } catch (err) {
          errorDiv.textContent = 'Ошибка сервера';
          errorDiv.style.display = 'block';
        }
      };
    });
  return container;
}
