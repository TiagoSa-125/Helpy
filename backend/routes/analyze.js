import express from 'express'
import supabase from '../supabase.js'

const router = express.Router()

// POST /api/analyze
// Recebe o resultado da análise de pixels (feita no frontend)
// Guarda a missão, atualiza XP e devolve os pontos totais atualizados
router.post('/', async (req, res) => {
  const { result, userId, missionType } = req.body

  if (!result || !userId) {
    return res.status(400).json({ error: 'Resultado e userId são obrigatórios.' })
  }

  try {
    // Pontos por severidade
    const pontosMap = { low: 10, medium: 30, high: 50 }
    const pontosGanhos = pontosMap[result.severity] ?? 20

    // 1. Guarda a missão na tabela missions (sem foto — RGPD ✅)
    const { error: missaoError } = await supabase.from('missions').insert({
      user_id: userId,
      mission_type: missionType || 'skin_analysis',
      points_earned: pontosGanhos,
      ai_result: result.label
    })
    if (missaoError) throw missaoError

    // 2. Atualiza pontos totais e contador de missões na tabela profiles
    const { error: rpcError } = await supabase.rpc('add_points', {
      user_id: userId,
      points: pontosGanhos
    })
    if (rpcError) throw rpcError

    // 3. Vai buscar os pontos totais atualizados para mostrar no Result
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_points, missions_count')
      .eq('id', userId)
      .single()
    if (profileError) throw profileError

    // Devolve tudo ao frontend
    res.json({
      success: true,
      pontosGanhos,
      totalPoints: profile.total_points,
      missionsCount: profile.missions_count,
      aviso: 'Esta análise é apenas educativa e não substitui um médico profissional.'
    })

  } catch (err) {
    console.error('Erro ao guardar resultado:', err)
    res.status(500).json({ error: 'Erro interno. Tenta novamente.' })
  }
})

export default router