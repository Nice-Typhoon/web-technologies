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

  const CATEGORY_KEYS = ['soup', 'main_course', 'salads', 'beverages', 'desserts'];

  const STORAGE_KEY = 'orderSelection';

  function loadSelectionFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveSelectionToStorage(selectionObj) {
    const idsOnly = {};
    CATEGORY_KEYS.forEach((cat) => {
      const dish = selectionObj[cat];
      if (dish && (dish.id || dish.keyword)) {
        idsOnly[cat] = dish.id ?? dish.keyword;
      } else {
        idsOnly[cat] = null;
      }
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idsOnly));
    } catch (_) {}
  }

  function sortDishesAlphabetically(dishes) {
    return [...dishes].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  function getImageFallbacks(src) {
    const hasProtocol = /^https?:\/\//.test(src);
    const hasExt = /\.(jpg|jpeg|png|webp)$/i.test(src);
    if (!hasProtocol) {
      const base = src.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      return [
        `${base}.jpg`,
        `${base}.jpeg`,
        `${base}.png`,
        base,
      ];
    }
    if (hasExt) {
      return [src];
    }
    return [
      src,
      `${src}.jpg`,
      `${src}.jpeg`,
      `${src}.png`,
    ];
  }

  function buildCard(dish) {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.setAttribute('data-dish', dish.keyword);
    const fallbacks = getImageFallbacks(dish.image);
    const initialSrc = fallbacks[0];
    item.innerHTML = `
      <img alt="${dish.name}">
      <div class="menu-info">
        <p class="price">${dish.price}₽</p>
        <p class="name">${dish.name}</p>
        <p class="weight">${dish.count}</p>
        <button class="add-btn" type="button">Добавить</button>
      </div>
    `;
    const img = item.querySelector('img');
    img.referrerPolicy = 'no-referrer';
    img.loading = 'lazy';
    img.src = initialSrc;
    img.dataset.fallbackIndex = '0';
    img.addEventListener('error', () => {
      const idx = parseInt(img.dataset.fallbackIndex || '0', 10);
      const next = idx + 1;
      if (next < fallbacks.length) {
        img.dataset.fallbackIndex = String(next);
        img.src = fallbacks[next];
      }
    });
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

    CATEGORY_KEYS.forEach((cat) => {
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

    updateStickyPanel(total, hasAny);
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
      saveSelectionToStorage(selected);
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
    const start = (dishes) => {
      window.DISHES = dishes;
      restoreSelection(dishes);
      renderMenu();
      handleGlobalClicks();
      handleFilterClicks();
      updateSummaryVisibility();
      renderOrderPageItems();
    };

    if (Array.isArray(window.DISHES) && window.DISHES.length) {
      start(window.DISHES);
      return;
    }

    if (typeof window.loadDishes === 'function') {
      window.loadDishes()
        .then((d) => start(d))
        .catch((err) => {
          console.error(err);
        });
    }
  }

  function restoreSelection(dishes) {
    const stored = loadSelectionFromStorage();
    CATEGORY_KEYS.forEach((cat) => {
      const idOrKeyword = stored[cat];
      if (idOrKeyword == null) return;
      const dish = dishes.find((d) => d.id === idOrKeyword || d.keyword === idOrKeyword);
      if (dish) {
        selected[cat] = dish;
        writeSummary(cat, dish);
      }
    });
  }

  // Sticky checkout panel on set-lunch page
  function updateStickyPanel(total, hasAny) {
    const panel = document.getElementById('checkoutPanel');
    if (!panel) return;
    const totalSpan = panel.querySelector('#checkoutTotal');
    const link = panel.querySelector('#goToCheckout');
    totalSpan.textContent = String(total);
    panel.style.display = hasAny ? '' : 'none';

    const validation = window.validateOrder ? window.validateOrder(selected) : { valid: !!hasAny };
    if (validation.valid) {
      link.removeAttribute('aria-disabled');
      link.classList.remove('disabled');
    } else {
      link.setAttribute('aria-disabled', 'true');
      link.classList.add('disabled');
    }
  }

  // Render selected items with delete on order page
  function renderOrderPageItems() {
    const grid = document.getElementById('orderItemsGrid');
    const emptyText = document.getElementById('orderItemsEmpty');
    if (!grid) return;

    grid.innerHTML = '';
    const chosen = CATEGORY_KEYS.map((c) => selected[c]).filter(Boolean);
    if (chosen.length === 0) {
      if (emptyText) emptyText.style.display = '';
      return;
    }
    if (emptyText) emptyText.style.display = 'none';

    chosen.forEach((dish) => {
      const card = buildCard(dish);
      const btn = card.querySelector('.add-btn');
      if (btn) {
        btn.textContent = 'Удалить';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selected[dish.category] = null;
          saveSelectionToStorage(selected);
          card.remove();
          writeSummary(dish.category, null);
          updateSummaryVisibility();
          renderOrderPageItems();
        });
      }
      grid.appendChild(card);
    });
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
  // Построение payload для заказа
  function buildOrderPayload(form, selectedDishes) {
    const get = (id) => form.querySelector(`#${id}`);
    const fullName = get('name') ? get('name').value.trim() : '';
    const email = get('email') ? get('email').value.trim() : '';
    const subscribe = get('newsletter') ? get('newsletter').checked : false;
    const phone = get('phone') ? get('phone').value.trim() : '';
    const deliveryAddress = get('address') ? get('address').value.trim() : '';
    const comments = get('comments') ? get('comments').value.trim() : '';
    const asap = get('delivery_asap') && get('delivery_asap').checked;
    const scheduled = get('delivery_scheduled') && get('delivery_scheduled').checked;
    const time = get('delivery_time_input') ? get('delivery_time_input').value : '';

    const payload = {
      full_name: fullName,
      email,
      subscribe: subscribe ? 1 : 0,
      phone,
      delivery_address: deliveryAddress,
      delivery_type: asap ? 'now' : (scheduled ? 'by_time' : 'now'),
      delivery_time: scheduled ? time : undefined,
      comment: comments || undefined,
      soup_id: selectedDishes.soup ? selectedDishes.soup.id : undefined,
      main_course_id: selectedDishes.main_course ? selectedDishes.main_course.id : undefined,
      salad_id: selectedDishes.salads ? selectedDishes.salads.id : undefined,
      drink_id: selectedDishes.beverages ? selectedDishes.beverages.id : undefined,
      dessert_id: selectedDishes.desserts ? selectedDishes.desserts.id : undefined,
    };

    return payload;
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

    // Если заказ валиден, отправляем запрос на API
    const form = e.target;
    const apiBase = 'https://edu.std-900.ist.mospolytech.ru';
    let apiKey = localStorage.getItem('api_key') || '';
    if (!apiKey) {
      try {
        const k = window.prompt('Введите ваш API Key для оформления заказа');
        if (k) {
          apiKey = k.trim();
          localStorage.setItem('api_key', apiKey);
        }
      } catch (_) {}
    }
    if (!apiKey) {
      alert('API Key не указан. Невозможно отправить заказ.');
      return false;
    }

    const payload = buildOrderPayload(form, currentSelected);
    const url = `${apiBase}/labs/api/orders?api_key=${encodeURIComponent(apiKey)}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Ошибка при создании заказа');
      }
      return res.json();
    })
    .then(() => {
      // Успех: очищаем выбранные блюда и перенаправляем/уведомляем
      try { localStorage.removeItem('orderSelection'); } catch (_) {}
      alert('Заказ успешно создан!');
      window.location.href = 'index.html';
    })
    .catch((err) => {
      console.error(err);
      alert('Не удалось оформить заказ: ' + err.message);
    });
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
  window.buildOrderPayload = buildOrderPayload;

  // Инициализация при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrderValidation);
  } else {
    initOrderValidation();
  }
})();

