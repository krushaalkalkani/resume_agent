import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import HowItWorksPage from './pages/HowItWorksPage'
import ShowcasePage from './pages/ShowcasePage'
import PricingPage from './pages/PricingPage'
import LoginPage from './pages/LoginPage'
import EditorPage from './pages/EditorPage'
import TailorPage from './pages/TailorPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/tailor" element={<ProtectedRoute><TailorPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
