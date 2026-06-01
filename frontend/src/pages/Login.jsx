import React from 'react'
import { useState } from 'react'
import supabase from '../lib/supabase.js'
import { createProfile } from '../lib/api.js'

const AVATARS = ['🦸', '🧑‍⚕️', '👩‍⚕️', '🧒', '👦', '👧', '🧑', '👩', '🧓', '🦊', '🐻', '🐼']

export default function Login() {
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('🦸')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou password incorretos.')
    setLoading(false)
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!username.trim()) return setError('Escolhe um nome de utilizador.')
    setLoading(true); setError('')

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      await createProfile({ id: data.user.id, username: username.trim(), avatar_emoji: avatar })
    }
    setSuccess('Conta criada! Verifica o teu email para confirmar.')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      {/* Logo */}
      <div style={styles.logo}>
        <span style={styles.logoEmoji}>🩺</span>
        <h1 style={styles.logoText}>Helpy</h1>
        <p style={styles.logoSub}>O teu assistente de primeiros socorros</p>
      </div>

      {/* Card */}
      <div style={styles.card} className="fade-up">
        {/* Toggle login/register */}
        <div style={styles.toggle}>
          <button
            style={{ ...styles.toggleBtn, ...(mode === 'login' ? styles.toggleActive : {}) }}
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
          >Entrar</button>
          <button
            style={{ ...styles.toggleBtn, ...(mode === 'register' ? styles.toggleActive : {}) }}
            onClick={() => { setMode('register'); setError(''); setSuccess('') }}
          >Criar conta</button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={styles.form}>
          {/* Avatar picker — só no registo */}
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>O teu avatar</label>
              <div style={styles.avatarGrid}>
                {AVATARS.map(a => (
                  <button
                    key={a} type="button"
                    style={{ ...styles.avatarBtn, ...(avatar === a ? styles.avatarActive : {}) }}
                    onClick={() => setAvatar(a)}
                  >{a}</button>
                ))}
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Nome de utilizador</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Ex: HeroiDaSaude" required maxLength={20}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          {error && <p style={styles.error}>❌ {error}</p>}
          {success && <p style={styles.successMsg}>✅ {success}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '⏳ A processar...' : mode === 'login' ? '🚀 Entrar' : '🎉 Criar conta'}
          </button>
        </form>
      </div>

      <p style={styles.disclaimer}>⚕️ Esta app é educativa e não substitui ajuda médica profissional.</p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    gap: '1.5rem',
    background: 'var(--bg)',
    maxWidth: 480,
    margin: '0 auto',
  },
  logo: { textAlign: 'center' },
  logoEmoji: { fontSize: '3.5rem' },
  logoText: { fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'var(--accent)', letterSpacing: 1, margin: '0.2rem 0 0' },
  logoSub: { color: 'var(--muted)', fontSize: '0.9rem', marginTop: 4 },
  card: {
    width: '100%',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
  },
  toggle: {
    display: 'flex',
    background: 'var(--bg3)',
    borderRadius: 10,
    padding: 4,
    marginBottom: '1.5rem',
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--muted)',
    fontWeight: 700,
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  toggleActive: {
    background: 'var(--accent)',
    color: '#fff',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)' },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6,
  },
  avatarBtn: {
    fontSize: '1.5rem',
    padding: '6px',
    borderRadius: 8,
    border: '2px solid transparent',
    background: 'var(--bg3)',
    transition: 'border-color 0.15s',
  },
  avatarActive: { borderColor: 'var(--accent)' },
  error: { color: 'var(--accent2)', fontSize: '0.85rem', fontWeight: 600 },
  successMsg: { color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 },
  disclaimer: { color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center' },
}
