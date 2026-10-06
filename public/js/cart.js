/* Cart stored in localStorage. Lines are keyed by item + selected options. */
(function () {
  const KEY = 'mcdo.cart';

  function optionKey(options) {
    return (options || [])
      .map((option) => Number(option.id))
      .sort((a, b) => a - b)
      .join(',');
  }

  function lineKey(itemId, options) {
    return `${itemId}|${optionKey(options)}`;
  }

  function optionDelta(options) {
    return (options || []).reduce((sum, option) => sum + Number(option.delta || 0), 0);
  }

  function lineUnit(line) {
    return Number(line.price) + optionDelta(line.options);
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: items }));
  }

  function add(item) {
    const items = read();
    const key = lineKey(item.id, item.options);
    const existing = items.find((line) => line.key === key);
    if (existing) {
      existing.qty = Math.min(50, existing.qty + (item.qty || 1));
    } else {
      items.push({
        key,
        id: item.id,
        name: item.name,
        price: item.price,
        icon: item.icon,
        image: item.image,
        options: item.options || [],
        qty: item.qty || 1
      });
    }
    write(items);
  }

  function setQty(key, qty) {
    let items = read();
    if (qty <= 0) items = items.filter((line) => line.key !== key);
    else {
      const line = items.find((entry) => entry.key === key);
      if (line) line.qty = Math.min(50, qty);
    }
    write(items);
  }

  function remove(key) {
    write(read().filter((line) => line.key !== key));
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().reduce((sum, line) => sum + line.qty, 0);
  }

  function subtotal() {
    return read().reduce((sum, line) => sum + lineUnit(line) * line.qty, 0);
  }

  function detailed() {
    return read().map((line) => ({ ...line, unit: lineUnit(line), lineTotal: lineUnit(line) * line.qty }));
  }

  window.Cart = { read, add, setQty, remove, clear, count, subtotal, detailed, lineUnit };
})();
