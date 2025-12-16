import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { CartItem, Product } from '../../types/productTypes'

interface CartState {
  items: CartItem[]
  subtotalCents: number
  totalQuantity: number
}

const STORAGE_KEY = 'cartItems'

const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: CartItem[] = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map((item) => ({
      ...item,
      addedAt: item.addedAt || new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Failed to load cart from storage', error)
    return []
  }
}

const persistCart = (items: CartItem[]) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save cart', error)
  }
}

const getMaxQuantity = (item: { stock_quantity?: number | null }) =>
  typeof item.stock_quantity === 'number' && item.stock_quantity > 0 ? item.stock_quantity : 999

const computeTotals = (items: CartItem[]) => {
  const subtotalCents = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  return { subtotalCents, totalQuantity }
}

const initialItems = loadCartFromStorage()
const initialTotals = computeTotals(initialItems)

const initialState: CartState = {
  items: initialItems,
  subtotalCents: initialTotals.subtotalCents,
  totalQuantity: initialTotals.totalQuantity,
}

type ItemIdentifier = {
  cartKey: string
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{
        product: Product
        quantity?: number
        selectedColor?: string
        selectedSize?: string
      }>
    ) => {
      const { product, quantity = 1, selectedColor, selectedSize } = action.payload
      const cartKey = `${product.id}-${selectedColor || 'any'}-${selectedSize || 'any'}`
      const existing = state.items.find((item) => item.cartKey === cartKey)
      const maxQuantity = getMaxQuantity(product)

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, maxQuantity)
        existing.selectedColor = selectedColor
        existing.selectedSize = selectedSize
      } else {
        state.items.push({
          ...product,
          cartKey,
          quantity: Math.max(1, Math.min(quantity, maxQuantity)),
          addedAt: new Date().toISOString(),
          selectedColor,
          selectedSize,
        })
      }

      const totals = computeTotals(state.items)
      state.subtotalCents = totals.subtotalCents
      state.totalQuantity = totals.totalQuantity
      persistCart(state.items)
    },
    updateQuantity: (state, action: PayloadAction<ItemIdentifier & { quantity: number }>) => {
      const { cartKey, quantity } = action.payload
      const item = state.items.find((cartItem) => cartItem.cartKey === cartKey)
      if (!item) return

      const maxQuantity = getMaxQuantity(item)
      const nextQty = Number.isFinite(quantity)
        ? Math.max(1, Math.min(quantity, maxQuantity))
        : 1
      item.quantity = nextQty
      const totals = computeTotals(state.items)
      state.subtotalCents = totals.subtotalCents
      state.totalQuantity = totals.totalQuantity
      persistCart(state.items)
    },
    removeItem: (state, action: PayloadAction<ItemIdentifier>) => {
      state.items = state.items.filter((item) => item.cartKey !== action.payload.cartKey)
      const totals = computeTotals(state.items)
      state.subtotalCents = totals.subtotalCents
      state.totalQuantity = totals.totalQuantity
      persistCart(state.items)
    },
    clearCart: (state) => {
      state.items = []
      state.subtotalCents = 0
      state.totalQuantity = 0
      persistCart(state.items)
    },
  },
})

export const { addItem, updateQuantity, removeItem, clearCart } = cartSlice.actions
export default cartSlice.reducer

