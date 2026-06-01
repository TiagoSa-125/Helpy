const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Guarda resultado da análise TF.js e atribui pontos
export async function saveAnalysis({ result, userId, missionType = 'skin_analysis' }) {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result, userId, missionType })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao guardar análise')
  }
  return res.json()
}

// Ranking global
export async function getRanking() {
  const res = await fetch(`${API_URL}/api/users/ranking`)
  if (!res.ok) throw new Error('Erro ao carregar ranking')
  return res.json()
}

// Perfil do utilizador
export async function getUserProfile(userId) {
  const res = await fetch(`${API_URL}/api/users/${userId}`)
  if (!res.ok) throw new Error('Erro ao carregar perfil')
  return res.json()
}

// Cria perfil após registo
export async function createProfile({ id, username, avatar_emoji }) {
  const res = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, username, avatar_emoji })
  })
  if (!res.ok) throw new Error('Erro ao criar perfil')
  return res.json()
}
