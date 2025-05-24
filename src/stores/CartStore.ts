// src/stores/CartStore.ts
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent'

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Load initial cart from localStorage
let initialCart: CartItem[] = [];
if (typeof window !== 'undefined' && localStorage.getItem('cart')) {
  try {
    initialCart = JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    console.error('Failed to parse cart from localStorage', e);
  }
}

// Create an atom store with the initial cart data
// export const cartItems = atom<CartItem[]>(initialCart);

// // Save cart to localStorage whenever it changes
// if (typeof window !== 'undefined') {
//   cartItems.listen((items) => {
//     localStorage.setItem('cart', JSON.stringify(items));
//   });
// }

// Create a persistent atom with 'cart' as the storage key
export const cartItems = persistentAtom<CartItem[]>('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Add item to cart
export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const currentItems = cartItems.get();
  const existingItem = currentItems.find(cartItem => cartItem.id === item.id);
  
  if (existingItem) {
    // Increase quantity if item already exists
    const updatedItems = currentItems.map(cartItem => 
      cartItem.id === item.id 
        ? { ...cartItem, quantity: cartItem.quantity + 1 } 
        : cartItem
    );
    cartItems.set(updatedItems);
  } else {
    // Add new item with quantity 1
    cartItems.set([...currentItems, { ...item, quantity: 1 }]);
  }
}

// Remove item from cart
export function removeFromCart(id: string) {
  const currentItems = cartItems.get();
  const updatedItems = currentItems.filter(item => item.id !== id);
  cartItems.set(updatedItems);
}

// Update item quantity
export function updateQuantity(id: string, quantity: number) {
  if (quantity < 1) return;
  
  const currentItems = cartItems.get();
  const updatedItems = currentItems.map(item => 
    item.id === id ? { ...item, quantity } : item
  );
  cartItems.set(updatedItems);
}

// Calculate cart total
export function getCartTotal(): number {
  return cartItems.get().reduce(
    (total, item) => total + item.price * item.quantity, 
    0
  );
}

// Get cart item count
export function getCartCount(): number {
  return cartItems.get().reduce(
    (count, item) => count + item.quantity, 
    0
  );
}

// Clear the cart
export function clearCart() {
  cartItems.set([]);
}


