import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice'; // Add this import
import productsReducer from './slices/CardSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer, 
    products: productsReducer,
    cart: cartReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;