export const CATEGORIES = [
  'All',
  'Burgers',
  'Chicken',
  'McSpaghetti & Rice',
  'Breakfast',
  'Fries & Sides',
  'Desserts',
  'Drinks',
  'Happy Meal',
  'Group Meals',
];

export const OPTIONS = {
  Burgers: [
    {
      name: 'Add-ons',
      type: 'multi',
      required: false,
      choices: [
        { name: 'Extra Cheese', delta: 20 },
        { name: 'Bacon', delta: 35 },
        { name: 'Extra Patty', delta: 45 },
      ],
    },
  ],
  Chicken: [
    {
      name: 'Add-ons',
      type: 'multi',
      required: false,
      choices: [
        { name: 'Extra Cheese', delta: 20 },
        { name: 'Extra Rice', delta: 35 },
      ],
    },
    {
      name: 'Drink',
      type: 'single',
      required: true,
      choices: [
        { name: 'Coke', delta: 0 },
        { name: 'Sprite', delta: 0 },
        { name: 'Iced Tea', delta: 0 },
      ],
    },
  ],
  'McSpaghetti & Rice': [
    {
      name: 'Add-ons',
      type: 'multi',
      required: false,
      choices: [
        { name: 'Extra Cheese', delta: 20 },
        { name: 'Extra Chicken', delta: 55 },
      ],
    },
  ],
  Breakfast: [
    {
      name: 'Drink',
      type: 'single',
      required: true,
      choices: [
        { name: 'Brewed Coffee', delta: 0 },
        { name: 'Orange Juice', delta: 20 },
        { name: 'Coke', delta: 0 },
      ],
    },
  ],
  'Fries & Sides': [
    {
      name: 'Size',
      type: 'single',
      required: true,
      choices: [
        { name: 'Regular', delta: 0 },
        { name: 'Medium', delta: 20 },
        { name: 'Large', delta: 40 },
      ],
    },
  ],
  Drinks: [
    {
      name: 'Size',
      type: 'single',
      required: true,
      choices: [
        { name: 'Regular', delta: 0 },
        { name: 'Medium', delta: 20 },
        { name: 'Large', delta: 40 },
      ],
    },
  ],
  'Happy Meal': [
    {
      name: 'Drink',
      type: 'single',
      required: true,
      choices: [
        { name: 'Coke', delta: 0 },
        { name: 'Sprite', delta: 0 },
        { name: 'Royal', delta: 0 },
      ],
    },
  ],
};

export const MENU = [
  { id: 1, name: 'Burger McDo', category: 'Burgers', price: 59, icon: '🍔', desc: "100% beef patty with McDo's sauce" },
  { id: 2, name: 'Cheeseburger McDo', category: 'Burgers', price: 75, icon: '🍔', desc: 'Beef patty topped with melting cheese' },
  { id: 3, name: 'Big Mac', category: 'Burgers', price: 178, icon: '🍔', desc: 'Two patties, special sauce, lettuce, cheese', badge: 'Bestseller' },
  { id: 4, name: 'McChicken', category: 'Burgers', price: 105, icon: '🍔', desc: 'Crispy chicken patty, lettuce, mayo' },
  { id: 5, name: 'Quarter Pounder with Cheese', category: 'Burgers', price: 165, icon: '🍔', desc: 'Quarter-pound beef patty with cheese' },
  { id: 6, name: '1-pc Chicken McDo w/ Rice', category: 'Chicken', price: 95, icon: '🍗', desc: 'Fried chicken, rice and gravy', badge: 'Bestseller' },
  { id: 7, name: '2-pc Chicken McDo w/ Rice', category: 'Chicken', price: 165, icon: '🍗', desc: 'Two pieces, rice and gravy' },
  { id: 8, name: '6-pc Chicken McNuggets', category: 'Chicken', price: 99, icon: '🍗', desc: 'Six golden nuggets' },
  { id: 9, name: '10-pc Chicken McNuggets', category: 'Chicken', price: 189, icon: '🍗', desc: 'Ten nuggets, great for sharing' },
  { id: 10, name: 'McSpaghetti Solo', category: 'McSpaghetti & Rice', price: 78, icon: '🍝', desc: 'Sweet-style spaghetti with hotdog', badge: 'Bestseller' },
  { id: 11, name: '1-pc Chicken McDo w/ McSpaghetti', category: 'McSpaghetti & Rice', price: 159, icon: '🍝', desc: 'Chicken with sweet-style spaghetti' },
  { id: 12, name: 'Crispy Chicken Fillet Ala King w/ Rice', category: 'McSpaghetti & Rice', price: 130, icon: '🍛', desc: 'Creamy ala king sauce' },
  { id: 13, name: 'Cheesy Eggdesal', category: 'Breakfast', price: 55, icon: '🍳', desc: 'Egg and cheese in a soft bun' },
  { id: 14, name: 'Egg McMuffin', category: 'Breakfast', price: 99, icon: '🍳', desc: 'Egg, cheese and ham muffin' },
  { id: 15, name: '2-pc Hotcakes', category: 'Breakfast', price: 89, icon: '🥞', desc: 'Hotcakes with butter and syrup' },
  { id: 16, name: 'McFries Regular', category: 'Fries & Sides', price: 65, icon: '🍟', desc: 'World Famous Fries, regular', badge: 'Bestseller' },
  { id: 17, name: 'McFries Large', category: 'Fries & Sides', price: 105, icon: '🍟', desc: 'World Famous Fries, large' },
  { id: 18, name: 'Apple Pie', category: 'Fries & Sides', price: 45, icon: '🥧', desc: 'Warm apple pie with cinnamon' },
  { id: 19, name: 'Vanilla Cone', category: 'Desserts', price: 25, icon: '🍦', desc: 'Creamy vanilla soft-serve', badge: 'Bestseller' },
  { id: 20, name: 'McFlurry with Oreo', category: 'Desserts', price: 65, icon: '🍨', desc: 'Soft-serve blended with Oreo bits' },
  { id: 21, name: 'Coke McFloat', category: 'Desserts', price: 65, icon: '🥤', desc: 'Coke topped with vanilla soft-serve' },
  { id: 22, name: 'Coke Regular', category: 'Drinks', price: 55, icon: '🥤', desc: 'Ice-cold Coca-Cola' },
  { id: 23, name: 'Iced Tea', category: 'Drinks', price: 50, icon: '🧋', desc: 'Sweetened iced tea' },
  { id: 24, name: 'Brewed Coffee', category: 'Drinks', price: 45, icon: '☕', desc: 'Freshly brewed coffee' },
  { id: 25, name: 'Burger McDo Happy Meal', category: 'Happy Meal', price: 148, icon: '🧸', desc: 'Burger, fries, drink and toy' },
  { id: 26, name: '4-pc McNuggets Happy Meal', category: 'Happy Meal', price: 189, icon: '🧸', desc: 'Nuggets, fries, drink and toy' },
  { id: 27, name: 'McShare Bundle for 3', category: 'Group Meals', price: 612, icon: '🍱', desc: 'Sharing bundle for 3 people' },
  { id: 28, name: 'McShare Bundle for 4', category: 'Group Meals', price: 847, icon: '🍱', desc: 'Complete sharing bundle for 4' },
];
