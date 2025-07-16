// Comprehensive menu injection with full tracking and skip logic
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'pavi1234',
  database: 'pearson_db',
});

// Complete menu data set
const COMPLETE_MENU_DATA = {
  categories: [
    { name: 'Salads', description: 'Fresh and healthy salad options' },
    { name: 'Wraps', description: 'Delicious wraps with various fillings' },
    { name: 'Sandwiches', description: 'Classic and gourmet sandwiches' },
    {
      name: 'Burgers',
      description: 'Juicy burgers made with fresh ingredients',
    },
    { name: 'Starters', description: 'Perfect appetizers to start your meal' },
    { name: 'Breads', description: 'Freshly baked bread selections' },
    { name: 'Poutines', description: 'Canadian classic with various toppings' },
    { name: 'Nachos', description: 'Loaded nachos with fresh toppings' },
    { name: 'Kids Meals', description: 'Kid-friendly meals and portions' },
    { name: 'Desserts', description: 'Sweet treats to end your meal' },
    { name: 'Beverages', description: 'Refreshing drinks and beverages' },
    { name: 'Favourite Mains', description: 'Our most popular main dishes' },
    { name: 'Curries', description: 'Flavorful curry dishes' },
    { name: 'Pasta', description: 'Classic and specialty pasta dishes' },
    { name: 'Wings', description: 'Crispy wings with various sauces' },
  ],

  items: [
    // Salads
    {
      categoryName: 'Salads',
      name: 'Caesar Salad',
      description:
        'Crisp Romaine lettuce tossed with Caesar dressing, topped with croutons, bacon and Parmesan cheese',
      price: 9.99,
      originalPrice: 9.99,
      ingredients: [
        'romaine lettuce',
        'caesar dressing',
        'croutons',
        'bacon',
        'parmesan cheese',
      ],
      sizes: ['small', 'large'],
      isFavourite: false,
    },
    {
      categoryName: 'Salads',
      name: 'Greek Salad',
      description:
        'Fresh iceberg lettuce with mixed peppers, cucumbers, red onions, tomatoes, Feta cheese. Served with Greek dressing',
      price: 9.99,
      originalPrice: 9.99,
      ingredients: [
        'iceberg lettuce',
        'mixed peppers',
        'cucumbers',
        'red onions',
        'tomatoes',
        'feta cheese',
      ],
      sizes: ['small', 'large'],
      isFavourite: false,
    },
    {
      categoryName: 'Salads',
      name: 'House Salad',
      description:
        'Fresh mixed greens with cucumber, tomato, Bermuda onion, Julienne carrots and your choice of dressing',
      price: 7.99,
      originalPrice: 7.99,
      ingredients: [
        'mixed greens',
        'cucumber',
        'tomato',
        'bermuda onion',
        'carrots',
      ],
      sizes: ['small', 'large'],
      isFavourite: false,
    },
    {
      categoryName: 'Salads',
      name: 'Chicken Garden Salad',
      description:
        'Fresh mixed greens topped with grilled chicken breast, cucumber, tomato, and your choice of dressing',
      price: 14.99,
      originalPrice: 14.99,
      ingredients: [
        'mixed greens',
        'grilled chicken',
        'cucumber',
        'tomato',
        'bermuda onion',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Salads',
      name: 'Taco Salad',
      description:
        'Crispy tortilla bowl filled with seasoned ground beef, lettuce, tomatoes, cheese, and sour cream',
      price: 13.99,
      originalPrice: 13.99,
      ingredients: [
        'tortilla bowl',
        'ground beef',
        'lettuce',
        'tomatoes',
        'cheese',
        'sour cream',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Wings
    {
      categoryName: 'Wings',
      name: "Pearson's Famous Wings",
      description:
        'Fresh chicken wings served with carrots, celery and your choice of sauce',
      price: 14.99,
      originalPrice: 14.99,
      ingredients: ['chicken wings', 'carrots', 'celery'],
      sizes: ['regular', 'large'],
      isFavourite: true,
    },
    {
      categoryName: 'Wings',
      name: 'Boneless Wings',
      description:
        'Tender boneless chicken pieces tossed in your favorite sauce',
      price: 13.99,
      originalPrice: 13.99,
      ingredients: ['boneless chicken', 'wing sauce'],
      sizes: ['regular', 'large'],
      isFavourite: false,
    },

    // Burgers
    {
      categoryName: 'Burgers',
      name: 'House Burger',
      description:
        'Fresh ground beef patty on a kaiser bun with lettuce, onion, tomato and pickle',
      price: 12.99,
      originalPrice: 12.99,
      ingredients: [
        'beef patty',
        'kaiser bun',
        'lettuce',
        'onion',
        'tomato',
        'pickle',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Burgers',
      name: 'The Pearson Burger',
      description:
        'House burger with bourbon chipotle sauce, bacon, caramelized onions and aged cheddar',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: [
        'beef patty',
        'bourbon chipotle sauce',
        'bacon',
        'caramelized onions',
        'cheddar cheese',
        'lettuce',
        'onion',
        'tomato',
        'pickle',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Burgers',
      name: 'BBQ Bacon Burger',
      description:
        'Beef patty with BBQ sauce, crispy bacon, onion rings, and cheddar cheese',
      price: 17.99,
      originalPrice: 17.99,
      ingredients: [
        'beef patty',
        'bbq sauce',
        'bacon',
        'onion rings',
        'cheddar cheese',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Burgers',
      name: 'Mushroom Swiss Burger',
      description: 'Beef patty topped with sautéed mushrooms and Swiss cheese',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: [
        'beef patty',
        'sautéed mushrooms',
        'swiss cheese',
        'lettuce',
        'tomato',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Burgers',
      name: 'Double Cheeseburger',
      description:
        'Two beef patties with double cheese, lettuce, onion, and special sauce',
      price: 19.99,
      originalPrice: 19.99,
      ingredients: [
        'beef patties',
        'double cheese',
        'lettuce',
        'onion',
        'special sauce',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Burgers',
      name: 'Veggie Burger',
      description:
        'House-made black bean patty with avocado, lettuce, and tomato',
      price: 14.99,
      originalPrice: 14.99,
      ingredients: [
        'black bean patty',
        'avocado',
        'lettuce',
        'tomato',
        'onion',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Wraps
    {
      categoryName: 'Wraps',
      name: 'Chicken Club Wrap',
      description:
        'Lightly seasoned chicken breast with lettuce, tomato, crispy bacon and mayo',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: ['chicken breast', 'lettuce', 'tomato', 'bacon', 'mayo'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Wraps',
      name: 'Buffalo Chicken Wrap',
      description:
        'Crispy breaded chicken tossed in buffalo sauce with lettuce, tomatoes and chipotle mayo',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: [
        'breaded chicken',
        'bbq sauce',
        'lettuce',
        'tomatoes',
        'chipotle mayo',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Wraps',
      name: 'Mediterranean Wrap',
      description:
        'Grilled chicken breast with feta cheese, lettuce, tomato, black olives and tzatziki sauce',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: [
        'chicken breast',
        'feta cheese',
        'lettuce',
        'tomato',
        'olives',
        'tzatziki',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Wraps',
      name: 'Turkey Club Wrap',
      description:
        'Sliced turkey, bacon, lettuce, tomato, swiss cheese, and cranberry mayo',
      price: 15.99,
      originalPrice: 15.99,
      ingredients: [
        'turkey',
        'bacon',
        'lettuce',
        'tomato',
        'swiss cheese',
        'cranberry mayo',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Wraps',
      name: 'Veggie Wrap',
      description:
        'Fresh vegetables, hummus, lettuce, tomato, cucumber, and avocado in a spinach tortilla',
      price: 13.99,
      originalPrice: 13.99,
      ingredients: [
        'mixed vegetables',
        'hummus',
        'lettuce',
        'tomato',
        'cucumber',
        'avocado',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Starters
    {
      categoryName: 'Starters',
      name: 'French Fries',
      description: 'Crispy golden fries',
      price: 7.99,
      originalPrice: 7.99,
      ingredients: ['potatoes'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Starters',
      name: 'Mozzarella Sticks',
      description: 'Breaded mozzarella served with marinara sauce',
      price: 10.99,
      originalPrice: 10.99,
      ingredients: ['mozzarella cheese', 'breading', 'marinara sauce'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Starters',
      name: 'Onion Rings',
      description: 'Beer battered onion rings',
      price: 9.99,
      originalPrice: 9.99,
      ingredients: ['onions', 'beer batter', 'ranch sauce'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Starters',
      name: 'Loaded Nachos',
      description:
        'Tortilla chips topped with cheese, jalapeños, tomatoes, sour cream, and guacamole',
      price: 14.99,
      originalPrice: 14.99,
      ingredients: [
        'tortilla chips',
        'cheese',
        'jalapeños',
        'tomatoes',
        'sour cream',
        'guacamole',
      ],
      sizes: ['regular', 'large'],
      isFavourite: true,
    },
    {
      categoryName: 'Starters',
      name: 'Chicken Wings',
      description: 'Traditional wings tossed in your choice of sauce',
      price: 13.99,
      originalPrice: 13.99,
      ingredients: ['chicken wings', 'wing sauce'],
      sizes: ['regular', 'large'],
      isFavourite: true,
    },
    {
      categoryName: 'Starters',
      name: 'Calamari Rings',
      description: 'Crispy fried squid rings with marinara and garlic aioli',
      price: 13.99,
      originalPrice: 13.99,
      ingredients: ['squid', 'breading', 'marinara sauce', 'garlic aioli'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Starters',
      name: 'Spinach & Artichoke Dip',
      description:
        'Creamy spinach and artichoke dip served with tortilla chips',
      price: 12.99,
      originalPrice: 12.99,
      ingredients: ['spinach', 'artichokes', 'cream cheese', 'tortilla chips'],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Sandwiches
    {
      categoryName: 'Sandwiches',
      name: 'BLT Classic',
      description:
        'Crispy bacon, lettuce, and tomato with mayo on toasted sourdough',
      price: 12.99,
      originalPrice: 12.99,
      ingredients: ['bacon', 'lettuce', 'tomato', 'mayo', 'sourdough bread'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Sandwiches',
      name: 'Grilled Chicken Sandwich',
      description:
        'Marinated chicken breast with lettuce, tomato on a kaiser bun',
      price: 15.99,
      originalPrice: 15.99,
      ingredients: [
        'chicken breast',
        'lettuce',
        'tomato',
        'garlic aioli',
        'kaiser bun',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Sandwiches',
      name: 'Philly Cheesesteak',
      description:
        'Sliced ribeye with onions, peppers, and cheese on a hoagie roll',
      price: 18.99,
      originalPrice: 18.99,
      ingredients: [
        'ribeye',
        'onions',
        'peppers',
        'provolone cheese',
        'hoagie roll',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Sandwiches',
      name: 'The Pearson Club',
      description:
        'Triple-decker with turkey, ham, bacon, lettuce, tomato, and mayo on toasted white bread',
      price: 17.99,
      originalPrice: 17.99,
      ingredients: [
        'turkey',
        'ham',
        'bacon',
        'lettuce',
        'tomato',
        'mayo',
        'white bread',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Sandwiches',
      name: 'Fish & Chips Sandwich',
      description:
        'Beer-battered cod with tartar sauce, lettuce, and tomato on a brioche bun',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: [
        'beer-battered cod',
        'tartar sauce',
        'lettuce',
        'tomato',
        'brioche bun',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Continue with other categories...
    // Poutines
    {
      categoryName: 'Poutines',
      name: 'Classic Poutine',
      description: 'Fresh-cut fries topped with cheese curds and gravy',
      price: 11.99,
      originalPrice: 11.99,
      ingredients: ['fries', 'cheese curds', 'gravy'],
      sizes: ['regular', 'large'],
      isFavourite: true,
    },
    {
      categoryName: 'Poutines',
      name: 'Bacon Poutine',
      description: 'Classic poutine topped with crispy bacon pieces',
      price: 14.99,
      originalPrice: 14.99,
      ingredients: ['fries', 'cheese curds', 'gravy', 'bacon'],
      sizes: ['regular', 'large'],
      isFavourite: false,
    },
    {
      categoryName: 'Poutines',
      name: 'Pulled Pork Poutine',
      description:
        'Fries, cheese curds, gravy topped with slow-cooked pulled pork',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: ['fries', 'cheese curds', 'gravy', 'pulled pork'],
      sizes: ['regular'],
      isFavourite: true,
    },

    // Nachos
    {
      categoryName: 'Nachos',
      name: 'Supreme Nachos',
      description:
        'Tortilla chips loaded with cheese, ground beef, jalapeños, tomatoes, and sour cream',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: [
        'tortilla chips',
        'cheese',
        'ground beef',
        'jalapeños',
        'tomatoes',
        'sour cream',
      ],
      sizes: ['regular', 'large'],
      isFavourite: true,
    },
    {
      categoryName: 'Nachos',
      name: 'Chicken Nachos',
      description:
        'Chips topped with seasoned chicken, cheese, and all the fixings',
      price: 17.99,
      originalPrice: 17.99,
      ingredients: [
        'tortilla chips',
        'seasoned chicken',
        'cheese',
        'jalapeños',
        'tomatoes',
      ],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Kids Meals
    {
      categoryName: 'Kids Meals',
      name: 'Kids Burger',
      description: 'Mini burger with fries and a drink',
      price: 6.99,
      originalPrice: 6.99,
      ingredients: ['mini burger patty', 'bun', 'fries'],
      sizes: ['small'],
      isFavourite: false,
    },
    {
      categoryName: 'Kids Meals',
      name: 'Kids Chicken Nuggets',
      description: 'Crispy chicken nuggets with fries and apple juice',
      price: 6.99,
      originalPrice: 6.99,
      ingredients: ['chicken nuggets', 'fries'],
      sizes: ['small'],
      isFavourite: false,
    },
    {
      categoryName: 'Kids Meals',
      name: 'Kids Mac & Cheese',
      description: 'Creamy macaroni and cheese with a side of vegetables',
      price: 6.99,
      originalPrice: 6.99,
      ingredients: ['macaroni', 'cheese sauce', 'vegetables'],
      sizes: ['small'],
      isFavourite: false,
    },

    // Desserts
    {
      categoryName: 'Desserts',
      name: 'Chocolate Brownie Sundae',
      description:
        'Warm chocolate brownie topped with vanilla ice cream and chocolate sauce',
      price: 6.99,
      originalPrice: 6.99,
      ingredients: [
        'chocolate brownie',
        'vanilla ice cream',
        'chocolate sauce',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Desserts',
      name: 'Cheesecake',
      description: 'New York style cheesecake with berry compote',
      price: 6.99,
      originalPrice: 6.99,
      ingredients: ['cheesecake', 'berry compote'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Desserts',
      name: 'Apple Pie à la Mode',
      description: 'Traditional apple pie served warm with vanilla ice cream',
      price: 6.99,
      originalPrice: 6.99,
      ingredients: ['apple pie', 'vanilla ice cream'],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Beverages
    {
      categoryName: 'Beverages',
      name: 'Soft Drinks',
      description: 'Coca-Cola, Pepsi, Sprite, Orange, Root Beer',
      price: 3.99,
      originalPrice: 3.99,
      ingredients: ['soda'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Beverages',
      name: 'Fresh Coffee',
      description: 'Freshly brewed coffee, regular or decaf',
      price: 2.99,
      originalPrice: 2.99,
      ingredients: ['coffee'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Beverages',
      name: 'Draft Beer',
      description: 'Local and imported beers on tap',
      price: 5.99,
      originalPrice: 5.99,
      ingredients: ['beer'],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Favourite Mains
    {
      categoryName: 'Favourite Mains',
      name: 'Ribeye Steak',
      description:
        '12oz ribeye steak grilled to perfection, served with mashed potatoes and vegetables',
      price: 28.99,
      originalPrice: 28.99,
      ingredients: ['ribeye steak', 'mashed potatoes', 'vegetables'],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Favourite Mains',
      name: 'BBQ Ribs',
      description:
        'Full rack of baby back ribs with BBQ sauce, fries, and coleslaw',
      price: 24.99,
      originalPrice: 24.99,
      ingredients: ['baby back ribs', 'bbq sauce', 'fries', 'coleslaw'],
      sizes: ['regular'],
      isFavourite: true,
    },
    {
      categoryName: 'Favourite Mains',
      name: 'Fish & Chips',
      description:
        'Beer-battered cod served with fries, coleslaw, and tartar sauce',
      price: 18.99,
      originalPrice: 18.99,
      ingredients: ['beer-battered cod', 'fries', 'coleslaw', 'tartar sauce'],
      sizes: ['regular'],
      isFavourite: true,
    },

    // Curries
    {
      categoryName: 'Curries',
      name: 'Chicken Curry',
      description:
        'Tender chicken in aromatic curry sauce served with basmati rice',
      price: 17.99,
      originalPrice: 17.99,
      ingredients: ['chicken', 'curry sauce', 'basmati rice'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Curries',
      name: 'Vegetable Curry',
      description: 'Mixed vegetables in coconut curry sauce with rice',
      price: 15.99,
      originalPrice: 15.99,
      ingredients: ['mixed vegetables', 'coconut curry sauce', 'rice'],
      sizes: ['regular'],
      isFavourite: false,
    },

    // Pasta
    {
      categoryName: 'Pasta',
      name: 'Spaghetti & Meatballs',
      description:
        'Traditional spaghetti with house-made meatballs in marinara sauce',
      price: 17.99,
      originalPrice: 17.99,
      ingredients: ['spaghetti', 'meatballs', 'marinara sauce'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Pasta',
      name: 'Fettuccine Alfredo',
      description:
        'Classic fettuccine pasta in rich Alfredo sauce, served with garlic bread',
      price: 16.99,
      originalPrice: 16.99,
      ingredients: ['fettuccine', 'alfredo sauce', 'garlic bread'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Pasta',
      name: 'Chicken Parmesan Pasta',
      description:
        'Breaded chicken breast over spaghetti with marinara sauce and mozzarella',
      price: 19.99,
      originalPrice: 19.99,
      ingredients: [
        'breaded chicken',
        'spaghetti',
        'marinara sauce',
        'mozzarella',
      ],
      sizes: ['regular'],
      isFavourite: true,
    },

    // Breads
    {
      categoryName: 'Breads',
      name: 'Garlic Bread',
      description: 'Toasted bread with garlic butter and herbs',
      price: 6.99,
      originalPrice: 6.99,
      ingredients: ['bread', 'garlic butter', 'herbs'],
      sizes: ['regular'],
      isFavourite: false,
    },
    {
      categoryName: 'Breads',
      name: 'Bruschetta',
      description:
        'Toasted baguette topped with tomatoes, basil, and balsamic glaze',
      price: 9.99,
      originalPrice: 9.99,
      ingredients: ['baguette', 'tomatoes', 'basil', 'balsamic glaze'],
      sizes: ['regular'],
      isFavourite: false,
    },
  ],

  wingSauces: [
    { name: 'BBQ', description: 'Classic barbecue sauce' },
    { name: 'Hot', description: 'Spicy hot sauce' },
    { name: 'Medium', description: 'Medium heat level sauce' },
    { name: 'Mild', description: 'Mild heat level sauce' },
    { name: 'Suicide', description: 'Extremely hot sauce' },
    { name: 'Honey Garlic', description: 'Sweet honey garlic sauce' },
    { name: 'Buffalo', description: 'Classic buffalo wing sauce' },
    { name: 'Teriyaki', description: 'Sweet Japanese-style sauce' },
    { name: 'Lemon Pepper', description: 'Zesty lemon and black pepper' },
    { name: 'Sweet Chili', description: 'Thai-inspired sweet and spicy sauce' },
    { name: 'bbq', description: '' },
  ],

  substituteSides: [
    { name: 'Sweet Potato Fries', price: 3.0 },
    { name: 'Onion Rings', price: 3.0 },
    { name: 'Caesar Salad', price: 3.0 },
    { name: 'House Salad', price: 2.5 },
    { name: 'Coleslaw', price: 2.5 },
    { name: 'Mashed Potatoes', price: 3.5 },
    { name: 'Rice Pilaf', price: 3.0 },
    { name: 'Steamed Vegetables', price: 3.5 },
    { name: 'Sweet Potato', price: 3.0 },
  ],

  addons: [
    // Salad addons
    {
      itemName: 'Caesar Salad',
      name: 'Add Chicken',
      price: 5.0,
      categoryType: 'protein',
      description: 'Grilled chicken breast',
    },
    {
      itemName: 'Caesar Salad',
      name: 'Add Shrimp',
      price: 6.0,
      categoryType: 'protein',
      description: 'Grilled shrimp',
    },
    {
      itemName: 'Greek Salad',
      name: 'Add Chicken',
      price: 5.0,
      categoryType: 'protein',
      description: 'Grilled chicken breast',
    },
    {
      itemName: 'Greek Salad',
      name: 'Add Feta',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Extra feta cheese',
    },
    {
      itemName: 'House Salad',
      name: 'Add Chicken',
      price: 5.0,
      categoryType: 'protein',
      description: 'Grilled chicken breast',
    },
    {
      itemName: 'House Salad',
      name: 'Add Avocado',
      price: 2.5,
      categoryType: 'vegetable',
      description: 'Fresh avocado slices',
    },
    {
      itemName: 'Chicken Garden Salad',
      name: 'Extra Chicken',
      price: 4.99,
      categoryType: 'protein',
      description: 'Additional chicken portion',
    },
    {
      itemName: 'Chicken Garden Salad',
      name: 'Add Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'Crispy bacon bits',
    },
    {
      itemName: 'Taco Salad',
      name: 'Extra Beef',
      price: 4.99,
      categoryType: 'protein',
      description: 'Additional seasoned ground beef',
    },
    {
      itemName: 'Taco Salad',
      name: 'Add Guacamole',
      price: 2.99,
      categoryType: 'sauce',
      description: 'Fresh guacamole',
    },

    // Wings addons
    {
      itemName: "Pearson's Famous Wings",
      name: 'Extra Sauce',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Additional wing sauce portion',
    },
    {
      itemName: "Pearson's Famous Wings",
      name: 'Blue Cheese Dip',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Creamy blue cheese dipping sauce',
    },
    {
      itemName: 'Boneless Wings',
      name: 'Extra Sauce',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Additional wing sauce portion',
    },
    {
      itemName: 'Boneless Wings',
      name: 'Ranch Dip',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Cool ranch dipping sauce',
    },

    // Burger addons
    {
      itemName: 'House Burger',
      name: 'Add Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'Crispy bacon strips',
    },
    {
      itemName: 'House Burger',
      name: 'Extra Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Additional cheese portion',
    },
    {
      itemName: 'House Burger',
      name: 'Add Mushrooms',
      price: 2.5,
      categoryType: 'vegetable',
      description: 'Sautéed mushrooms',
    },
    {
      itemName: 'The Pearson Burger',
      name: 'Extra Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'Additional bacon strips',
    },
    {
      itemName: 'The Pearson Burger',
      name: 'Extra Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Additional cheddar cheese',
    },
    {
      itemName: 'BBQ Bacon Burger',
      name: 'Extra Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'More crispy bacon',
    },
    {
      itemName: 'BBQ Bacon Burger',
      name: 'Onion Rings',
      price: 2.99,
      categoryType: 'vegetable',
      description: 'Crispy onion rings',
    },
    {
      itemName: 'Mushroom Swiss Burger',
      name: 'Extra Mushrooms',
      price: 2.5,
      categoryType: 'vegetable',
      description: 'More sautéed mushrooms',
    },
    {
      itemName: 'Mushroom Swiss Burger',
      name: 'Extra Swiss',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Additional Swiss cheese',
    },
    {
      itemName: 'Double Cheeseburger',
      name: 'Third Patty',
      price: 5.99,
      categoryType: 'protein',
      description: 'Make it a triple!',
    },
    {
      itemName: 'Double Cheeseburger',
      name: 'Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'Add crispy bacon',
    },
    {
      itemName: 'Veggie Burger',
      name: 'Extra Avocado',
      price: 2.5,
      categoryType: 'vegetable',
      description: 'More fresh avocado',
    },
    {
      itemName: 'Veggie Burger',
      name: 'Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Your choice of cheese',
    },

    // Wrap addons
    {
      itemName: 'Chicken Club Wrap',
      name: 'Extra Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'Additional bacon',
    },
    {
      itemName: 'Chicken Club Wrap',
      name: 'Add Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Your choice of cheese',
    },
    {
      itemName: 'Buffalo Chicken Wrap',
      name: 'Extra Spicy',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Make it extra spicy',
    },
    {
      itemName: 'Buffalo Chicken Wrap',
      name: 'Add Ranch',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Cool ranch dressing',
    },
    {
      itemName: 'Mediterranean Wrap',
      name: 'Extra Feta',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Additional feta cheese',
    },
    {
      itemName: 'Mediterranean Wrap',
      name: 'Extra Olives',
      price: 1.99,
      categoryType: 'vegetable',
      description: 'More black olives',
    },
    {
      itemName: 'Turkey Club Wrap',
      name: 'Extra Turkey',
      price: 4.99,
      categoryType: 'protein',
      description: 'Additional turkey slices',
    },
    {
      itemName: 'Turkey Club Wrap',
      name: 'Avocado',
      price: 2.5,
      categoryType: 'vegetable',
      description: 'Fresh avocado slices',
    },
    {
      itemName: 'Veggie Wrap',
      name: 'Extra Hummus',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Additional hummus spread',
    },
    {
      itemName: 'Veggie Wrap',
      name: 'Add Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Your choice of cheese',
    },

    // Starter addons
    {
      itemName: 'French Fries',
      name: 'Add Gravy',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Rich brown gravy',
    },
    {
      itemName: 'French Fries',
      name: 'Add Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Melted cheese sauce',
    },
    {
      itemName: 'Mozzarella Sticks',
      name: 'Extra Marinara',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Additional marinara sauce',
    },
    {
      itemName: 'Mozzarella Sticks',
      name: 'Ranch Dip',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Ranch dipping sauce',
    },
    {
      itemName: 'Onion Rings',
      name: 'Extra Ranch',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Additional ranch sauce',
    },
    {
      itemName: 'Onion Rings',
      name: 'Chipotle Mayo',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Spicy chipotle mayo',
    },
    {
      itemName: 'Loaded Nachos',
      name: 'Extra Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'More melted cheese',
    },
    {
      itemName: 'Loaded Nachos',
      name: 'Extra Jalapeños',
      price: 1.99,
      categoryType: 'vegetable',
      description: 'More jalapeño peppers',
    },
    {
      itemName: 'Chicken Wings',
      name: 'Extra Sauce',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Additional wing sauce',
    },
    {
      itemName: 'Chicken Wings',
      name: 'Blue Cheese',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Blue cheese dip',
    },
    {
      itemName: 'Calamari Rings',
      name: 'Extra Aioli',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Additional garlic aioli',
    },
    {
      itemName: 'Calamari Rings',
      name: 'Spicy Mayo',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Spicy mayonnaise',
    },
    {
      itemName: 'Spinach & Artichoke Dip',
      name: 'Extra Chips',
      price: 2.99,
      categoryType: 'side',
      description: 'Additional tortilla chips',
    },
    {
      itemName: 'Spinach & Artichoke Dip',
      name: 'Bread Bowl',
      price: 3.99,
      categoryType: 'side',
      description: 'Serve in a bread bowl',
    },

    // Sandwich addons
    {
      itemName: 'BLT Classic',
      name: 'Extra Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'More crispy bacon',
    },
    {
      itemName: 'BLT Classic',
      name: 'Avocado',
      price: 2.5,
      categoryType: 'vegetable',
      description: 'Fresh avocado slices',
    },
    {
      itemName: 'Grilled Chicken Sandwich',
      name: 'Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'Add crispy bacon',
    },
    {
      itemName: 'Grilled Chicken Sandwich',
      name: 'Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Your choice of cheese',
    },
    {
      itemName: 'Philly Cheesesteak',
      name: 'Extra Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'More provolone cheese',
    },
    {
      itemName: 'Philly Cheesesteak',
      name: 'Extra Meat',
      price: 5.99,
      categoryType: 'protein',
      description: 'Additional ribeye',
    },
    {
      itemName: 'The Pearson Club',
      name: 'Extra Meat',
      price: 5.99,
      categoryType: 'protein',
      description: 'More turkey and ham',
    },
    {
      itemName: 'The Pearson Club',
      name: 'Avocado',
      price: 2.5,
      categoryType: 'vegetable',
      description: 'Fresh avocado',
    },
    {
      itemName: 'Fish & Chips Sandwich',
      name: 'Extra Tartar',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Additional tartar sauce',
    },
    {
      itemName: 'Fish & Chips Sandwich',
      name: 'Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Add cheese',
    },

    // Poutine addons
    {
      itemName: 'Classic Poutine',
      name: 'Extra Gravy',
      price: 1.99,
      categoryType: 'sauce',
      description: 'More rich gravy',
    },
    {
      itemName: 'Classic Poutine',
      name: 'Extra Curds',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Additional cheese curds',
    },
    {
      itemName: 'Bacon Poutine',
      name: 'Extra Bacon',
      price: 3.99,
      categoryType: 'protein',
      description: 'More bacon pieces',
    },
    {
      itemName: 'Bacon Poutine',
      name: 'Green Onions',
      price: 1.5,
      categoryType: 'vegetable',
      description: 'Fresh green onions',
    },
    {
      itemName: 'Pulled Pork Poutine',
      name: 'Extra Pork',
      price: 4.99,
      categoryType: 'protein',
      description: 'Additional pulled pork',
    },
    {
      itemName: 'Pulled Pork Poutine',
      name: 'BBQ Sauce',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Extra BBQ sauce drizzle',
    },

    // Nacho addons
    {
      itemName: 'Supreme Nachos',
      name: 'Extra Beef',
      price: 4.99,
      categoryType: 'protein',
      description: 'More seasoned ground beef',
    },
    {
      itemName: 'Supreme Nachos',
      name: 'Guacamole',
      price: 2.99,
      categoryType: 'sauce',
      description: 'Fresh guacamole',
    },
    {
      itemName: 'Chicken Nachos',
      name: 'Extra Chicken',
      price: 4.99,
      categoryType: 'protein',
      description: 'More seasoned chicken',
    },
    {
      itemName: 'Chicken Nachos',
      name: 'Sour Cream',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Cool sour cream',
    },

    // Kids Meal addons
    {
      itemName: 'Kids Burger',
      name: 'Cheese',
      price: 1.99,
      categoryType: 'cheese',
      description: 'Add cheese slice',
    },
    {
      itemName: 'Kids Burger',
      name: 'Extra Fries',
      price: 2.99,
      categoryType: 'side',
      description: 'Additional fries',
    },
    {
      itemName: 'Kids Chicken Nuggets',
      name: 'Extra Nuggets',
      price: 2.99,
      categoryType: 'protein',
      description: '2 more nuggets',
    },
    {
      itemName: 'Kids Chicken Nuggets',
      name: 'Ranch Dip',
      price: 1.5,
      categoryType: 'sauce',
      description: 'Ranch dipping sauce',
    },
    {
      itemName: 'Kids Mac & Cheese',
      name: 'Extra Cheese',
      price: 1.99,
      categoryType: 'cheese',
      description: 'More cheese sauce',
    },
    {
      itemName: 'Kids Mac & Cheese',
      name: 'Bacon Bits',
      price: 2.99,
      categoryType: 'protein',
      description: 'Crispy bacon bits',
    },

    // Dessert addons
    {
      itemName: 'Chocolate Brownie Sundae',
      name: 'Extra Ice Cream',
      price: 2.99,
      categoryType: 'side',
      description: 'Additional scoop of ice cream',
    },
    {
      itemName: 'Chocolate Brownie Sundae',
      name: 'Whipped Cream',
      price: 1.5,
      categoryType: 'topping',
      description: 'Fresh whipped cream',
    },
    {
      itemName: 'Cheesecake',
      name: 'Extra Berries',
      price: 2.5,
      categoryType: 'topping',
      description: 'Additional berry compote',
    },
    {
      itemName: 'Cheesecake',
      name: 'Chocolate Drizzle',
      price: 1.99,
      categoryType: 'topping',
      description: 'Rich chocolate sauce',
    },
    {
      itemName: 'Apple Pie à la Mode',
      name: 'Extra Ice Cream',
      price: 2.99,
      categoryType: 'side',
      description: 'Additional vanilla ice cream',
    },
    {
      itemName: 'Apple Pie à la Mode',
      name: 'Caramel Sauce',
      price: 1.99,
      categoryType: 'topping',
      description: 'Warm caramel drizzle',
    },

    // Main dish addons
    {
      itemName: 'Ribeye Steak',
      name: 'Grilled Shrimp',
      price: 8.99,
      categoryType: 'protein',
      description: 'Surf and turf upgrade',
    },
    {
      itemName: 'Ribeye Steak',
      name: 'Mushroom Sauce',
      price: 2.99,
      categoryType: 'sauce',
      description: 'Rich mushroom sauce',
    },
    {
      itemName: 'BBQ Ribs',
      name: 'Extra Ribs',
      price: 12.99,
      categoryType: 'protein',
      description: 'Half rack additional ribs',
    },
    {
      itemName: 'BBQ Ribs',
      name: 'Extra BBQ Sauce',
      price: 1.99,
      categoryType: 'sauce',
      description: 'More BBQ sauce',
    },
    {
      itemName: 'Fish & Chips',
      name: 'Extra Fish',
      price: 6.99,
      categoryType: 'protein',
      description: 'Additional cod piece',
    },
    {
      itemName: 'Fish & Chips',
      name: 'Mushy Peas',
      price: 2.99,
      categoryType: 'side',
      description: 'Traditional mushy peas',
    },

    // Curry addons
    {
      itemName: 'Chicken Curry',
      name: 'Extra Spicy',
      price: 0.0,
      categoryType: 'spice',
      description: 'Make it extra spicy',
    },
    {
      itemName: 'Chicken Curry',
      name: 'Naan Bread',
      price: 3.99,
      categoryType: 'side',
      description: 'Fresh naan bread',
    },
    {
      itemName: 'Vegetable Curry',
      name: 'Add Chicken',
      price: 5.99,
      categoryType: 'protein',
      description: 'Add chicken to veggie curry',
    },
    {
      itemName: 'Vegetable Curry',
      name: 'Extra Rice',
      price: 2.99,
      categoryType: 'side',
      description: 'Additional basmati rice',
    },

    // Pasta addons
    {
      itemName: 'Spaghetti & Meatballs',
      name: 'Extra Meatballs',
      price: 4.99,
      categoryType: 'protein',
      description: '3 additional meatballs',
    },
    {
      itemName: 'Spaghetti & Meatballs',
      name: 'Garlic Bread',
      price: 3.99,
      categoryType: 'side',
      description: 'Fresh garlic bread',
    },
    {
      itemName: 'Fettuccine Alfredo',
      name: 'Add Chicken',
      price: 5.99,
      categoryType: 'protein',
      description: 'Grilled chicken breast',
    },
    {
      itemName: 'Fettuccine Alfredo',
      name: 'Add Shrimp',
      price: 7.99,
      categoryType: 'protein',
      description: 'Grilled shrimp',
    },
    {
      itemName: 'Chicken Parmesan Pasta',
      name: 'Extra Chicken',
      price: 5.99,
      categoryType: 'protein',
      description: 'Additional chicken breast',
    },
    {
      itemName: 'Chicken Parmesan Pasta',
      name: 'Extra Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'More mozzarella cheese',
    },

    // Bread addons
    {
      itemName: 'Garlic Bread',
      name: 'Extra Garlic',
      price: 1.5,
      categoryType: 'flavor',
      description: 'Extra garlic butter',
    },
    {
      itemName: 'Garlic Bread',
      name: 'Cheese',
      price: 2.99,
      categoryType: 'cheese',
      description: 'Melted mozzarella',
    },
    {
      itemName: 'Bruschetta',
      name: 'Extra Basil',
      price: 1.5,
      categoryType: 'herb',
      description: 'Fresh basil leaves',
    },
    {
      itemName: 'Bruschetta',
      name: 'Balsamic Reduction',
      price: 1.99,
      categoryType: 'sauce',
      description: 'Extra balsamic glaze',
    },
  ],
};

async function injectFullMenuSet() {
  const stats = {
    categories: { existing: 0, new: 0, skipped: 0 },
    items: { existing: 0, new: 0, skipped: 0 },
    wingSauces: { existing: 0, new: 0, skipped: 0 },
    substituteSides: { existing: 0, new: 0, skipped: 0 },
    addons: { existing: 0, new: 0, skipped: 0 },
  };

  try {
    await client.connect();
    console.log('🔌 Connected to database');
    console.log('🚀 COMPREHENSIVE MENU INJECTION STARTED');
    console.log('='.repeat(60));

    // Get superadmin for item creation
    const adminResult = await client.query(
      "SELECT id FROM admins WHERE role = 'superadmin' LIMIT 1",
    );
    if (adminResult.rows.length === 0) {
      throw new Error('No superadmin found. Please create a superadmin first.');
    }
    const superadminId = adminResult.rows[0].id;

    // 1. INJECT CATEGORIES
    console.log('\n📂 INJECTING CATEGORIES:');
    console.log('-'.repeat(30));

    for (const category of COMPLETE_MENU_DATA.categories) {
      const existingCategory = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [category.name],
      );

      if (existingCategory.rows.length > 0) {
        console.log(`   ⏭️  SKIPPED: ${category.name} (already exists)`);
        stats.categories.skipped++;
        stats.categories.existing++;
      } else {
        await client.query(
          'INSERT INTO categories (name, description) VALUES ($1, $2)',
          [category.name, category.description],
        );
        console.log(`   ✅ ADDED: ${category.name}`);
        stats.categories.new++;
      }
    }

    // 2. INJECT ITEMS
    console.log('\n🍽️  INJECTING MENU ITEMS:');
    console.log('-'.repeat(30));

    for (const item of COMPLETE_MENU_DATA.items) {
      // Get category ID
      const categoryResult = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [item.categoryName],
      );
      if (categoryResult.rows.length === 0) {
        console.log(
          `   ❌ ERROR: Category ${item.categoryName} not found for item ${item.name}`,
        );
        continue;
      }
      const categoryId = categoryResult.rows[0].id;

      // Check if item exists
      const existingItem = await client.query(
        'SELECT id FROM items WHERE name = $1 AND category_id = $2',
        [item.name, categoryId],
      );

      if (existingItem.rows.length > 0) {
        console.log(`   ⏭️  SKIPPED: ${item.name} (already exists)`);
        stats.items.skipped++;
        stats.items.existing++;
      } else {
        await client.query(
          `
          INSERT INTO items (
            category_id, name, description, original_price, price, 
            ingredients, sizes, is_favourite, last_edited_by_admin_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            categoryId,
            item.name,
            item.description,
            item.originalPrice,
            item.price,
            item.ingredients,
            item.sizes,
            item.isFavourite,
            superadminId,
          ],
        );
        console.log(`   ✅ ADDED: ${item.name} ($${item.price})`);
        stats.items.new++;
      }
    }

    // 3. INJECT WING SAUCES
    console.log('\n🌶️  INJECTING WING SAUCES:');
    console.log('-'.repeat(30));

    for (const sauce of COMPLETE_MENU_DATA.wingSauces) {
      const existingSauce = await client.query(
        'SELECT id FROM wing_sauces WHERE name = $1',
        [sauce.name],
      );

      if (existingSauce.rows.length > 0) {
        console.log(`   ⏭️  SKIPPED: ${sauce.name} (already exists)`);
        stats.wingSauces.skipped++;
        stats.wingSauces.existing++;
      } else {
        await client.query(
          'INSERT INTO wing_sauces (name, description) VALUES ($1, $2)',
          [sauce.name, sauce.description],
        );
        console.log(`   ✅ ADDED: ${sauce.name}`);
        stats.wingSauces.new++;
      }
    }

    // 4. INJECT SUBSTITUTE SIDES
    console.log('\n🥔 INJECTING SUBSTITUTE SIDES:');
    console.log('-'.repeat(30));

    for (const side of COMPLETE_MENU_DATA.substituteSides) {
      const existingSide = await client.query(
        'SELECT id FROM substitute_sides WHERE name = $1',
        [side.name],
      );

      if (existingSide.rows.length > 0) {
        console.log(`   ⏭️  SKIPPED: ${side.name} (already exists)`);
        stats.substituteSides.skipped++;
        stats.substituteSides.existing++;
      } else {
        await client.query(
          'INSERT INTO substitute_sides (name, price) VALUES ($1, $2)',
          [side.name, side.price],
        );
        console.log(`   ✅ ADDED: ${side.name} (+$${side.price})`);
        stats.substituteSides.new++;
      }
    }

    // 5. INJECT ADDONS
    console.log('\n🔧 INJECTING ADDONS:');
    console.log('-'.repeat(30));

    for (const addon of COMPLETE_MENU_DATA.addons) {
      // Get item ID
      const itemResult = await client.query(
        `
        SELECT i.id FROM items i 
        JOIN categories c ON i.category_id = c.id 
        WHERE i.name = $1
      `,
        [addon.itemName],
      );

      if (itemResult.rows.length === 0) {
        console.log(
          `   ❌ ERROR: Item ${addon.itemName} not found for addon ${addon.name}`,
        );
        continue;
      }
      const itemId = itemResult.rows[0].id;

      // Check if addon exists
      const existingAddon = await client.query(
        'SELECT id FROM addons WHERE name = $1 AND item_id = $2',
        [addon.name, itemId],
      );

      if (existingAddon.rows.length > 0) {
        console.log(
          `   ⏭️  SKIPPED: ${addon.name} for ${addon.itemName} (already exists)`,
        );
        stats.addons.skipped++;
        stats.addons.existing++;
      } else {
        await client.query(
          `
          INSERT INTO addons (item_id, name, price, category_type, description)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            itemId,
            addon.name,
            addon.price,
            addon.categoryType,
            addon.description,
          ],
        );
        console.log(
          `   ✅ ADDED: ${addon.name} for ${addon.itemName} (+$${addon.price})`,
        );
        stats.addons.new++;
      }
    }

    // FINAL STATISTICS
    console.log('\n\n📊 INJECTION COMPLETE - FINAL STATISTICS');
    console.log('='.repeat(60));

    console.log('\n📂 CATEGORIES:');
    console.log(`   Existing: ${stats.categories.existing}`);
    console.log(`   New Added: ${stats.categories.new}`);
    console.log(`   Skipped: ${stats.categories.skipped}`);
    console.log(`   Total Expected: ${COMPLETE_MENU_DATA.categories.length}`);

    console.log('\n🍽️  MENU ITEMS:');
    console.log(`   Existing: ${stats.items.existing}`);
    console.log(`   New Added: ${stats.items.new}`);
    console.log(`   Skipped: ${stats.items.skipped}`);
    console.log(`   Total Expected: ${COMPLETE_MENU_DATA.items.length}`);

    console.log('\n🌶️  WING SAUCES:');
    console.log(`   Existing: ${stats.wingSauces.existing}`);
    console.log(`   New Added: ${stats.wingSauces.new}`);
    console.log(`   Skipped: ${stats.wingSauces.skipped}`);
    console.log(`   Total Expected: ${COMPLETE_MENU_DATA.wingSauces.length}`);

    console.log('\n🥔 SUBSTITUTE SIDES:');
    console.log(`   Existing: ${stats.substituteSides.existing}`);
    console.log(`   New Added: ${stats.substituteSides.new}`);
    console.log(`   Skipped: ${stats.substituteSides.skipped}`);
    console.log(
      `   Total Expected: ${COMPLETE_MENU_DATA.substituteSides.length}`,
    );

    console.log('\n🔧 ADDONS:');
    console.log(`   Existing: ${stats.addons.existing}`);
    console.log(`   New Added: ${stats.addons.new}`);
    console.log(`   Skipped: ${stats.addons.skipped}`);
    console.log(`   Total Expected: ${COMPLETE_MENU_DATA.addons.length}`);

    // DATABASE VERIFICATION
    console.log('\n\n🔍 DATABASE VERIFICATION:');
    console.log('='.repeat(40));

    const dbStats = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM categories'),
      client.query('SELECT COUNT(*) as count FROM items'),
      client.query('SELECT COUNT(*) as count FROM wing_sauces'),
      client.query('SELECT COUNT(*) as count FROM substitute_sides'),
      client.query('SELECT COUNT(*) as count FROM addons'),
    ]);

    console.log(`📂 Categories in DB: ${dbStats[0].rows[0].count}`);
    console.log(`🍽️  Items in DB: ${dbStats[1].rows[0].count}`);
    console.log(`🌶️  Wing Sauces in DB: ${dbStats[2].rows[0].count}`);
    console.log(`🥔 Substitute Sides in DB: ${dbStats[3].rows[0].count}`);
    console.log(`🔧 Addons in DB: ${dbStats[4].rows[0].count}`);

    // SUMMARY
    const totalNew =
      stats.categories.new +
      stats.items.new +
      stats.wingSauces.new +
      stats.substituteSides.new +
      stats.addons.new;
    const totalExisting =
      stats.categories.existing +
      stats.items.existing +
      stats.wingSauces.existing +
      stats.substituteSides.existing +
      stats.addons.existing;

    console.log('\n🎉 INJECTION SUMMARY:');
    console.log('='.repeat(30));
    console.log(`✅ Total New Items Added: ${totalNew}`);
    console.log(`⏭️  Total Existing Items: ${totalExisting}`);
    console.log(
      `🗄️  Total Database Records: ${parseInt(dbStats[0].rows[0].count) + parseInt(dbStats[1].rows[0].count) + parseInt(dbStats[2].rows[0].count) + parseInt(dbStats[3].rows[0].count) + parseInt(dbStats[4].rows[0].count)}`,
    );

    if (totalNew > 0) {
      console.log(
        `\n🚀 SUCCESS: ${totalNew} new items were added to the database!`,
      );
    } else {
      console.log(`\n✨ All menu items already exist in the database!`);
    }

    console.log('\n✅ Full menu set injection completed successfully!');
  } catch (error) {
    console.error('❌ Menu injection failed:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

injectFullMenuSet();
