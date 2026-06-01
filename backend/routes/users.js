import express from 'express'
import supabase from '../supabase.js'

const router = express.Router()

// GET /api/users/ranking — top 20 utilizadores com mais pontos
router.get('/ranking', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_emoji, total_points, missions_count')
      .order('total_points', { ascending: false })
      .limit(20)

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Erro ao buscar ranking:', err)
    res.status(500).json({ error: 'Erro ao carregar ranking.' })
  }
})

// GET /api/users/:id — perfil de um utilizador
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_emoji, total_points, missions_count')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Erro ao buscar perfil:', err)
    res.status(500).json({ error: 'Utilizador não encontrado.' })
  }
})

// POST /api/users — cria ou atualiza perfil após registo
router.post('/', async (req, res) => {
  const { id, username, avatar_emoji } = req.body

  if (!id || !username) {
    return res.status(400).json({ error: 'id e username são obrigatórios.' })
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id, username, avatar_emoji: avatar_emoji || '🦸', total_points: 0, missions_count: 0 })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Erro ao criar perfil:', err)
    res.status(500).json({ error: 'Erro ao criar perfil.' })
  }
})

export default router
