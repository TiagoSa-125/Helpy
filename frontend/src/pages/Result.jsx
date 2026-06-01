import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { saveAnalysis } from '../lib/api.js'

// Recebe o resultado via navigate state: { result, user }
export default function Result({ user }) {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [pontosGanhos, setPontosGanhos] = useState(0)
  const [saving, setSaving] = useState(true)

  const result = state?.result

  useEffect(() => {
    if (!result) { navigate('/'); return }

    async function save() {
      try {
        const res = await saveAnalysis({ result, userId: user.id })
        setPontosGanhos(res.pontosGanhos)
      } catch (err) {
        console.error('Erro ao guardar:', err)
      }
      setSaved(true)
      setSaving(false)
    }
    save()
  }, [])

  if (!result) return null

  const severityColors = {
    low: 'var(--green)',
    medium: '#ffaa00',
    high: 'var(--accent2)',
  }
  const severityLabels = { low: 'Leve', medium: 'Moderado', high: 'Grave' }
  const color = severityColors[result.severity] || 'var(--accent)'

  return (
    <div className="page" style={{ gap: '1rem', justifyContent: 'flex-start', paddingTop: '2rem' }}>

      {/* Ícone + resultado */}
      <div style={{ textAlign: 'center', width: '100%' }} className="fade-up">
        <div style={{ fontSize: '4rem', marginBottom: 8 }}>{result.icon}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color }}>
          {result.label}
        </h1>
        <span style={{ ...styles.badge, background: color + '22', color, border: `1px solid ${color}` }}>
          {severityLabels[result.severity]}
        </span>
      </div>

      {/* Alerta 112 se grave */}
      {result.severity === 'high' && (
        <div style={styles.alertBox} className="fade-up">
          <span style={{ fontSize: '1.4rem' }}>🚨</span>
          <div>
            <p style={{ fontWeight: 800, color: 'var(--accent2)' }}>Situação grave detetada</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>Em caso de dúvida, liga imediatamente ao 112</p>
          </div>
          <a href="tel:112" style={styles.callBtn}>112</a>
        </div>
      )}

      {/* Dicas */}
      <div className="card fade-up" style={{ animationDelay: '0.1s' }}>
        <h3 style={styles.sectionTitle}>💡 O que fazer</h3>
        <ol style={styles.tipsList}>
          {result.tips.map((tip, i) => (
            <li key={i} style={styles.tipItem}>
              <span style={{ ...styles.tipNum, background: color }}>{i + 1}</span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* XP ganho */}
      {saved && (
        <div style={styles.xpBox} className="fade-up">
          {saving ? (
            <p style={{ color: 'var(--muted)' }}>A guardar...</p>
          ) : (
            <>
              <span style={styles.xpGlow}>+{pontosGanhos} XP</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>ganhos por ajudares! 🏆</span>
            </>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p style={styles.disclaimer}>
        ⚕️ Esta análise é apenas orientativa e não substitui consulta médica profissional.
      </p>

      {/* Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 'auto' }}>
        <button className="btn btn-primary" onClick={() => navigate('/camera')}>
          🎯 Nova Missão
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          🏠 Início
        </button>
      </div>
    </div>
  )
}

const styles = {
  badge: { display: 'inline-block', padding: '4px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 800, marginTop: 8 },
  alertBox: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255,107,107,0.1)',
    border: '1px solid var(--accent2)',
    borderRadius: 'var(--radius)',
    padding: '12px 16px',
  },
  callBtn: {
    marginLeft: 'auto',
    background: 'var(--accent2)',
    color: '#fff',
    fontWeight: 900,
    fontSize: '1.1rem',
    padding: '8px 16px',
    borderRadius: 10,
    textDecoration: 'none',
  },
  sectionTitle: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  tipsList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  tipItem: { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.95rem', lineHeight: 1.4 },
  tipNum: { minWidth: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0 },
  xpBox: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', width: '100%', padding: '12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' },
  xpGlow: { fontSize: '1.6rem', fontWeight: 900, color: 'var(--yellow)', textShadow: '0 0 16px rgba(255,209,102,0.5)' },
  disclaimer: { color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center' },
}
