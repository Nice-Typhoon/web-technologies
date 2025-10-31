// Orders page functionality: list, view, edit, delete
(function() {
  const API_BASE = 'https://edu.std-900.ist.mospolytech.ru';
  const API_PATH = '/labs/api/orders';
  const DISHES_API = '/labs/api/dishes';
  const modalRoot = () => document.getElementById('modalRoot') || document.body;

  // map id -> { name, price }
  let dishesMap = new Map();

  async function loadDishesMap() {
     try {
       const res = await fetch(`${API_BASE}${DISHES_API}`, { cache: 'no-store' });
       if (!res.ok) return;
       const arr = await res.json();
       if (!Array.isArray(arr)) return;
       dishesMap = new Map(arr.map(d => [d.id, { name: d.name, price: Number(d.price || 0) }]));
       // expose for debugging
       try { window.DISHES_MAP = dishesMap; } catch(_) {}
     } catch (err) {
       console.warn('Не удалось загрузить список блюд:', err);
     }
  }

  function getApiKey() {
    let key = localStorage.getItem('api_key');
    if (!key) {
      key = prompt('Введите ваш API Key (api_key) для доступа к заказам:');
      if (key) {
        try { localStorage.setItem('api_key', key); } catch(_) {}
      }
    }
    return key;
  }

  function showToast(text, timeout = 3000) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), timeout);
  }

  function formatDateTime(dt) {
    try {
      const d = new Date(dt);
      return d.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch(_) {
      return dt || '';
    }
  }

  function formatDeliveryTimeVal(val) {
    if (!val) return 'Как можно скорее (с 7:00 до 23:00)';
    // ожидаем формат типа "HH:MM" или "HH:MM:SS" — отрезаем секунды
    const m = String(val).trim();
    if (m.includes(':')) return m.split(':').slice(0,2).join(':');
    return m;
  }

  function buildComposition(order) {
    const names = [];
    // server may return nested objects (soup, main_course, etc) or ids only.
    const tryName = (field, idField) => {
      if (!order) return null;
      if (order[field] && typeof order[field] === 'object' && order[field].name) return order[field].name;
      if (order[idField]) {
        // try lookup in global DISHES if present
        const d = dishesMap.get(Number(order[idField]));
        if (d && d.name) return d.name;
        if (Array.isArray(window.DISHES)) {
          const found = window.DISHES.find(d => d.id === order[idField] || d.id === Number(order[idField]));
          if (found) return found.name;
        }
        // fallback to id if name not found
        return `#${order[idField]}`;
      }
      return null;
    };

    const s = tryName('soup', 'soup_id');
    const m = tryName('main_course', 'main_course_id');
    const salad = tryName('salad', 'salad_id') || tryName('salads', 'salad_id');
    const drink = tryName('drink', 'drink_id') || tryName('beverage', 'drink_id') || tryName('beverages', 'drink_id');
    const dessert = tryName('dessert', 'dessert_id');

    [s, m, salad, drink, dessert].forEach(n => { if (n) names.push(n); });
    return names.length ? names.join(', ') : '—';
  }

  function calcOrderPrice(order) {
    // Try to sum by dish ids using dishesMap; fallback to order.total/order.price or 0
    const ids = [
      order.soup_id,
      order.main_course_id,
      order.salad_id || order.salad_id, // keep as is
      order.drink_id,
      order.dessert_id
    ].filter(Boolean).map(id => Number(id));

    if (ids.length) {
      let sum = 0;
      ids.forEach(id => {
        const info = dishesMap.get(id);
        if (info && typeof info.price === 'number') sum += info.price;
      });
      if (sum > 0) return sum;
    }
    // fallback to explicit fields from server
    const num = Number(order.total || order.price || 0);
    return isNaN(num) ? 0 : num;
  }

  async function fetchOrders() {
    const apiKey = getApiKey();
    if (!apiKey) {
      showToast('API key не задан. Невозможно загрузить заказы.', 4000);
      return [];
    }
    const url = `${API_BASE}${API_PATH}?api_key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Ошибка ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      // sort by created_at desc
      data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      return data;
    } catch (err) {
      console.error('fetchOrders error', err);
      showToast('Ошибка при загрузке заказов: ' + (err.message || ''), 5000);
      return [];
    }
  }

  function clearModal() {
    const root = modalRoot();
    root.innerHTML = '';
  }

  function closeModal() {
    clearModal();
  }

  function createModal(title, bodyNode, footerNode) {
    clearModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeModal);

    const header = document.createElement('div');
    header.className = 'modal-header';
    const h = document.createElement('h3');
    h.textContent = title;
    header.appendChild(h);

    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof bodyNode === 'string') body.innerHTML = bodyNode;
    else if (bodyNode) body.appendChild(bodyNode);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    if (footerNode) footer.appendChild(footerNode);

    modal.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    modalRoot().appendChild(overlay);

    // close on overlay click
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    return { overlay, modal };
  }

  function showDetailModal(order) {
    const container = document.createElement('div');
    const created = document.createElement('p');
    created.innerHTML = `<strong>Дата:</strong> ${formatDateTime(order.created_at)}`;
    const items = document.createElement('p');
    items.innerHTML = `<strong>Состав:</strong> ${buildComposition(order)}`;
    const cost = document.createElement('p');
    cost.innerHTML = `<strong>Стоимость:</strong> ${calcOrderPrice(order)} ₽`;
    const delivery = document.createElement('p');
    if (order.delivery_type === 'by_time' && order.delivery_time) {
      delivery.innerHTML = `<strong>Время доставки:</strong> ${formatDeliveryTimeVal(order.delivery_time)}`;
    } else {
      delivery.innerHTML = `<strong>Время доставки:</strong> Как можно скорее (с 7:00 до 23:00)`;
    }
    const client = document.createElement('div');
    client.innerHTML = `<hr><p><strong>Получатель:</strong> ${order.full_name || '—'}</p>
      <p><strong>Телефон:</strong> ${order.phone || '—'}</p>
      <p><strong>Email:</strong> ${order.email || '—'}</p>
      <p><strong>Адрес доставки:</strong> ${order.delivery_address || '—'}</p>
      <p><strong>Комментарий:</strong> ${order.comment || '—'}</p>`;
    container.appendChild(created);
    container.appendChild(items);
    container.appendChild(cost);
    container.appendChild(delivery);
    container.appendChild(client);

    const ok = document.createElement('button');
    ok.className = 'btn-primary';
    ok.textContent = 'Ок';
    ok.addEventListener('click', closeModal);

    createModal('Информация о заказе', container, ok);
  }

  function buildEditForm(order) {
    const form = document.createElement('form');
    form.id = 'orderEditForm';
    form.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <label>ФИО<br><input name="full_name" required style="width:100%" value="${escapeInput(order.full_name||'')}"></label>
        </div>
        <div style="flex:1;min-width:220px">
          <label>Email<br><input name="email" type="email" required style="width:100%" value="${escapeInput(order.email||'')}"></label>
        </div>
        <div style="flex:1;min-width:220px">
          <label>Телефон<br><input name="phone" required style="width:100%" value="${escapeInput(order.phone||'')}"></label>
        </div>
      </div>
      <div style="margin-top:8px">
        <label>Адрес доставки<br><input name="delivery_address" required style="width:100%" value="${escapeInput(order.delivery_address||'')}"></label>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <label><input type="radio" name="delivery_type" value="now" ${order.delivery_type !== 'by_time' ? 'checked' : ''}> Как можно скорее</label>
        <label><input type="radio" name="delivery_type" value="by_time" ${order.delivery_type === 'by_time' ? 'checked' : ''}> По времени</label>
        <input type="time" name="delivery_time" value="${order.delivery_time ? formatDeliveryTimeVal(order.delivery_time) : ''}" style="margin-left:8px">
      </div>
      <div style="margin-top:8px">
        <label>Комментарий<br><textarea name="comment" style="width:100%">${escapeInput(order.comment||'')}</textarea></label>
      </div>
    `;
    return form;
  }

  function escapeInput(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function showEditModal(order, refreshCb) {
    const form = buildEditForm(order);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary';
    saveBtn.type = 'submit';
    saveBtn.textContent = 'Сохранить';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Отмена';
    cancelBtn.addEventListener('click', closeModal);

    const { overlay } = createModal('Редактирование заказа', form, (function() {
      const wrapper = document.createElement('div');
      wrapper.appendChild(cancelBtn);
      wrapper.appendChild(saveBtn);
      return wrapper;
    })());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const apiKey = getApiKey();
      if (!apiKey) { showToast('API key не найден'); return; }
      const data = new FormData(form);
      // build payload only with editable fields required by task
      const payload = {
        full_name: data.get('full_name'),
        email: data.get('email'),
        phone: data.get('phone'),
        delivery_address: data.get('delivery_address'),
        delivery_type: data.get('delivery_type'),
        comment: data.get('comment') || undefined
      };
      const deliveryType = data.get('delivery_type');
      const timeVal = data.get('delivery_time');
      if (deliveryType === 'by_time') {
        if (!timeVal) { showToast('Выберите время доставки'); return; }
        payload.delivery_time = timeVal;
      } else {
        payload.delivery_time = undefined;
      }

      // send PUT
      const url = `${API_BASE}${API_PATH}/${order.id}?api_key=${encodeURIComponent(apiKey)}`;
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text().catch(()=> '');
          throw new Error(text || `Ошибка ${res.status}`);
        }
        showToast('Заказ успешно изменён');
        closeModal();
        if (typeof refreshCb === 'function') refreshCb();
      } catch (err) {
        console.error('edit error', err);
        showToast('Ошибка при сохранении: ' + (err.message||''), 5000);
      }
    });
  }

  function showDeleteModal(order, refreshCb) {
    const p = document.createElement('p');
    p.innerHTML = `Вы действительно хотите удалить заказ от <strong>${formatDateTime(order.created_at)}</strong> (№ ${order.id})?`;

    const yes = document.createElement('button');
    yes.className = 'btn-primary';
    yes.textContent = 'Да';

    const no = document.createElement('button');
    no.className = 'btn-secondary';
    no.textContent = 'Отмена';
    no.addEventListener('click', closeModal);

    yes.addEventListener('click', async () => {
      const apiKey = getApiKey();
      if (!apiKey) { showToast('API key не найден'); return; }
      const url = `${API_BASE}${API_PATH}/${order.id}?api_key=${encodeURIComponent(apiKey)}`;
      try {
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) {
          const text = await res.text().catch(()=> '');
          throw new Error(text || `Ошибка ${res.status}`);
        }
        showToast('Заказ удалён');
        closeModal();
        if (typeof refreshCb === 'function') refreshCb();
      } catch (err) {
        console.error('delete error', err);
        showToast('Ошибка при удалении: ' + (err.message||''), 5000);
      }
    });

    createModal('Подтвердите удаление', p, (function() {
      const wrapper = document.createElement('div');
      wrapper.appendChild(no);
      wrapper.appendChild(yes);
      return wrapper;
    })());
  }

  function renderOrdersList(items) {
    const table = document.getElementById('ordersTable');
    const tbody = table ? table.querySelector('tbody') : null;
    const empty = document.getElementById('orders-empty');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!items || items.length === 0) {
      empty.style.display = '';
      table.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    table.style.display = '';

    items.forEach((order, idx) => {
      const tr = document.createElement('tr');
      const num = document.createElement('td');
      num.textContent = String(idx + 1);
      const dateTd = document.createElement('td');
      dateTd.textContent = formatDateTime(order.created_at);
      const compTd = document.createElement('td');
      compTd.textContent = buildComposition(order);
      const costTd = document.createElement('td');
      costTd.textContent = String(calcOrderPrice(order));
      const timeTd = document.createElement('td');
      if (order.delivery_type === 'by_time' && order.delivery_time) timeTd.textContent = formatDeliveryTimeVal(order.delivery_time);
      else timeTd.textContent = 'Как можно скорее (с 7:00 до 23:00)';
      const actionsTd = document.createElement('td');
      actionsTd.className = 'orders-actions';

      const viewBtn = document.createElement('button');
      viewBtn.title = 'Подробнее';
      viewBtn.textContent = 'Подробнее';
      viewBtn.addEventListener('click', () => showDetailModal(order));

      const editBtn = document.createElement('button');
      editBtn.title = 'Редактировать';
      editBtn.textContent = 'Редактировать';
      editBtn.addEventListener('click', () => showEditModal(order, reload));

      const delBtn = document.createElement('button');
      delBtn.title = 'Удалить';
      delBtn.textContent = 'Удалить';
      delBtn.addEventListener('click', () => showDeleteModal(order, reload));

      actionsTd.appendChild(viewBtn);
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(delBtn);

      tr.appendChild(num);
      tr.appendChild(dateTd);
      tr.appendChild(compTd);
      tr.appendChild(costTd);
      tr.appendChild(timeTd);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
  }

  async function reload() {
    await loadDishesMap();
    const orders = await fetchOrders();
    renderOrdersList(orders);
  }

  // init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reload);
  } else {
    reload();
  }

  // expose small API for testing
  window.ordersReload = reload;
})();
