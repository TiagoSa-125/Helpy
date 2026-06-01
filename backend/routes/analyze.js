import express from 'express'
import supabase from '../supabase.js'

const router = express.Router()

// POST /api/analyze
// A análise de imagem acontece no frontend com TensorFlow.js
// O backend só guarda o resultado e atribui pontos — a foto NUNCA chega aqui (RGPD ✅)
router.post('/', async (req, res) => {
  const { result, userId, missionType } = req.body

  if (!result || !userId) {
    return res.status(400).json({ error: 'Resultado e userId são obrigatórios.' })
  }

  try {
    const pontosMap = { low: 10, medium: 30, high: 50 }
    const pontosGanhos = pontosMap[result.severity] ?? 20

    // Guarda missão
    const { error: missaoError } = await supabase.from('missions').insert({
      user_id: userId,
      mission_type: missionType || 'skin_analysis',
      points_earned: pontosGanhos,
      ai_result: result.label
    })
    if (missaoError) throw missaoError

    // Atualiza pontos totais + contador de missões
    const { error: rpcError } = await supabase.rpc('add_points', {
      user_id: userId,
      points: pontosGanhos
    })
    if (rpcError) console.error('Erro RPC add_points:', rpcError)

    res.json({
      success: true,
      pontosGanhos,
      aviso: 'Esta análise é apenas educativa e não substitui um médico profissional.'
    })
  } catch (err) {
    console.error('Erro ao guardar resultado:', err)
    res.status(500).json({ error: 'Erro interno. Tenta novamente.' })
  }
})

export default router
