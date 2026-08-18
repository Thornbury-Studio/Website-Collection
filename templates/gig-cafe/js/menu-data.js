/* =============================================================================
   GIG Cafe — menu data. Single source of truth for menu.html and the home
   page's price callouts. Every figure here was read off the cafe's published
   "GIG Menu Tampines 2026" (August 2026); nothing is invented.

   Rules the renderer enforces:
   - price: null renders as "Seasonal" — used for rotating specials whose
     per-drink price is not published. The site never prints a number the
     counter is not charging.
   - variants: [{label, price}] for items sold in more than one form
     (chicken/bacon, hot/iced). Rendered as "label price · label price".
   - All prices are before service charge and prevailing government taxes,
     stated once in the menu page footnote, matching the printed menu.
   ============================================================================= */

window.GIG_MENU = {
  currency: '$',
  groups: [
    {
      id: 'dream',
      name: 'Dream Cloud Series',
      note: 'Rotating cream-cloud specials, from $6.90 — priced at the counter.',
      items: [
        { name: 'Strawberry Matcha Dream', desc: 'Crushed strawberry, fresh milk and cold-whisked matcha in layers under a whipped cream cloud.', price: null, tag: 'Signature' },
        { name: 'Golden Sunrise Cloud', desc: 'Orange juice brightened with coffee cream.', price: null },
        { name: 'Pistachio Coconut Cloud', desc: 'Pistachio and coconut under the cloud.', price: null },
        { name: 'Sunset Orange Sea', desc: 'Americano poured over orange with cloud foam.', price: null }
      ]
    },
    {
      id: 'brunch',
      name: 'Brunch',
      note: 'Served 10am–3pm.',
      items: [
        { name: 'GIG Big Breakfast', desc: 'Artisan sourdough, eggs your way, chicken garlic sausage, bacon, sautéed mushrooms, herb-roasted potatoes, roasted tomato, mesclun greens.', price: 19.90 },
        { name: 'Salmon Egg Benedict', desc: 'Artisan sourdough, fried onsen egg, smoked salmon, béarnaise, tomato salsa, bacon bits.', price: 17.90 },
        { name: 'Avocado On Toast', desc: 'Guacamole on sourdough with bacon, fried onsen egg, tomato salsa, dried cranberry.', price: 15.90 },
        { name: 'Truffle Tri-room On Toast', desc: 'Three mixed mushrooms and truffle scrambled egg on sourdough.', price: 17.90 },
        { name: 'Shakshouka Baked Eggs', desc: 'Eggs baked in homemade capsicum-tomato sauce with spinach, beans and smoked chicken chorizo, served with sourdough.', price: 18.90 },
        { name: 'Breakfast Waffle', desc: 'Belgian waffle, scrambled eggs, chicken garlic sausage, fresh strawberries, blueberries, grapes, maple syrup. Add banana $1.50.', price: 16.90 }
      ]
    },
    {
      id: 'starters',
      name: 'Starters & Salads',
      items: [
        { name: 'Truffle Mushroom Soup', desc: 'With herb-spiced croutons.', price: 5.90 },
        { name: 'Caesar Salad', desc: 'Baby romaine, soft-boiled egg, herb croutons, bacon bits, Caesar dressing.', variants: [ { label: 'Chicken', price: 12.90 }, { label: 'Smoked Salmon', price: 14.90 } ] },
        { name: 'Fruit Detox Salad', desc: 'Mesclun, mixed fruit, goji berries, fresh berries, barley, almond, dried cranberry, house dressing.', price: 10.90 },
        { name: 'Chicken Salad', desc: 'Chicken thigh, mesclun, cherry tomatoes, cucumber, house dressing.', price: 12.90 }
      ]
    },
    {
      id: 'bites',
      name: 'Bites & Sharing',
      items: [
        { name: 'Korean Wings', desc: 'Six mid-wings in Korean spicy or bulgogi sauce, white sesame, parsley.', price: 13.90, spicy: true },
        { name: 'Light Bite Platter', desc: 'Four bulgogi mid-wings, popcorn chicken, spam fries, truffle fries, mesclun.', price: 28.90 },
        { name: 'Seafood Stew', desc: 'Mussels, prawns, flower squid and asari clams, classic or tomato, with artisan sourdough.', price: 15.90, spicy: true },
        { name: 'Gambas Al Ajillo', desc: 'Garlic prawns with artisan sourdough.', price: 18.90 },
        { name: 'Fish & Chips', desc: 'Battered dory, shoestring fries, mesclun, homemade tartar.', price: 15.90 },
        { name: 'Truffle Fries', desc: 'Shoestring fries, Grana Padano, homemade truffle sauce.', price: 10.90 },
        { name: 'Mentaiko Fries', desc: 'Shoestring fries under homemade mentaiko sauce.', price: 13.90 },
        { name: 'Parmesan Truffle Tater Tots', desc: 'Tater tots, truffle oil, grated cheese.', price: 12.90 },
        { name: 'Spam Fries', desc: 'With guacamole, lime mayo and cherry-tomato salsa.', price: 12.90 },
        { name: 'Nacho Cheese Fries', desc: 'Shoestring fries, nacho cheese sauce, homemade mayo.', price: 8.90 },
        { name: 'Crispy Nuggets', desc: 'Ten chicken nuggets.', price: 10.90 },
        { name: 'French Fries', desc: 'Plain shoestring fries.', price: 6.90 }
      ]
    },
    {
      id: 'mains',
      name: 'Mains',
      items: [
        { name: 'Wagyu Beef Striploin', desc: 'With guacamole, mashed potato, orange segments, baby asparagus, cherry tomato in olive oil, koikuchi sauce.', price: 25.90 },
        { name: 'Hawaiian Pork Steaks', desc: 'With mashed potato, pineapple, baby asparagus, cherry tomatoes.', price: 17.90 },
        { name: 'Pan-Fried Salmon', desc: 'With mashed potato, mesclun greens, lemon butter sauce.', price: 17.90 },
        { name: 'Crispy Half Spring Chicken', desc: 'With baked potato, mesclun greens, mushroom sauce.', price: 17.90 }
      ]
    },
    {
      id: 'ricedon',
      name: 'Rice Dons',
      note: 'Add rice $1.50 · add sunny-side-up egg $1.50.',
      items: [
        { name: 'Golden Crispy Pork Rice', desc: 'Pork collar, yellow onion, brown sauce, Japanese white rice, mesclun.', price: 13.90 },
        { name: 'Shabu Beef Bulgogi Rice', desc: 'Shabu beef, yellow onion, carrot, bulgogi sauce, Japanese white rice.', price: 13.90 },
        { name: 'Bulgogi Chicken Rice', desc: 'Boneless chicken leg, yellow onion, spring onion, carrot, bulgogi sauce.', price: 12.90 },
        { name: 'Gochujang Spicy Chicken Rice', desc: 'Boneless chicken leg, yellow onion, spring onion, gochujang sauce.', price: 12.90, spicy: true }
      ]
    },
    {
      id: 'pasta',
      name: 'Pasta',
      items: [
        { name: 'Carbonara', desc: 'Onsen egg, mushrooms, onions, cream sauce.', variants: [ { label: 'Chicken', price: 11.90 }, { label: 'Bacon', price: 12.90 } ] },
        { name: 'Aglio-Olio', desc: 'Garlic, chilli padi, herbs.', variants: [ { label: 'Chicken', price: 11.90 }, { label: 'Bacon', price: 12.90 } ], spicy: true },
        { name: 'Creamy Scallop Pink Rose Pasta', desc: 'Scallops, mushrooms, bacon, onion, tobiko, cream sauce.', price: 18.90 },
        { name: 'Seafood Laksa Pasta', desc: 'Mussels, squid, prawns and asari clams in laksa cream.', price: 18.90, spicy: true, tag: 'House favourite' },
        { name: 'Seafood Arrabbiata Pasta', desc: 'Mussels, squid, prawns and asari clams in spicy tomato.', price: 18.90, spicy: true }
      ]
    },
    {
      id: 'dessert',
      name: 'Waffles & Gelato',
      note: 'Gelato flavours: Chocolate Indulgence, Premium Vanilla, Salty Peanut Butter, Strawberry Basil, Earl Gray Lavender.',
      items: [
        { name: 'Matcha Mochi Waffle', desc: 'Belgian waffle with gelato, mixed berries compote and fresh blueberries.', price: 16.90, tag: 'GIG special' },
        { name: 'Banana Brûlée', desc: 'Belgian waffle with gelato, caramelised bananas, maple syrup, fresh strawberries, blueberries.', price: 15.90 },
        { name: 'Summer Fruit Fusion', desc: 'Belgian waffle with gelato, maple syrup, strawberries, blueberries, peaches, grapes.', price: 15.90 },
        { name: 'Chocolate Three-Ways', desc: 'Chocolate Belgian waffle with gelato, chocolate syrup, strawberries, blueberries, peaches.', price: 15.90 },
        { name: 'Classic Berries', desc: 'Belgian waffle with gelato, mixed berries compote, fresh strawberries, blueberries.', price: 15.90 },
        { name: 'Belgian Waffle', desc: 'With one scoop of gelato and syrup.', price: 10.90 }
      ]
    },
    {
      id: 'signature',
      name: 'Signature Drinks',
      items: [
        { name: 'Strawberry Matcha Latte', desc: 'The layered house pour, iced.', price: 8.90, tag: 'Signature' },
        { name: 'Rose Latte', desc: '', variants: [ { label: 'Hot', price: 5.90 }, { label: 'Iced', price: 6.90 } ] },
        { name: 'Blue Honey Milk', desc: '', variants: [ { label: 'Hot', price: 5.90 }, { label: 'Iced', price: 6.90 } ] },
        { name: 'Pandan Coconut Latte', desc: '', price: 6.90 },
        { name: 'Coconut Americano', desc: '', price: 6.90 },
        { name: 'Iced Rose Blossom', desc: '', price: 6.90 },
        { name: 'Lemon Bluepea Fizzy', desc: '', price: 6.90 },
        { name: 'Passionfruit Spritzer', desc: '', price: 6.90 },
        { name: 'Pink Lychee Soda', desc: '', price: 6.90 },
        { name: 'Sour Plum Cola', desc: '', price: 6.90 },
        { name: 'Root Beer Float', desc: '', price: 6.90 },
        { name: 'Iced Lemon Tea', desc: '', price: 4.90 }
      ]
    },
    {
      id: 'tea',
      name: 'Flower & Fragrance Teas',
      note: 'All teas $6.90, brewed in a glass pot.',
      items: [
        { name: 'Lemon Chrysanthemum', desc: 'Lemon and chrysanthemum flower.', price: 6.90 },
        { name: 'Longan Flower Tea', desc: 'Rose flower, longan, red date, goji berries.', price: 6.90 },
        { name: 'Goji Berries Flower Tea', desc: 'Goji berries, chrysanthemum, senna obtusifolia.', price: 6.90 },
        { name: 'Plum Flower Tea', desc: 'Plum, goji berries, senna obtusifolia.', price: 6.90 },
        { name: 'White Ginger Lily', desc: 'Organic white tea, galangal, lemongrass, eucalyptus, orange blossoms, lily, lavender.', price: 6.90 },
        { name: 'Earl Grey Lavender', desc: 'Black tea with oil of bergamot and lavender flowers.', price: 6.90 },
        { name: 'Chamomile Dream', desc: 'Chamomile, lemon verbena, lemongrass, marigold, lavender.', price: 6.90 },
        { name: 'Marrakesh Mint', desc: 'Green tea, peppermint, spearmint, lemongrass.', price: 6.90 },
        { name: 'Coba Cabana', desc: 'Rooibos, greenbush, lemon myrtle, candied mango and pineapple, peppermint, basil, lemon peel.', price: 6.90 },
        { name: 'Lily Of The Field', desc: 'Oolong tea, lily buds, eucalyptus, marigold petals.', price: 6.90 }
      ]
    },
    {
      id: 'coffee',
      name: 'Coffee & Classics',
      items: [
        { name: 'Caffe Latte', desc: '', variants: [ { label: 'Hot', price: 4.90 }, { label: 'Iced', price: 5.90 } ] },
        { name: 'Cappuccino', desc: '', variants: [ { label: 'Hot', price: 4.90 }, { label: 'Iced', price: 5.90 } ] },
        { name: 'Americano', desc: '', variants: [ { label: 'Hot', price: 3.90 }, { label: 'Iced', price: 4.90 } ] },
        { name: 'Espresso', desc: '', variants: [ { label: 'Single', price: 3.00 }, { label: 'Double', price: 5.00 } ] },
        { name: 'Vanilla Matcha Latte', desc: '', variants: [ { label: 'Hot', price: 6.90 }, { label: 'Iced', price: 7.90 } ] },
        { name: 'Chocolate', desc: '', variants: [ { label: 'Hot', price: 5.90 }, { label: 'Iced', price: 6.90 } ] },
        { name: 'Babyccino', desc: 'With cocoa powder and marshmallows.', variants: [ { label: 'Hot', price: 3.00 }, { label: 'Iced', price: 4.00 } ] },
        { name: 'Coconut Water', desc: '', price: 4.90 },
        { name: 'Soft Drink', desc: 'Coke, Coke Zero, root beer, soda or Sprite.', price: 3.90 },
        { name: 'Mineral Water', desc: '', price: 1.50 }
      ]
    }
  ]
};
