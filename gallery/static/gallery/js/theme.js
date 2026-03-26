// Ищем кнопку (пробуем оба селектора, на случай если где-то используется старый)
const themeBtn = document.getElementById('themeToggleHeader') || document.getElementById('themeToggle');

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (themeBtn) themeBtn.textContent = isDark ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeBtn) themeBtn.textContent = '☀️';
    } else {
        if (themeBtn) themeBtn.textContent = '🌙';
    }
}

if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
    loadTheme();
}