// Render dishes into the three grids; handle selection and total cost
(function () {
  const CATEGORY_TO_GRID = {
    soup: 'soupsGrid',
    main_course: 'mainsGrid',
    salads: 'saladsGrid',
    beverages: 'beveragesGrid',
    desserts: 'dessertsGrid',
  };

  const categoryLabels = {
    soup: 'Суп',
    main_course: 'Главное блюдо',
    salads: 'Салат или стартер',
    beverages: 'Напиток',
    desserts: 'Десерт',
  };

  function sortDishesAlphabetically(dishes) {
    return [...dishes].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  function buildCard(dish) {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.setAttribute('data-dish', dish.keyword);
    item.innerHTML = `
      <img src="${dish.image}.jpg" alt="${dish.name}">
      <div class="menu-info">
        <p class="price">${dish.price}₽</p>
        <p class="name">${dish.name}</p>
        <p class="weight">${dish.count}</p>
        <button class="add-btn" type="button">Добавить</button>
      </div>
    `;
    return item;
  }

  function renderMenu() {
    const byCategory = DISHES.reduce((acc, d) => {
      if (!acc[d.category]) {
        acc[d.category] = [];
      }
      acc[d.category].push(d);
      return acc;
    }, {});

    Object.keys(CATEGORY_TO_GRID).forEach((cat) => {
      const grid = document.getElementById(CATEGORY_TO_GRID[cat]);
      if (!grid) return;

      grid.innerHTML = '';

      sortDishesAlphabetically(byCategory[cat] || []).forEach((dish) => {
        const card = buildCard(dish);
        grid.appendChild(card);
      });
    });
  }

  const selected = {
    soup: null,
    main_course: null,
    salads: null,
    beverages: null,
    desserts: null,
  };

  // Экспортируем объект selected в глобальную область видимости
  window.selected = selected;

  function updateSummaryVisibility() {
    const hasAny = Object.values(selected).some(Boolean);
    const nothing = document.getElementById('nothing-selected');
    const totalBlock = document.getElementById('order-total');

    nothing.style.display = hasAny ? 'none' : '';

    ['soup', 'main_course', 'salads', 'beverages', 'desserts'].forEach((cat) => {
      const holder = document.querySelector(`#selectedSummary [data-cat="${cat}"]`);
      if (!holder) return;
      holder.style.display = hasAny ? '' : 'none';
    });

    const total = Object.values(selected).reduce((sum, d) => sum + (d ? d.price : 0), 0);
    if (hasAny) {
      totalBlock.style.display = '';
      document.getElementById('orderTotalValue').textContent = String(total);
    } else {
      totalBlock.style.display = 'none';
    }
  }

  function writeSummary(cat, dish) {
    const line = document.getElementById(`summary-${cat}`);
    if (!line) return;
    if (dish) {
      line.textContent = `${dish.name} — ${dish.price}₽`;
    } else {
      if (cat === 'beverages') {
        line.textContent = 'Напиток не выбран';
      } else if (cat === 'desserts') {
        line.textContent = 'Десерт не выбран';
      } else {
        line.textContent = 'Блюдо не выбрано';
      }
    }
  }

  function handleGlobalClicks() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.menu-item');
      if (!card) return;
      const keyword = card.getAttribute('data-dish');
      const dish = DISHES.find((d) => d.keyword === keyword);
      if (!dish) return;

      selected[dish.category] = dish;
      writeSummary(dish.category, dish);
      updateSummaryVisibility();
    });
  }

  // Фильтрация блюд
  const activeFilters = {
    soup: null,
    main_course: null,
    salads: null,
    beverages: null,
    desserts: null,
  };

  function filterDishes(category, kind) {
    const grid = document.getElementById(CATEGORY_TO_GRID[category]);
    if (!grid) return;

    const dishes = DISHES.filter(dish => dish.category === category);
    let filteredDishes = dishes;

    if (kind) {
      filteredDishes = dishes.filter(dish => dish.kind === kind);
    }

    grid.innerHTML = '';
    sortDishesAlphabetically(filteredDishes).forEach((dish) => {
      const card = buildCard(dish);
      grid.appendChild(card);
    });
  }

  function handleFilterClicks() {
    document.addEventListener('click', (e) => {
      const filterBtn = e.target.closest('.filter-btn');
      if (!filterBtn) return;

      const kind = filterBtn.getAttribute('data-kind');
      const category = getCategoryFromFilterButton(filterBtn);
      
      if (!category) return;

      // Находим все фильтры для данной категории
      const filtersContainer = filterBtn.closest('.filters');
      const allFilters = filtersContainer.querySelectorAll('.filter-btn');
      allFilters.forEach(btn => btn.classList.remove('active'));

      if (activeFilters[category] === kind) {
        // Если кликнули по уже активной кнопке, снимаем фильтр
        activeFilters[category] = null;
        filterDishes(category, null);
      } else {
        // Активируем новый фильтр
        activeFilters[category] = kind;
        filterBtn.classList.add('active');
        filterDishes(category, kind);
      }
    });
  }

  function getCategoryFromFilterButton(filterBtn) {
    // Находим заголовок h2, который идет непосредственно перед фильтрами
    const filtersContainer = filterBtn.closest('.filters');
    const h2 = filtersContainer.previousElementSibling;
    
    if (!h2 || h2.tagName !== 'H2') {
      return null;
    }

    const text = h2.textContent.toLowerCase();
    
    if (text.includes('суп')) return 'soup';
    if (text.includes('главное блюдо')) return 'main_course';
    if (text.includes('салат') || text.includes('стартер')) return 'salads';
    if (text.includes('напиток')) return 'beverages';
    if (text.includes('десерт')) return 'desserts';
    
    return null;
  }

  function init() {
    if (!window.DISHES) return;
    renderMenu();
    handleGlobalClicks();
    handleFilterClicks();
    updateSummaryVisibility();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Система проверки заказа и уведомлений
(function() {
  // Определение возможных комбинаций ланча
  const VALID_LUNCH_COMBINATIONS = [
    ['soup', 'main_course', 'salads', 'beverages'], // Вариант 1
    ['soup', 'main_course', 'beverages'],           // Вариант 2
    ['soup', 'salads', 'beverages'],                // Вариант 3
    ['main_course', 'salads', 'beverages'],         // Вариант 4
    ['main_course', 'beverages']                    // Вариант 5
  ];

  // Типы уведомлений
  const NOTIFICATION_TYPES = {
    NOTHING_SELECTED: {
      title: 'Ничего не выбрано',
      message: 'Ничего не выбрано. Выберите блюда для заказа',
      icon: '../images/icons/soup.png'
    },
    MISSING_DRINK: {
      title: 'Выберите напиток',
      message: 'Выберите напиток',
      icon: '../images/icons/drink.png'
    },
    MISSING_MAIN_OR_SALAD: {
      title: 'Выберите главное блюдо/салат/стартер',
      message: 'Выберите главное блюдо/салат/стартер',
      icon: '../images/icons/main.png'
    },
    MISSING_SOUP_OR_MAIN: {
      title: 'Выберите суп или главное блюдо',
      message: 'Выберите суп или главное блюдо',
      icon: '../images/icons/soup.png'
    },
    MISSING_MAIN: {
      title: 'Выберите главное блюдо',
      message: 'Выберите главное блюдо',
      icon: '../images/icons/main.png'
    }
  };

  // Функция проверки состава заказа
  function validateOrder(selectedDishes) {
    const selectedCategories = Object.keys(selectedDishes).filter(cat => selectedDishes[cat] !== null);
    
    // Проверка на пустой заказ
    if (selectedCategories.length === 0) {
      return { valid: false, type: 'NOTHING_SELECTED' };
    }

    // Проверка на соответствие одному из валидных вариантов
    const isValidCombination = VALID_LUNCH_COMBINATIONS.some(combination => {
      return combination.every(category => selectedCategories.includes(category)) &&
             selectedCategories.every(category => combination.includes(category));
    });

    if (isValidCombination) {
      return { valid: true };
    }

    // Определение типа ошибки - проверяем по приоритету
    const hasSoup = selectedCategories.includes('soup');
    const hasMain = selectedCategories.includes('main_course');
    const hasSalad = selectedCategories.includes('salads');
    const hasDrink = selectedCategories.includes('beverages');

    // Если выбран только напиток или десерт без основного блюда
    if (hasDrink && !hasSoup && !hasMain && !hasSalad) {
      return { valid: false, type: 'MISSING_MAIN' };
    }

    // Если выбран салат без супа или главного блюда
    if (hasSalad && !hasSoup && !hasMain) {
      return { valid: false, type: 'MISSING_SOUP_OR_MAIN' };
    }

    // Если выбран суп без главного блюда или салата
    if (hasSoup && !hasMain && !hasSalad) {
      return { valid: false, type: 'MISSING_MAIN_OR_SALAD' };
    }

    // Если нет напитка
    if (!hasDrink) {
      return { valid: false, type: 'MISSING_DRINK' };
    }

    // Если есть все основные блюда, но комбинация не валидна
    if (hasSoup && hasMain && hasSalad && hasDrink) {
      return { valid: false, type: 'MISSING_MAIN' };
    }

    return { valid: false, type: 'MISSING_MAIN' };
  }

  // Функция создания уведомления
  function showNotification(type) {
    // Удаляем существующие уведомления
    const existingNotification = document.querySelector('.notification-overlay');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notificationData = NOTIFICATION_TYPES[type];
    
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    
    overlay.innerHTML = `
      <div class="notification">
        <div class="notification-icon">
          <img src="${notificationData.icon}" alt="${notificationData.title}">
        </div>
        <h3 class="notification-title">${notificationData.title}</h3>
        <p class="notification-message">${notificationData.message}</p>
        <button class="notification-button">Окей</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Обработчик закрытия уведомления
    const closeButton = overlay.querySelector('.notification-button');
    closeButton.addEventListener('click', () => {
      overlay.remove();
    });

    // Закрытие по клику на overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  // Функция обработки отправки формы
  function handleFormSubmit(e) {
    e.preventDefault();
    
    // Получаем текущие выбранные блюда из глобального объекта selected
    const currentSelected = window.selected || {};
    
    const validation = validateOrder(currentSelected);
    
    if (!validation.valid) {
      showNotification(validation.type);
      return false;
    }

    // Если заказ валиден, отправляем форму
    e.target.submit();
  }

  // Инициализация системы проверки
  function initOrderValidation() {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.addEventListener('submit', handleFormSubmit);
    }
  }

  // Экспорт функций для доступа из основного скрипта
  window.validateOrder = validateOrder;
  window.showNotification = showNotification;

  // Инициализация при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrderValidation);
  } else {
    initOrderValidation();
  }
})();
