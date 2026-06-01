import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import supabase from './lib/supabase.js'

import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Camera from './pages/Camera.jsx'
import Result from './pages/Result.jsx'
import Ranking from './pages/Ranking.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Ouve mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: 48 }}>🩺</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
      <Route path="/camera" element={user ? <Camera user={user} /> : <Navigate to="/login" />} />
      <Route path="/result" element={user ? <Result user={user} /> : <Navigate to="/login" />} />
      <Route path="/ranking" element={user ? <Ranking /> : <Navigate to="/login" />} />
    </Routes>
  )
}
