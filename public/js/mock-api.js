/* Offline backend: mirrors the Express API against localStorage so the
   single-file build runs with no server. */
(function () {
  const DB_KEY = 'mcdo.db';
  const SESSION_KEY = 'mcdo.session';
  const EVENTS_KEY = 'mcdo.events';
  const VAT_RATE = 0.12;
  const SENIOR_RATE = 0.2;
  const BLOCK = 100;
  const VALUE = 10;

  const seed = window.SEED;
  const bcrypt = window.bcrypt || (window.dcodeIO && window.dcodeIO.bcrypt);

  const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

  function now() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function emptyDb() {
    return { users: [], menu: [], orders: [], events: [], seq: { user: 0, menu: 0, option: 0, order: 0, item: 0, event: 0 } };
  }

  function seedDb() {
    const db = emptyDb();
    let orderSeq = 1000;
    const demoOrders = [];

    seed.USERS.forEach((user) => {
      db.seq.user += 1;
      db.users.push({
        id: db.seq.user,
        name: user.name,
        email: user.email,
        password_hash: bcrypt.hashSync(user.password, 10),
        role: user.role,
        points: user.points,
        created_at: now()
      });
    });

    seed.MENU.forEach((item, index) => {
      db.seq.menu += 1;
      const groups = (seed.CATEGORY_OPTIONS[item.category] || []).map((key) => {
        const template = seed.OPTION_TEMPLATES[key];
        return {
          id: (db.seq.option += 1),
          name: template.name,
          type: template.type,
          required: Boolean(template.required),
          options: template.options.map((option) => ({
            id: (db.seq.option += 1),
            name: option.name,
            delta: option.delta,
            is_default: Boolean(option.is_default)
          }))
        };
      });
      db.menu.push({
        id: db.seq.menu,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        icon: item.icon,
        badge: item.badge,
        image: item.image || `/img/menu/${slugify(item.name)}.jpg`,
        available: 1,
        sort_order: index,
        options: groups
      });
    });

    const customer = db.users.find((user) => user.role === 'user');
    seed.DEMO_ORDERS.forEach((demo, index) => {
      orderSeq += 1;
      const items = demo.items
        .map((name) => db.menu.find((item) => item.name === name))
        .filter(Boolean)
        .map((item) => {
          db.seq.item += 1;
          return { id: db.seq.item, menu_item_id: item.id, name: item.name, unit_price: item.price, qty: 1, line_total: item.price, options: [] };
        });
      const totals = computeOrder(items.map((item) => ({ price: item.unit_price, qty: item.qty, options: [] })), 0, 0, 0);
      db.seq.order += 1;
      const flow = seed.STATUS_FLOW;
      const upto = flow.indexOf(demo.status);
      demoOrders.push({
        id: db.seq.order,
        code: `MC-${orderSeq}`,
        user_id: customer.id,
        subtotal: totals.subtotal,
        discount: 0,
        senior_discount: 0,
        vat_amount: totals.vatAmount,
        vatable_sales: totals.vatableSales,
        vat_exempt_sales: 0,
        senior_pwd_count: 0,
        points_redeemed: 0,
        points_earned: totals.pointsEarned,
        total: totals.total,
        order_type: 'dine-in',
        payment_method: 'cash',
        payment_status: 'paid',
        status: demo.status,
        created_at: now(),
        updated_at: now(),
        items,
        events: flow.slice(0, upto + 1).map((status) => ({ status, note: seed.STATUS_NOTES[status], created_at: now() }))
      });
    });
    db.orders = demoOrders.reverse();
    return db;
  }

  function computeOrder(lines, availablePoints, redeemPoints, seniorPwdCount) {
    const priced = lines.map((line) => {
      const delta = (line.options || []).reduce((sum, option) => sum + Number(option.delta || 0), 0);
      const unit = round2(Number(line.price) + delta);
      const qty = Math.max(1, Math.floor(Number(line.qty) || 1));
      return { unit, qty, lineTotal: round2(unit * qty) };
    });
    const subtotal = round2(priced.reduce((sum, line) => sum + line.lineTotal, 0));
    const net = round2(subtotal / (1 + VAT_RATE));
    let vatableSales = 0;
    let vatAmount = 0;
    let vatExemptSales = 0;
    let seniorDiscount = 0;
    let afterSenior = subtotal;
    if (seniorPwdCount > 0) {
      vatExemptSales = net;
      seniorDiscount = round2(net * SENIOR_RATE);
      afterSenior = round2(net - seniorDiscount);
    } else {
      vatableSales = net;
      vatAmount = round2(subtotal - net);
    }
    const maxRedeemable = Math.max(0, Math.min(Math.floor(availablePoints / BLOCK) * BLOCK, Math.floor(afterSenior / VALUE) * BLOCK));
    let redeem = redeemPoints - (redeemPoints % BLOCK);
    if (redeem > maxRedeemable) redeem = Math.max(0, maxRedeemable);
    const pointsDiscount = round2((redeem / BLOCK) * VALUE);
    const total = round2(Math.max(0, afterSenior - pointsDiscount));
    return { lines: priced, subtotal, vatableSales, vatAmount, vatExemptSales, seniorDiscount, maxRedeemable, redeem, pointsDiscount, total, pointsEarned: Math.floor(total) };
  }

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      /* ignore */
    }
    const fresh = seedDb();
    save(fresh);
    return fresh;
  }

  function save(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (err) {
      /* ignore quota errors */
    }
  }

  function emit(db, type, payload) {
    db.events = db.events || [];
    db.events.push({ type, payload: payload || {}, at: now() });
    if (db.events.length > 100) db.events = db.events.slice(-100);
    try {
      localStorage.setItem(EVENTS_KEY, String(Date.now()));
    } catch (err) {
      /* ignore */
    }
  }

  function currentUser(db) {
    const id = Number(localStorage.getItem(SESSION_KEY) || 0);
    return db.users.find((user) => user.id === id) || null;
  }

  function publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: (seed.ROLE_LABELS || {})[user.role] || user.role,
      points: user.points
    };
  }

  function loadOrder(db, id, user) {
    const order = db.orders.find((entry) => entry.id === Number(id));
    if (!order) return null;
    if (user && user.role === 'user' && order.user_id !== user.id) return null;
    return order;
  }

  function fail(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }

  function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body || {};
    const db = load();
    const user = currentUser(db);
    const [pathname] = path.split('?');
    const parts = pathname.split('/').filter(Boolean); // ['api', ...]

    const route = `/${parts.slice(1).join('/')}`;

    /* ---- auth ---- */
    if (route === '/auth/register' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!body.name || !email || !body.password) fail(400, 'Name, email and password are required.');
      if (String(body.password).length < 6) fail(400, 'Password must be at least 6 characters.');
      if (db.users.some((entry) => entry.email === email)) fail(409, 'An account with that email already exists.');
      db.seq.user += 1;
      const created = {
        id: db.seq.user,
        name: body.name,
        email,
        password_hash: bcrypt.hashSync(body.password, 10),
        role: 'user',
        points: 0,
        created_at: now()
      };
      db.users.push(created);
      save(db);
      localStorage.setItem(SESSION_KEY, String(created.id));
      return { user: publicUser(created) };
    }

    if (route === '/auth/login' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const found = db.users.find((entry) => entry.email === email);
      if (!found || !bcrypt.compareSync(String(body.password || ''), found.password_hash)) {
        fail(401, 'Invalid email or password.');
      }
      localStorage.setItem(SESSION_KEY, String(found.id));
      return { user: publicUser(found) };
    }

    if (route === '/auth/logout' && method === 'POST') {
      localStorage.removeItem(SESSION_KEY);
      return { ok: true };
    }

    if (route === '/auth/me' && method === 'GET') {
      if (!user) fail(401, 'Not signed in.');
      return { user: publicUser(user) };
    }

    /* ---- menu ---- */
    if (route === '/menu' && method === 'GET') {
      const items = db.menu
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({ ...item, available: Boolean(item.available) }));
      const present = new Set(items.map((item) => item.category));
      const categories = seed.CATEGORY_ORDER.filter((name) => present.has(name)).map((name) => ({
        name,
        icon: seed.CATEGORY_ICONS[name] || '🍽️'
      }));
      return { categories, items };
    }

    /* ---- orders ---- */
    if (route === '/orders' && method === 'POST') {
      if (!user) fail(401, 'Please sign in to continue.');
      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length === 0) fail(400, 'Your cart is empty.');
      const lines = [];
      rawItems.forEach((entry) => {
        const item = db.menu.find((m) => m.id === Number(entry.id));
        const qty = Math.floor(Number(entry.qty));
        if (!item || !item.available) fail(400, `"${item ? item.name : 'An item'}" is no longer available.`);
        if (!qty || qty < 1) fail(400, 'Invalid quantity.');
        const chosen = (entry.options || []).map(Number);
        const resolved = [];
        (item.options || []).forEach((group) => {
          let selected = group.options.filter((option) => chosen.includes(option.id));
          if (group.type === 'single') {
            if (selected.length === 0 && group.required) selected = group.options.filter((option) => option.is_default);
            selected = selected.slice(0, 1);
          }
          selected.forEach((option) => resolved.push({ option_id: option.id, group_name: group.name, option_name: option.name, price_delta: option.delta }));
        });
        lines.push({ item, qty, resolved });
      });

      const totals = computeOrder(
        lines.map((line) => ({ price: line.item.price, qty: line.qty, options: line.resolved.map((option) => ({ delta: option.price_delta })) })),
        user.points,
        Math.max(0, Math.floor(Number(body.redeemPoints) || 0)),
        Math.max(0, Math.floor(Number(body.seniorPwdCount) || 0))
      );

      db.seq.order += 1;
      const orderId = db.seq.order;
      const items = lines.map((line, index) => {
        db.seq.item += 1;
        return {
          id: db.seq.item,
          menu_item_id: line.item.id,
          name: line.item.name,
          unit_price: totals.lines[index].unit,
          qty: line.qty,
          line_total: totals.lines[index].lineTotal,
          options: line.resolved
        };
      });
      const order = {
        id: orderId,
        code: `MC-${1000 + orderId}`,
        user_id: user.id,
        subtotal: totals.subtotal,
        discount: totals.pointsDiscount,
        senior_discount: totals.seniorDiscount,
        vat_amount: totals.vatAmount,
        vatable_sales: totals.vatableSales,
        vat_exempt_sales: totals.vatExemptSales,
        senior_pwd_count: Math.max(0, Math.floor(Number(body.seniorPwdCount) || 0)),
        points_redeemed: totals.redeem,
        points_earned: totals.pointsEarned,
        total: totals.total,
        order_type: body.orderType === 'takeout' ? 'takeout' : 'dine-in',
        payment_method: ['card', 'gcash', 'cash'].includes(body.paymentMethod) ? body.paymentMethod : 'cash',
        payment_status: 'paid',
        status: 'received',
        created_at: now(),
        updated_at: now(),
        items,
        events: [{ status: 'received', note: seed.STATUS_NOTES.received, created_at: now() }]
      };
      db.orders.unshift(order);
      user.points = user.points - totals.redeem + totals.pointsEarned;
      emit(db, 'order:new', { id: order.id, code: order.code, status: order.status });
      emit(db, 'stats:changed', {});
      save(db);
      return { order, points: user.points, statusLabels: seed.STATUS_LABELS };
    }

    if (route === '/orders' && method === 'GET') {
      if (!user) fail(401, 'Please sign in to continue.');
      const orders = db.orders
        .filter((order) => order.user_id === user.id)
        .map((order) => ({ ...order, item_count: order.items.reduce((sum, item) => sum + item.qty, 0) }));
      return { orders, statusLabels: seed.STATUS_LABELS, statusFlow: seed.STATUS_FLOW };
    }

    const orderMatch = route.match(/^\/orders\/(\d+)$/);
    if (orderMatch && method === 'GET') {
      if (!user) fail(401, 'Please sign in to continue.');
      const order = loadOrder(db, orderMatch[1], user);
      if (!order) fail(404, 'Order not found.');
      return { order, statusLabels: seed.STATUS_LABELS, statusFlow: seed.STATUS_FLOW };
    }

    const cancelMatch = route.match(/^\/orders\/(\d+)\/cancel$/);
    if (cancelMatch && method === 'POST') {
      if (!user) fail(401, 'Please sign in to continue.');
      const order = loadOrder(db, cancelMatch[1], user);
      if (!order) fail(404, 'Order not found.');
      if (order.status !== 'received') fail(400, 'This order can no longer be cancelled.');
      order.status = 'cancelled';
      order.updated_at = now();
      order.events.push({ status: 'cancelled', note: seed.STATUS_NOTES.cancelled, created_at: now() });
      emit(db, 'order:updated', { id: order.id, status: 'cancelled', code: order.code });
      save(db);
      return { order, statusLabels: seed.STATUS_LABELS };
    }

    /* ---- admin ---- */
    const staffRoles = { kitchen: 1, cashier: 1, manager: 1, admin: 1 };
    const isOps = user && ['admin', 'manager', 'cashier'].includes(user.role);
    const isKitchen = user && ['admin', 'manager', 'kitchen'].includes(user.role);

    if (route === '/admin/orders' && method === 'GET') {
      if (!isOps) fail(403, 'You do not have access to this resource.');
      const orders = db.orders.map((order) => {
        const owner = db.users.find((entry) => entry.id === order.user_id) || {};
        return { ...order, customer_name: owner.name || 'Customer', customer_email: owner.email || '' };
      });
      return { orders, statusFlow: seed.STATUS_FLOW, statusLabels: seed.STATUS_LABELS };
    }

    if (route === '/admin/kitchen' && method === 'GET') {
      if (!isKitchen) fail(403, 'You do not have access to this resource.');
      const orders = db.orders
        .filter((order) => ['received', 'preparing'].includes(order.status))
        .map((order) => {
          const owner = db.users.find((entry) => entry.id === order.user_id) || {};
          return { ...order, customer_name: owner.name || 'Customer' };
        });
      return { orders, statusFlow: seed.STATUS_FLOW, statusLabels: seed.STATUS_LABELS };
    }

    const statusMatch = route.match(/^\/admin\/orders\/(\d+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      if (!user || !['admin', 'manager', 'cashier', 'kitchen'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      const order = db.orders.find((entry) => entry.id === Number(statusMatch[1]));
      if (!order) fail(404, 'Order not found.');
      const transitions = { received: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: ['completed'], completed: [], cancelled: [] };
      const roleAllowed = {
        kitchen: { received: ['preparing'], preparing: ['ready'] },
        cashier: { ready: ['completed'], received: ['cancelled'], preparing: ['cancelled'] }
      };
      const target = String(body.status);
      const valid = (transitions[order.status] || []).includes(target);
      const privileged = ['admin', 'manager'].includes(user.role);
      const allowed = privileged || (((roleAllowed[user.role] || {})[order.status] || []).includes(target));
      if (!valid || !allowed) fail(400, `Cannot move this order from "${order.status}" to "${target}".`);
      order.status = target;
      order.updated_at = now();
      order.events.push({ status: target, note: seed.STATUS_NOTES[target] || '', created_at: now() });
      emit(db, 'order:updated', { id: order.id, status: target, code: order.code });
      emit(db, 'stats:changed', {});
      save(db);
      return { order, statusLabels: seed.STATUS_LABELS };
    }

    if (route === '/admin/stats' && method === 'GET') {
      if (!isOps) fail(403, 'You do not have access to this resource.');
      const today = now().slice(0, 10);
      const todays = db.orders.filter((order) => order.created_at.slice(0, 10) === today);
      return {
        todayOrders: todays.length,
        todayRevenue: round2(todays.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)),
        activeOrders: db.orders.filter((o) => ['received', 'preparing', 'ready'].includes(o.status)).length,
        totalOrders: db.orders.length,
        totalUsers: db.users.filter((u) => u.role === 'user').length,
        pointsIssued: db.orders.reduce((sum, o) => sum + o.points_earned, 0)
      };
    }

    if (route === '/admin/menu' && method === 'GET') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      return { items: db.menu.map((item) => ({ ...item, available: Boolean(item.available) })) };
    }

    if (route === '/admin/menu' && method === 'POST') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      if (!body.name || !body.category || !(Number(body.price) > 0)) fail(400, 'Name, category and a valid price are required.');
      db.seq.menu += 1;
      const item = {
        id: db.seq.menu,
        name: body.name,
        description: body.description || '',
        category: body.category,
        price: Number(body.price),
        icon: body.icon || '🍔',
        badge: '',
        image: body.image || `/img/menu/${slugify(body.name)}.jpg`,
        available: 1,
        sort_order: db.menu.length,
        options: []
      };
      db.menu.push(item);
      save(db);
      return { item: { ...item, available: true } };
    }

    const menuIdMatch = route.match(/^\/admin\/menu\/(\d+)$/);
    if (menuIdMatch && method === 'PATCH') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      const item = db.menu.find((entry) => entry.id === Number(menuIdMatch[1]));
      if (!item) fail(404, 'Menu item not found.');
      ['name', 'description', 'category', 'icon', 'badge', 'image'].forEach((key) => {
        if (body[key] !== undefined) item[key] = body[key];
      });
      if (body.price !== undefined) item.price = Number(body.price);
      if (body.available !== undefined) item.available = body.available ? 1 : 0;
      save(db);
      return { item: { ...item, available: Boolean(item.available) } };
    }

    if (menuIdMatch && method === 'DELETE') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      const index = db.menu.findIndex((entry) => entry.id === Number(menuIdMatch[1]));
      if (index === -1) fail(404, 'Menu item not found.');
      db.menu.splice(index, 1);
      save(db);
      return { deleted: true };
    }

    const groupCreateMatch = route.match(/^\/admin\/menu\/(\d+)\/options$/);
    if (groupCreateMatch && method === 'POST') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      const item = db.menu.find((entry) => entry.id === Number(groupCreateMatch[1]));
      if (!item) fail(404, 'Menu item not found.');
      db.seq.option += 1;
      item.options.push({ id: db.seq.option, name: body.name, type: body.type === 'multi' ? 'multi' : 'single', required: Boolean(body.required), options: [] });
      save(db);
      return { groupId: db.seq.option };
    }

    const groupDeleteMatch = route.match(/^\/admin\/options\/(\d+)$/);
    if (groupDeleteMatch && method === 'DELETE') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      db.menu.forEach((item) => {
        item.options = item.options.filter((group) => group.id !== Number(groupDeleteMatch[1]));
      });
      save(db);
      return { deleted: true };
    }

    const valueCreateMatch = route.match(/^\/admin\/options\/(\d+)\/values$/);
    if (valueCreateMatch && method === 'POST') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      const group = db.menu.flatMap((item) => item.options).find((entry) => entry.id === Number(valueCreateMatch[1]));
      if (!group) fail(404, 'Option group not found.');
      db.seq.option += 1;
      group.options.push({ id: db.seq.option, name: body.name, delta: Number(body.delta) || 0, is_default: Boolean(body.is_default) });
      save(db);
      return { optionId: db.seq.option };
    }

    const valueDeleteMatch = route.match(/^\/admin\/option-values\/(\d+)$/);
    if (valueDeleteMatch && method === 'DELETE') {
      if (!user || !['admin', 'manager'].includes(user.role)) fail(403, 'You do not have access to this resource.');
      db.menu.forEach((item) => {
        item.options.forEach((group) => {
          group.options = group.options.filter((option) => option.id !== Number(valueDeleteMatch[1]));
        });
      });
      save(db);
      return { deleted: true };
    }

    if (route === '/admin/customers' && method === 'GET') {
      if (!isOps) fail(403, 'You do not have access to this resource.');
      return {
        customers: db.users
          .filter((entry) => entry.role === 'user')
          .map((entry) => ({ id: entry.id, name: entry.name, email: entry.email, points: entry.points, created_at: entry.created_at }))
          .sort((a, b) => b.points - a.points)
      };
    }

    if (route === '/admin/staff' && method === 'GET') {
      if (!user || user.role !== 'admin') fail(403, 'You do not have access to this resource.');
      return {
        staff: db.users
          .filter((entry) => entry.role !== 'user')
          .map((entry) => ({ id: entry.id, name: entry.name, email: entry.email, role: entry.role, roleLabel: seed.ROLE_LABELS[entry.role], created_at: entry.created_at })),
        roles: ['kitchen', 'cashier', 'manager', 'admin']
      };
    }

    if (route === '/admin/staff' && method === 'POST') {
      if (!user || user.role !== 'admin') fail(403, 'You do not have access to this resource.');
      const email = String(body.email || '').trim().toLowerCase();
      if (!body.name || !email || String(body.password || '').length < 6 || !staffRoles[body.role]) {
        fail(400, 'Name, valid email, 6+ char password and a staff role are required.');
      }
      if (db.users.some((entry) => entry.email === email)) fail(409, 'That email is already registered.');
      db.seq.user += 1;
      db.users.push({ id: db.seq.user, name: body.name, email, password_hash: bcrypt.hashSync(body.password, 10), role: body.role, points: 0, created_at: now() });
      save(db);
      return { staff: { id: db.seq.user, name: body.name, email, role: body.role, roleLabel: seed.ROLE_LABELS[body.role], created_at: now() } };
    }

    const staffMatch = route.match(/^\/admin\/staff\/(\d+)$/);
    if (staffMatch && method === 'PATCH') {
      if (!user || user.role !== 'admin') fail(403, 'You do not have access to this resource.');
      const member = db.users.find((entry) => entry.id === Number(staffMatch[1]) && entry.role !== 'user');
      if (!member) fail(404, 'Staff member not found.');
      if (staffRoles[body.role]) member.role = body.role;
      save(db);
      return { updated: true, role: member.role };
    }

    if (route === '/admin/demo/reset' && method === 'POST') {
      if (!user || user.role !== 'admin') fail(403, 'You do not have access to this resource.');
      const fresh = seedDb();
      fresh.users = db.users;
      fresh.seq = db.seq;
      seed.USERS.forEach((seedUser) => {
        const existing = db.users.find((entry) => entry.email === seedUser.email);
        if (existing) existing.points = seedUser.points;
      });
      fresh.users = db.users;
      save(fresh);
      emit(fresh, 'demo:reset', {});
      emit(fresh, 'stats:changed', {});
      save(fresh);
      return { ok: true };
    }

    fail(404, 'Not found.');
    return null;
  }

  function subscribe(onEvent) {
    let last = 0;
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) last = (JSON.parse(raw).events || []).length;
    } catch (err) {
      last = 0;
    }
    let stopped = false;

    function check() {
      if (stopped) return;
      try {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return;
        const db = JSON.parse(raw);
        const events = db.events || [];
        if (events.length < last) last = 0;
        for (let i = last; i < events.length; i += 1) onEvent(events[i]);
        last = events.length;
      } catch (err) {
        /* ignore */
      }
    }

    const interval = setInterval(check, 1200);
    const onStorage = (event) => {
      if (event.key === EVENTS_KEY || event.key === DB_KEY) check();
    };
    window.addEventListener('storage', onStorage);

    return function () {
      stopped = true;
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }

  window.MockApi = { request, subscribe, seedDb };
})();
