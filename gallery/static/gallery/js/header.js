// Фиксированный хедер — добавляем класс при скролле
const header = document.getElementById('mainHeader');

function handleScroll() {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleScroll);
handleScroll(); // Запускаем сразу, чтобы проверить начальное состояние

// Бургер-меню для мобильных устройств
const burgerMenu = document.getElementById('burgerMenu');
const navMenu = document.getElementById('navMenu');

if (burgerMenu && navMenu) {
    burgerMenu.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        // Анимация бургера (опционально)
        this.classList.toggle('active');
    });
    
    // Закрываем меню при клике на ссылку
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (burgerMenu) burgerMenu.classList.remove('active');
        });
    });
}

// Закрываем меню при клике вне его (на мобилке)
document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768) {
        if (!navMenu.contains(event.target) && !burgerMenu.contains(event.target)) {
            navMenu.classList.remove('active');
            if (burgerMenu) burgerMenu.classList.remove('active');
        }
    }
});

// Синхронизация кнопки переключения темы
// (у нас есть theme.js, который управляет themeToggle)
// Нужно синхронизировать новую кнопку с существующей логикой

const themeToggleHeader = document.getElementById('themeToggleHeader');
const originalThemeToggle = document.getElementById('themeToggle');

if (themeToggleHeader && originalThemeToggle) {
    // Копируем текст (иконку) из оригинальной кнопки
    themeToggleHeader.textContent = originalThemeToggle.textContent;
    
    // Вешаем тот же обработчик
    themeToggleHeader.addEventListener('click', () => {
        originalThemeToggle.click();
    });
    
    // Следим за изменением иконки (если theme.js обновляет текст)
    const observer = new MutationObserver(() => {
        themeToggleHeader.textContent = originalThemeToggle.textContent;
    });
    observer.observe(originalThemeToggle, { attributes: true, childList: true, subtree: true });
}