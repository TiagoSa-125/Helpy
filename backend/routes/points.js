import express from 'express'
import supabase from '../supabase.js'

const router = express.Router()

// GET /api/points/:userId — histórico de missões de um utilizador
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('id, mission_type, points_earned, ai_result, created_at')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('Erro ao buscar histórico:', err)
    res.status(500).json({ error: 'Erro ao carregar histórico.' })
  }
})

export default router
