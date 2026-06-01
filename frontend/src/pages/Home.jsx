import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase.js'
import { getUserProfile } from '../lib/api.js'

export default function Home({ user }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const p = await getUserProfile(user.id)
        setProfile(p)
        // Últimas 5 missões
        const { data } = await supabase
          .from('missions')
          .select('id, ai_result, points_earned, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        setMissions(data || [])
      } catch { /* sem perfil ainda */ }
      setLoading(false)
    }
    load()
  }, [user.id])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // XP para o próximo nível (cada 200 pontos = 1 nível)
  const totalPoints = profile?.total_points || 0
  const level = Math.floor(totalPoints / 200) + 1
  const xpInLevel = totalPoints % 200
  const xpPercent = (xpInLevel / 200) * 100

  if (loading) return (
    <div style={styles.center}>
      <span style={{ fontSize: 48 }}>🩺</span>
      <p style={{ color: 'var(--muted)', marginTop: 8 }}>A carregar...</p>
    </div>
  )

  return (
    <div className="page" style={{ gap: '1rem' }}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.userInfo}>
          <span style={styles.avatar}>{profile?.avatar_emoji || '🦸'}</span>
          <div>
            <p style={styles.username}>{profile?.username || 'Herói'}</p>
            <p style={styles.levelText}>Nível {level} · {totalPoints} XP</p>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Sair</button>
      </div>

      {/* XP Bar */}
      <div className="card fade-up">
        <div style={styles.xpHeader}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nível {level}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{xpInLevel}/200 XP</span>
        </div>
        <div style={styles.xpTrack}>
          <div style={{ ...styles.xpFill, width: `${xpPercent}%` }} />
        </div>
        <p style={styles.missionsCount}>
          🏅 {profile?.missions_count || 0} missões completadas
        </p>
      </div>

      {/* Botão principal */}
      <button
        className="btn btn-primary fade-up"
        style={{ fontSize: '1.2rem', padding: '18px', animationDelay: '0.1s' }}
        onClick={() => navigate('/camera')}
      >
        📸 Iniciar Missão
      </button>

      {/* Ações secundárias */}
      <div style={styles.actionsRow} className="fade-up" >
        <button className="btn btn-secondary" onClick={() => navigate('/ranking')} style={{ animationDelay: '0.15s' }}>
          🏆 Ranking
        </button>
      </div>

      {/* Missões recentes */}
      {missions.length > 0 && (
        <div style={{ width: '100%' }} className="fade-up">
          <h3 style={styles.sectionTitle}>Missões recentes</h3>
          <div style={styles.missionList}>
            {missions.map(m => (
              <div key={m.id} style={styles.missionItem}>
                <span style={styles.missionIcon}>🩹</span>
                <div style={{ flex: 1 }}>
                  <p style={styles.missionLabel}>{m.ai_result || 'Análise de pele'}</p>
                  <p style={styles.missionDate}>{new Date(m.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
                <span style={styles.missionPoints}>+{m.points_earned} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aviso legal */}
      <p style={styles.disclaimer}>⚕️ Esta app é educativa. Em emergência, liga 112.</p>
    </div>
  )
}

const styles = {
  center: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { fontSize: '2.2rem' },
  username: { fontWeight: 800, fontSize: '1rem' },
  levelText: { color: 'var(--muted)', fontSize: '0.8rem', marginTop: 2 },
  logoutBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700 },
  xpHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  xpTrack: { height: 10, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' },
  xpFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 99, transition: 'width 0.6s ease' },
  missionsCount: { marginTop: 8, fontSize: '0.8rem', color: 'var(--muted)' },
  actionsRow: { display: 'flex', gap: 8, width: '100%' },
  sectionTitle: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  missionList: { display: 'flex', flexDirection: 'column', gap: 6 },
  missionItem: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' },
  missionIcon: { fontSize: '1.4rem' },
  missionLabel: { fontWeight: 700, fontSize: '0.9rem' },
  missionDate: { color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 },
  missionPoints: { color: 'var(--yellow)', fontWeight: 800, fontSize: '0.9rem' },
  disclaimer: { color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: 'auto', paddingTop: '1rem' },
}
