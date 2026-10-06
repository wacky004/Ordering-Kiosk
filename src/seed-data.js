/**
 * Single source of truth for all demo/seed data.
 * UMD so the same file is require()d by the server and inlined into the
 * offline single-file build.
 */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = data;
  } else {
    root.SEED = data;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const CATEGORY_ORDER = [
    'Burgers',
    'Chicken',
    'McSpaghetti & Rice',
    'Breakfast',
    'Fries & Sides',
    'Desserts',
    'Drinks',
    'Happy Meal',
    'Group Meals'
  ];

  const CATEGORY_ICONS = {
    Burgers: '🍔',
    Chicken: '🍗',
    'McSpaghetti & Rice': '🍝',
    Breakfast: '🍳',
    'Fries & Sides': '🍟',
    Desserts: '🍨',
    Drinks: '🥤',
    'Happy Meal': '🧸',
    'Group Meals': '🍱'
  };

  const MENU = [
    { category: 'Burgers', name: 'Burger McDo', description: "100% beef patty with McDo's signature sauce", price: 59, icon: '🍔', badge: '' },
    { category: 'Burgers', name: 'Cheeseburger McDo', description: 'Beef patty topped with melting cheese', price: 75, icon: '🍔', badge: '' },
    { category: 'Burgers', name: 'Double Cheeseburger', description: 'Two beef patties and two slices of cheese', price: 110, icon: '🍔', badge: '' },
    { category: 'Burgers', name: 'Big Mac', description: 'Two beef patties, special sauce, lettuce and cheese', price: 178, icon: '🍔', badge: 'Bestseller' },
    { category: 'Burgers', name: 'McChicken', description: 'Crispy chicken patty with lettuce and mayo', price: 105, icon: '🍔', badge: '' },
    { category: 'Burgers', name: 'McCrispy Chicken Fillet', description: 'Whole-muscle crispy chicken fillet sandwich', price: 115, icon: '🍔', badge: '' },
    { category: 'Burgers', name: 'Quarter Pounder with Cheese', description: 'Quarter-pound beef patty with cheese', price: 165, icon: '🍔', badge: 'New' },

    { category: 'Chicken', name: '1-pc Chicken McDo w/ Rice', description: 'Fried chicken with steamed rice and gravy', price: 95, icon: '🍗', badge: 'Bestseller' },
    { category: 'Chicken', name: '2-pc Chicken McDo w/ Rice', description: 'Two pieces of fried chicken with rice and gravy', price: 165, icon: '🍗', badge: '' },
    { category: 'Chicken', name: '1-pc Spicy Chicken McDo w/ Rice', description: 'Spicy fried chicken with steamed rice and gravy', price: 99, icon: '🌶️', badge: '' },
    { category: 'Chicken', name: '6-pc Chicken McNuggets', description: 'Six golden nuggets with dipping sauce', price: 99, icon: '🍗', badge: '' },
    { category: 'Chicken', name: '10-pc Chicken McNuggets', description: 'Ten golden nuggets, great for sharing', price: 189, icon: '🍗', badge: '' },
    { category: 'Chicken', name: '20-pc Chicken McNuggets', description: 'Twenty nuggets for the whole barkada', price: 375, icon: '🍗', badge: '' },
    { category: 'Chicken', name: '6-pc Chicken McShare Box', description: 'Six pieces of Chicken McDo for sharing', price: 515, icon: '🍗', badge: '' },
    { category: 'Chicken', name: '8-pc Chicken McShare Box', description: 'Eight pieces of Chicken McDo for sharing', price: 670, icon: '🍗', badge: '' },

    { category: 'McSpaghetti & Rice', name: 'McSpaghetti Solo', description: 'Sweet-style spaghetti with hotdog and cheese', price: 78, icon: '🍝', badge: 'Bestseller' },
    { category: 'McSpaghetti & Rice', name: 'McSpaghetti Platter', description: 'Family-size sweet-style spaghetti', price: 262, icon: '🍝', badge: '' },
    { category: 'McSpaghetti & Rice', name: '1-pc Chicken McDo w/ McSpaghetti', description: 'Fried chicken with sweet-style spaghetti', price: 159, icon: '🍝', badge: '' },
    { category: 'McSpaghetti & Rice', name: 'Crispy Chicken Fillet Ala King w/ Rice', description: 'Chicken fillet with creamy ala king sauce', price: 130, icon: '🍛', badge: '' },

    { category: 'Breakfast', name: 'Cheesy Eggdesal', description: 'Egg and cheese in a soft bun', price: 55, icon: '🍳', badge: '' },
    { category: 'Breakfast', name: 'Sausage McMuffin w/ Egg', description: 'Sausage patty, egg and cheese on a muffin', price: 95, icon: '🍳', badge: '' },
    { category: 'Breakfast', name: 'Egg McMuffin', description: 'Egg, cheese and ham on an English muffin', price: 99, icon: '🍳', badge: '' },
    { category: 'Breakfast', name: '2-pc Hotcakes', description: 'Golden hotcakes with butter and syrup', price: 89, icon: '🥞', badge: '' },
    { category: 'Breakfast', name: 'Big Breakfast', description: 'Egg, sausage, hash browns and muffin', price: 157, icon: '🍳', badge: '' },

    { category: 'Fries & Sides', name: 'McFries Regular', description: 'World Famous Fries, regular size', price: 65, icon: '🍟', badge: 'Bestseller' },
    { category: 'Fries & Sides', name: 'McFries Medium', description: 'World Famous Fries, medium size', price: 85, icon: '🍟', badge: '' },
    { category: 'Fries & Sides', name: 'McFries Large', description: 'World Famous Fries, large size', price: 105, icon: '🍟', badge: '' },
    { category: 'Fries & Sides', name: 'BFF Fries', description: 'Big Fries for Friends - shareable fries', price: 155, icon: '🍟', badge: '' },
    { category: 'Fries & Sides', name: 'Twister Fries', description: 'Crispy spiral-cut twister fries', price: 89, icon: '🍟', badge: 'Limited' },
    { category: 'Fries & Sides', name: 'Apple Pie', description: 'Warm apple pie with cinnamon', price: 45, icon: '🥧', badge: '' },

    { category: 'Desserts', name: 'Vanilla Cone', description: 'Creamy vanilla soft-serve cone', price: 25, icon: '🍦', badge: 'Bestseller' },
    { category: 'Desserts', name: 'Hot Fudge Sundae', description: 'Vanilla sundae topped with hot fudge', price: 55, icon: '🍨', badge: '' },
    { category: 'Desserts', name: 'McFlurry with Oreo', description: 'Vanilla soft-serve blended with Oreo bits', price: 65, icon: '🍨', badge: '' },
    { category: 'Desserts', name: 'Coke McFloat', description: 'Coke topped with vanilla soft-serve', price: 65, icon: '🥤', badge: '' },
    { category: 'Desserts', name: 'Chocolate Shake', description: 'Thick and creamy chocolate shake', price: 75, icon: '🥤', badge: '' },

    { category: 'Drinks', name: 'Coke Regular', description: 'Ice-cold Coca-Cola, regular', price: 55, icon: '🥤', badge: '' },
    { category: 'Drinks', name: 'Coke Large', description: 'Ice-cold Coca-Cola, large', price: 75, icon: '🥤', badge: '' },
    { category: 'Drinks', name: 'Sprite Regular', description: 'Crisp lemon-lime soda, regular', price: 55, icon: '🥤', badge: '' },
    { category: 'Drinks', name: 'Royal Regular', description: 'Orange soda, regular', price: 55, icon: '🥤', badge: '' },
    { category: 'Drinks', name: 'Coke Zero Regular', description: 'Sugar-free Coca-Cola, regular', price: 55, icon: '🥤', badge: '' },
    { category: 'Drinks', name: 'Iced Tea', description: 'Sweetened iced tea', price: 50, icon: '🧋', badge: '' },
    { category: 'Drinks', name: 'Brewed Coffee', description: 'Freshly brewed McCafe coffee', price: 45, icon: '☕', badge: '' },
    { category: 'Drinks', name: 'Orange Juice', description: '100% orange juice', price: 55, icon: '🧃', badge: '' },

    { category: 'Happy Meal', name: 'Burger McDo Happy Meal', description: 'Burger, small fries, drink and a toy', price: 148, icon: '🧸', badge: '' },
    { category: 'Happy Meal', name: 'McSpaghetti Happy Meal', description: 'McSpaghetti, small fries, drink and a toy', price: 168, icon: '🧸', badge: '' },
    { category: 'Happy Meal', name: '4-pc McNuggets Happy Meal', description: 'Nuggets, small fries, drink and a toy', price: 189, icon: '🧸', badge: '' },
    { category: 'Happy Meal', name: '1-pc Chicken McDo Happy Meal', description: 'Chicken, small fries, drink and a toy', price: 205, icon: '🧸', badge: '' },

    { category: 'Group Meals', name: 'McShare Bundle for 3', description: 'Chicken, spaghetti, burgers and drinks for 3', price: 612, icon: '🍱', badge: '' },
    { category: 'Group Meals', name: 'McShare Bundle for 4', description: 'Complete sharing bundle for 4 people', price: 847, icon: '🍱', badge: '' }
  ];

  const OPTION_TEMPLATES = {
    size: {
      name: 'Size',
      type: 'single',
      required: 1,
      options: [
        { name: 'Regular', delta: 0, is_default: 1 },
        { name: 'Medium', delta: 20, is_default: 0 },
        { name: 'Large', delta: 40, is_default: 0 }
      ]
    },
    drink: {
      name: 'Drink',
      type: 'single',
      required: 1,
      options: [
        { name: 'Coke', delta: 0, is_default: 1 },
        { name: 'Sprite', delta: 0, is_default: 0 },
        { name: 'Royal', delta: 0, is_default: 0 },
        { name: 'Iced Tea', delta: 0, is_default: 0 },
        { name: 'Coke Zero', delta: 0, is_default: 0 }
      ]
    },
    addons: {
      name: 'Add-ons',
      type: 'multi',
      required: 0,
      options: [
        { name: 'Extra Cheese', delta: 20, is_default: 0 },
        { name: 'Bacon', delta: 35, is_default: 0 },
        { name: 'Extra Patty', delta: 45, is_default: 0 },
        { name: 'Upgrade to McFloat', delta: 25, is_default: 0 }
      ]
    }
  };

  const CATEGORY_OPTIONS = {
    Burgers: ['addons'],
    Chicken: ['addons'],
    'McSpaghetti & Rice': ['addons'],
    Breakfast: ['addons'],
    'Fries & Sides': ['size'],
    Desserts: [],
    Drinks: ['size'],
    'Happy Meal': ['drink'],
    'Group Meals': []
  };

  const USERS = [
    { name: 'Store Admin', email: 'admin@mcdo.ph', password: 'admin123', role: 'admin', points: 0 },
    { name: 'Store Manager', email: 'manager@mcdo.ph', password: 'manager123', role: 'manager', points: 0 },
    { name: 'Front Cashier', email: 'cashier@mcdo.ph', password: 'cashier123', role: 'cashier', points: 0 },
    { name: 'Kitchen Crew', email: 'kitchen@mcdo.ph', password: 'kitchen123', role: 'kitchen', points: 0 },
    { name: 'Juan Dela Cruz', email: 'juan@email.com', password: 'user123', role: 'user', points: 250 }
  ];

  const DEMO_ACCOUNTS = {
    customer: { email: 'juan@email.com', password: 'user123', label: 'Customer Kiosk', icon: '🍔', route: '#/menu' },
    kitchen: { email: 'kitchen@mcdo.ph', password: 'kitchen123', label: 'Kitchen Display', icon: '👨‍🍳', route: '#/kitchen' },
    admin: { email: 'admin@mcdo.ph', password: 'admin123', label: 'Admin Dashboard', icon: '📊', route: '#/admin' }
  };

  const DEMO_ORDERS = [
    { items: ['Big Mac', 'McFries Large', 'Coke Regular'], status: 'completed' },
    { items: ['1-pc Chicken McDo w/ Rice', 'McSpaghetti Solo'], status: 'ready' },
    { items: ['6-pc Chicken McNuggets', 'Coke McFloat'], status: 'preparing' },
    { items: ['Cheeseburger McDo', 'McFries Regular', 'Vanilla Cone'], status: 'received' }
  ];

  const VAT_RATE = 0.12;
  const SENIOR_PWD_RATE = 0.2;
  const POINTS_PER_PESO = 1;
  const POINTS_REDEEM_BLOCK = 100;
  const POINTS_REDEEM_VALUE = 10;

  const STATUS_FLOW = ['received', 'preparing', 'ready', 'completed'];
  const STATUS_LABELS = {
    received: 'Order Received',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  const STATUS_ICONS = {
    received: '🧾',
    preparing: '👨‍🍳',
    ready: '🔔',
    completed: '✅',
    cancelled: '❌'
  };
  const STATUS_NOTES = {
    received: 'Order received and confirmed.',
    preparing: 'Your order is now being prepared.',
    ready: 'Your order is ready for pickup!',
    completed: 'Order completed. Enjoy your meal!',
    cancelled: 'Order was cancelled.'
  };

  const ROLE_LABELS = {
    user: 'Customer',
    kitchen: 'Kitchen',
    cashier: 'Cashier',
    manager: 'Manager',
    admin: 'Administrator'
  };

  return {
    CATEGORY_ORDER,
    CATEGORY_ICONS,
    CATEGORY_OPTIONS,
    OPTION_TEMPLATES,
    MENU,
    USERS,
    DEMO_ACCOUNTS,
    DEMO_ORDERS,
    VAT_RATE,
    SENIOR_PWD_RATE,
    POINTS_PER_PESO,
    POINTS_REDEEM_BLOCK,
    POINTS_REDEEM_VALUE,
    STATUS_FLOW,
    STATUS_LABELS,
    STATUS_ICONS,
    STATUS_NOTES,
    ROLE_LABELS
  };
});
