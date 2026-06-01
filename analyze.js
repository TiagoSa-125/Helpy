import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import supabase from '../supabase.js'

const router = express.Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/analyze
// Body: { imageBase64: string, missionType: string, userId: string }
router.post('/', async (req, res) => {
  const { imageBase64, missionType, userId } = req.body

  if (!imageBase64 || !userId) {
    return res.status(400).json({ error: 'Imagem e userId são obrigatórios.' })
  }

  try {
    // Remove prefixo data:image/...;base64, se existir
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Data }
            },
            {
              type: 'text',
              text: `És um assistente de primeiros socorros para o Helpy, uma app educativa.
Analisa esta imagem de forma simples e acessível para crianças e adultos.

Responde SEMPRE neste formato JSON (só o JSON, sem mais nada):
{
  "situacao": "descrição curta do que vês (ex: irritação na pele, queimadura leve)",
  "gravidade": "leve | moderada | grave",
  "dicas": ["passo 1", "passo 2", "passo 3"],
  "ir_medico": true ou false,
  "mensagem_helpy": "mensagem encorajadora curta do mascote Helpy"
}

IMPORTANTE: Se a imagem não mostrar nenhuma situação médica, responde com gravidade "leve" e dicas gerais de higiene.
AVISO LEGAL: Lembra sempre que isto não substitui um médico.`
            }
          ]
        }
      ]
    })

    // Parse da resposta JSON da IA
    const rawText = response.content[0].text.trim()
    let analysis
    try {
      analysis = JSON.parse(rawText)
    } catch {
      analysis = {
        situacao: 'Análise concluída',
        gravidade: 'leve',
        dicas: ['Mantém a área limpa', 'Observa se há mudanças', 'Consulta um médico se piorar'],
        ir_medico: false,
        mensagem_helpy: 'Boa missão, herói! Continua a ajudar!'
      }
    }

    // Calcula pontos baseado na gravidade
    const pontosMap = { leve: 50, moderada: 100, grave: 0 }
    const pontosGanhos = pontosMap[analysis.gravidade] ?? 50

    // Guarda missão na BD (sem guardar a foto — RGPD)
    const { error: missaoError } = await supabase.from('missions').insert({
      user_id: userId,
      mission_type: missionType || 'skin_analysis',
      points_earned: analysis.gravidade === 'grave' ? 0 : pontosGanhos,
      ai_result: analysis.situacao
    })

    if (missaoError) console.error('Erro ao guardar missão:', missaoError)

    // Atualiza pontos totais do utilizador (só se não for grave)
    if (analysis.gravidade !== 'grave') {
      await supabase.rpc('add_points', { user_id: userId, points: pontosGanhos })
    }

    res.json({
      analysis,
      pontosGanhos: analysis.gravidade === 'grave' ? 0 : pontosGanhos,
      aviso: 'Esta análise é apenas educativa e não substitui um médico profissional.'
    })

  } catch (err) {
    console.error('Erro na análise:', err)
    res.status(500).json({ error: 'Erro ao analisar a imagem. Tenta novamente.' })
  }
})

export default router
