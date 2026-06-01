import React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRanking } from '../lib/api.js'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const navigate = useNavigate()
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getRanking()
      .then(data => setRanking(data))
      .catch(() => setError('Erro ao carregar ranking.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page" style={{ gap: '1rem', paddingTop: '2rem' }}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>← Voltar</button>
        <h1 style={styles.title}>🏆 Ranking</h1>
        <div style={{ width: 60 }} />
      </div>

      <p style={styles.subtitle}>Os maiores heróis da saúde</p>

      {loading && <p style={{ color: 'var(--muted)', marginTop: '2rem' }}>A carregar...</p>}
      {error && <p style={{ color: 'var(--accent2)' }}>{error}</p>}

      {!loading && ranking.length === 0 && (
        <div style={styles.empty}>
          <span style={{ fontSize: '3rem' }}>🌱</span>
          <p>Ainda não há missões! Sê o primeiro herói.</p>
        </div>
      )}

      <div style={styles.list}>
        {ranking.map((entry, i) => (
          <div
            key={entry.id}
            style={{
              ...styles.item,
              ...(i === 0 ? styles.first : i === 1 ? styles.second : i === 2 ? styles.third : {})
            }}
            className="fade-up"
          >
            <span style={styles.position}>
              {i < 3 ? MEDALS[i] : <span style={styles.posNum}>{i + 1}</span>}
            </span>
            <span style={styles.itemAvatar}>{entry.avatar_emoji || '🦸'}</span>
            <div style={{ flex: 1 }}>
              <p style={styles.itemName}>{entry.username}</p>
              <p style={styles.itemMissions}>{entry.missions_count || 0} missões</p>
            </div>
            <div style={styles.pointsBox}>
              <span style={styles.points}>{entry.total_points}</span>
              <span style={styles.xpLabel}>XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  backBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700 },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--yellow)' },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem' },
  empty: { textAlign: 'center', color: 'var(--muted)', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  list: { width: '100%', display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '12px 14px',
    transition: 'border-color 0.2s',
  },
  first: { border: '1px solid #ffd166', background: 'rgba(255,209,102,0.06)' },
  second: { border: '1px solid #c0c0c0', background: 'rgba(192,192,192,0.04)' },
  third: { border: '1px solid #cd7f32', background: 'rgba(205,127,50,0.04)' },
  position: { width: 28, textAlign: 'center', fontSize: '1.4rem' },
  posNum: { fontSize: '0.9rem', fontWeight: 800, color: 'var(--muted)' },
  itemAvatar: { fontSize: '1.8rem' },
  itemName: { fontWeight: 800, fontSize: '0.95rem' },
  itemMissions: { color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 },
  pointsBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  points: { fontWeight: 900, fontSize: '1.1rem', color: 'var(--yellow)' },
  xpLabel: { fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 },
}
