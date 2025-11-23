export function HomePage(): string {
  return `
    <div class="bg-gradient" style="min-height:100vh;background:linear-gradient(120deg,#f8fafc 0%,#e0e7ff 100%);display:flex;align-items:center;justify-content:center;">
      <div class="card shadow-lg p-4" style="max-width:400px;width:100%;animation:fadeIn 1s;">
        <div class="text-center mb-4">
          <img src="https://cdn-icons-png.flaticon.com/512/1946/1946429.png" width="64" alt="logo" class="mb-2"/>
          <h2 class="fw-bold">Регистрация</h2>
          <p class="text-muted">Создайте аккаунт, чтобы начать пользоваться социальной сетью</p>
        </div>
        <div id="registerFormContainer"></div>
        <div class="mt-4 text-center">
          <a href="#users" class="btn btn-outline-primary me-2">Список пользователей</a>
          <a href="#news" class="btn btn-outline-info">Лента новостей</a>
        </div>
      </div>
    </div>
    <style>
      @keyframes fadeIn { from { opacity:0; transform:translateY(30px);} to { opacity:1; transform:none;}}
    </style>
  `;
}
