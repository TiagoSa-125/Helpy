import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import supabase from '../lib/supabase.js'
import { getUserProfile } from '../lib/api.js'

export default function Home({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  // Carrega perfil e missões recentes do utilizador
  const loadProfile = useCallback(async () => {
    try {
      const p = await getUserProfile(user.id)
      setProfile(p)

      const { data } = await supabase
        .from('missions')
        .select('id, ai_result, points_earned, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setMissions(data || [])
    } catch {
      // Sem perfil ainda — utilizador acabou de registar
    }
    setLoading(false)
  }, [user.id])

  // Carrega ao entrar na página
  useEffect(() => { loadProfile() }, [loadProfile])

  // IMPORTANTE: Recarrega o perfil sempre que volta de uma missão
  // Assim o XP atualiza automaticamente depois de cada análise
  useEffect(() => {
    if (location.state?.refresh) {
      loadProfile()
      // Limpa o state para não recarregar em loops
      navigate('/', { replace: true, state: {} })
    }
  }, [location.state])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Cálculo de nível: cada 200 XP = 1 nível
  const totalPoints = profile?.total_points || 0
  const level = Math.floor(totalPoints / 200) + 1
  const xpInLevel = totalPoints % 200
  const xpPercent = (xpInLevel / 200) * 100

  // Ícone do nível baseado no progresso
  const levelIcon = level >= 10 ? '👑' : level >= 5 ? '⭐' : level >= 3 ? '🔥' : '🌱'

  if (loading) return (
    <div style={S.center}>
      <span style={{ fontSize: 48 }}>🩺</span>
      <p style={{ color: 'var(--muted)', marginTop: 8 }}>A carregar...</p>
    </div>
  )

  return (
    <div className="page" style={{ gap: '1rem' }}>

      {/* Header com avatar e logout */}
      <div style={S.header}>
        <div style={S.userInfo}>
          <span style={S.avatar}>{profile?.avatar_emoji || '🦸'}</span>
          <div>
            <p style={S.username}>{profile?.username || 'Herói'}</p>
            <p style={S.levelText}>{levelIcon} Nível {level} · {totalPoints} XP total</p>
          </div>
        </div>
        <button onClick={handleLogout} style={S.logoutBtn}>Sair</button>
      </div>

      {/* Barra de XP */}
      <div className="card fade-up">
        <div style={S.xpHeader}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nível {level}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{xpInLevel} / 200 XP</span>
        </div>
        <div style={S.xpTrack}>
          <div style={{ ...S.xpFill, width: `${xpPercent}%` }} />
        </div>
        <div style={S.statsRow}>
          <span style={S.stat}>🏅 {profile?.missions_count || 0} missões</span>
          <span style={S.stat}>⚡ {200 - xpInLevel} XP para nível {level + 1}</span>
        </div>
      </div>

      {/* Botão principal de missão */}
      <button
        className="btn btn-primary fade-up"
        style={{ fontSize: '1.2rem', padding: '18px', animationDelay: '0.1s' }}
        onClick={() => navigate('/camera')}
      >
        📸 Iniciar Missão
      </button>

      {/* Ranking */}
      <button
        className="btn btn-secondary fade-up"
        style={{ animationDelay: '0.15s' }}
        onClick={() => navigate('/ranking')}
      >
        🏆 Ver Ranking Global
      </button>

      {/* Missões recentes */}
      {missions.length > 0 && (
        <div style={{ width: '100%' }} className="fade-up">
          <h3 style={S.sectionTitle}>Missões recentes</h3>
          <div style={S.missionList}>
            {missions.map(m => (
              <div key={m.id} style={S.missionItem}>
                <span style={S.missionIcon}>🩹</span>
                <div style={{ flex: 1 }}>
                  <p style={S.missionLabel}>{m.ai_result || 'Análise de pele'}</p>
                  <p style={S.missionDate}>
                    {new Date(m.created_at).toLocaleDateString('pt-PT', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span style={S.missionPoints}>+{m.points_earned} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {missions.length === 0 && !loading && (
        <div style={S.emptyState} className="fade-up">
          <span style={{ fontSize: '2.5rem' }}>🎯</span>
          <p style={{ fontWeight: 700 }}>Ainda não tens missões!</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Inicia a tua primeira missão e começa a ganhar XP</p>
        </div>
      )}

      <p style={S.disclaimer}>⚕️ Esta app é educativa. Em emergência, liga 112.</p>
    </div>
  )
}

const S = {
  center: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { fontSize: '2.2rem' },
  username: { fontWeight: 800, fontSize: '1rem' },
  levelText: { color: 'var(--muted)', fontSize: '0.8rem', marginTop: 2 },
  logoutBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
  xpHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  xpTrack: { height: 12, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' },
  xpFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 99, transition: 'width 0.8s ease' },
  statsRow: { display: 'flex', justifyContent: 'space-between', marginTop: 8 },
  stat: { fontSize: '0.78rem', color: 'var(--muted)' },
  sectionTitle: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  missionList: { display: 'flex', flexDirection: 'column', gap: 6 },
  missionItem: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' },
  missionIcon: { fontSize: '1.4rem' },
  missionLabel: { fontWeight: 700, fontSize: '0.9rem' },
  missionDate: { color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 },
  missionPoints: { color: 'var(--yellow)', fontWeight: 800, fontSize: '0.9rem' },
  emptyState: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '2rem', color: 'var(--text)' },
  disclaimer: { color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: 'auto', paddingTop: '1rem' },
}