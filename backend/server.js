import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import analyzeRouter from './routes/analyze.js'
import usersRouter from './routes/users.js'
import pointsRouter from './routes/points.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

// Rotas
app.use('/api/analyze', analyzeRouter)
app.use('/api/users', usersRouter)
app.use('/api/points', pointsRouter)

// Rota de teste — confirma que o servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Helpy backend a funcionar!' })
})

app.listen(PORT, () => {
  console.log(`🩺 Helpy backend a correr em http://localhost:${PORT}`)
})
