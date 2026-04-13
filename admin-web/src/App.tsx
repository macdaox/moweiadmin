import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from '@/pages/Login'
import AppShell from '@/components/AppShell'
import RequireAuth from '@/components/RequireAuth'
import Dashboard from '@/pages/Dashboard'
import Content from '@/pages/Content'
import Leads from '@/pages/Leads'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/content" element={<Content />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}
