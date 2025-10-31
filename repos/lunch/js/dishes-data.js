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
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load dishes');
    }
    const data = await response.json();

    // Normalize categories to match existing UI and logic
    return data.map((item) => ({
      id: item.id,
      keyword: item.keyword,
      name: item.name,
      price: item.price,
      category: CATEGORY_MAP[item.category] || item.category,
      count: item.count,
      image: item.image,
      kind: item.kind,
    }));
  }

  window.loadDishes = loadDishes;
})();
