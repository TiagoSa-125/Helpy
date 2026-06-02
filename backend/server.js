import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import analyzeRouter from './routes/analyze.js'
import usersRouter from './routes/users.js'
import pointsRouter from './routes/points.js'

const app = express()
const PORT = process.env.PORT || 3001

// Aceita pedidos de qualquer origem do Codespace
app.use(cors({
  origin: true
}))

app.use(express.json({ limit: '10mb' }))

app.use('/api/analyze', analyzeRouter)
app.use('/api/users', usersRouter)
app.use('/api/points', pointsRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Helpy backend a funcionar!' })
})

app.listen(PORT, () => {
  console.log(`🩺 Helpy backend a correr em http://localhost:${PORT}`)
})
