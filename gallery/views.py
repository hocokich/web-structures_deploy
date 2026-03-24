import base64
from django.core.files.base import ContentFile # Обертка для сохранения файлов
from django.shortcuts import render, redirect # Добавляем redirect
from django.db.models import Q # Импортируем Q-object для сложного поиска

from django.core.paginator import Paginator # Вместо того чтобы отдавать все модели, мы будем отдавать только кусочек.
from django.contrib import messages

from .models import Asset
from .forms import AssetForm # Импортируем нашу новую форму

def upload(request):
    if request.method == 'POST':
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            # 1. Создаем объект, но пока НЕ сохраняем в базу (commit=False)
            new_asset = form.save(commit=False)

            # 2. Обрабатываем картинку из скрытого поля
            image_data = request.POST.get('image_data') # Получаем строку Base64

            if image_data:
                # Формат строки: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                # Нам нужно отрезать заголовок "data:image/jpeg;base64,"
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1] # получаем "jpeg"

                # Декодируем текст в байты
                data = base64.b64decode(imgstr)

                # Создаем имя файла (берем имя модели + .jpg)
                file_name = f"{new_asset.title}_thumb.{ext}"

                # Сохраняем байты в поле image
                # ContentFile превращает байты в объект, который понимает Django FileField
                new_asset.image.save(file_name, ContentFile(data), save=False)

            # 3. Финальное сохранение в БД
            new_asset.save()

            # ДОБАВЛЯЕМ СООБЩЕНИЕ
            messages.success(request, f'Модель "{new_asset.title}" успешно загружена!')
            
            return redirect('home')
    else:
        form = AssetForm()

    return render(request, 'gallery/upload.html', {'form': form})

def about(request):
    context_data = {
    #'page_title': 'О нас',
    }
    # Мы пока не используем HTML-шаблоны, просто вернем строку.
    #return HttpResponse("<h1>Курс Web Структуры</h1><p>Здесь мы делаем сайт типо Scetchfab.</p>")
    return render(request, 'gallery/about.html', context_data)

# request — это "письмо" от браузера с данными о пользователе
def home(request):
    # 1. Получаем параметры из URL (GET-запроса)
    # Если параметра нет, вернет None (или пустую строку, если мы так настроили)
    search_query = request.GET.get('q', '')
    ordering = request.GET.get('ordering', 'new') # По умолчанию 'new'

    # 2. Базовый запрос: Берем ВСЕ
    assets = Asset.objects.all()

    # 3. Применяем поиск (если пользователь что-то ввел)
    if search_query:
        # icontains = Case Insensitive Contains (содержит, без учета регистра)
        # Если бы у нас было поле 'description', мы бы использовали Q:
        # assets = assets.filter(Q(title__icontains=search_query) | Q(description__icontains=search_query))
        assets = assets.filter(title__icontains=search_query)

    # 4. Применяем сортировку
    if ordering == 'old':
        assets = assets.order_by('created_at') # От старых к новым
    elif ordering == 'name':
        assets = assets.order_by('title') # По алфавиту
    else:
        # По умолчанию (new) - свежие сверху
        assets = assets.order_by('-created_at')

    # --- ПАГИНАЦИЯ (Новый код) ---
    # Режем список по 8 штук на страницу (для теста, чтобы быстрее увидеть кнопки)
    paginator = Paginator(assets, 9)
    # Получаем номер страницы из URL (например, ?page=2)
    page_number = request.GET.get('page')
    # Получаем конкретный кусочек данных (объект Page)
    page_obj = paginator.get_page(page_number)

    # 5. Отдаем результат
    context_data = {
        'page_title': 'Главная Галерея',
        'page_obj': page_obj,
    }

    return render(request, 'gallery/index.html', context_data)