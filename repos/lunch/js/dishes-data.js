// Load dishes from API and normalize to local schema
(function() {
  const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api/dishes';

  const CATEGORY_MAP = {
    'soup': 'soup',
    'main-course': 'main_course',
    'salad': 'salads',
    'drink': 'beverages',
    'dessert': 'desserts',
  };

  async function loadDishes() {
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (!response.ok) {
        console.error('dishes-data: fetch failed', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      const normalized = (Array.isArray(data) ? data : []).map((item) => ({
        id: item.id,
        keyword: item.keyword,
        name: item.name,
        price: item.price,
        category: CATEGORY_MAP[item.category] || item.category,
        count: item.count,
        image: item.image,
        kind: item.kind,
      }));
      // Сохраняем в global для удобства отладки
      try { window.DISHES = normalized; } catch (_) {}
      return normalized;
    } catch (err) {
      console.error('dishes-data: unexpected error when loading dishes', err);
      return [];
    }
   }

  window.loadDishes = loadDishes;
})();
