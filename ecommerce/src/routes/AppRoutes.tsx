import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import type { RootState } from '../store'
import HomePage from '../pages/home/HomePage'
import { ProductPage } from '../pages/ProductPage'
import Signup from '../pages/auth/Signup'
import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Profile from '../pages/auth/Profile'
import AdminHome from '../pages/admin/AdminHome'
import ProductsList from '../pages/admin/products/ProductsList'
import ProductForm from '../pages/admin/products/ProductForm'
import CategoriesList from '../pages/admin/categories/CategoriesList'
import CategoryForm from '../pages/admin/categories/CategoryForm'
import OrdersList from '../pages/admin/orders/OrdersList'
import OrderDetails from '../pages/admin/orders/OrderDetails'
import UsersList from '../pages/admin/users/UsersList'
import UserDetails from '../pages/admin/users/UserDetails'
import AdminSettings from '../pages/admin/settings/AdminSettings'
import AdminRoute from '../components/admin/AdminRoute'
import Categories from '../pages/Categories'
import CategoryDetails from '../pages/CategoryDetails'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import Orders from '../pages/Orders'
import OrderConfirmation from '../pages/OrderConfirmation'

function AppRoutes() {
  const userSession = useAppSelector((state: RootState) => state.auth.session)
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryDetails />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={userSession ? <CheckoutPage /> : <Navigate to="/login" replace />} />
        <Route path="/orders" element={userSession ? <Orders /> : <Navigate to="/login" replace />} />
        <Route path="/orders/:id" element={userSession ? <OrderConfirmation /> : <Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={userSession ? <Profile /> : <Navigate to="/login" replace />} />
        
        {/* Admin Routes - Protected by AdminRoute */}
        <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><ProductsList /></AdminRoute>} />
        <Route path="/admin/products/new" element={<AdminRoute><ProductForm /></AdminRoute>} />
        <Route path="/admin/products/:id/edit" element={<AdminRoute><ProductForm /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><CategoriesList /></AdminRoute>} />
        <Route path="/admin/categories/new" element={<AdminRoute><CategoryForm /></AdminRoute>} />
        <Route path="/admin/categories/:id/edit" element={<AdminRoute><CategoryForm /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><OrdersList /></AdminRoute>} />
        <Route path="/admin/orders/:id" element={<AdminRoute><OrderDetails /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UsersList /></AdminRoute>} />
        <Route path="/admin/users/:id" element={<AdminRoute><UserDetails /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes

