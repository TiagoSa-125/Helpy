import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Analisador de pixels ─────────────────────────────────────────────────────
// Lê todos os pixels do canvas e calcula as cores dominantes
function analyzePixels(canvas) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data // array de [R,G,B,A, R,G,B,A, ...]

  let totalPixels = 0
  let redCount = 0       // vermelhidão intensa → irritação/queimadura
  let darkCount = 0      // tons escuros/castanhos → mancha suspeita
  let woundCount = 0     // rosa/vermelho suave → ferida leve
  let healthyCount = 0   // tom normal de pele → saudável

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]

    // Ignora pixels transparentes
    if (a < 128) continue
    totalPixels++

    // Calcula brilho e saturação
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const brightness = (r + g + b) / 3
    const saturation = max === 0 ? 0 : (max - min) / max

    // ── Regras de classificação por cor ──

    // Vermelho intenso: R muito alto, G e B baixos → irritação/queimadura
    if (r > 160 && g < 90 && b < 90 && saturation > 0.4) {
      redCount++
    }
    // Tom escuro/castanho: brilho baixo, tom avermelhado → mancha suspeita
    else if (brightness < 80 && r > g && r > b) {
      darkCount++
    }
    // Rosa/vermelho suave: R alto mas G e B também presentes → ferida leve
    else if (r > 140 && g > 80 && b > 80 && r > g + 30 && r > b + 30) {
      woundCount++
    }
    // Tom de pele normal: R médio, G e B mais baixos, brilho razoável
    else if (r > 100 && r > g && r > b && brightness > 80 && brightness < 200) {
      healthyCount++
    }
  }

  if (totalPixels === 0) return CONDITIONS.healthy

  // Calcula percentagens
  const redPct    = redCount    / totalPixels
  const darkPct   = darkCount   / totalPixels
  const woundPct  = woundCount  / totalPixels

  // Decide condição pela percentagem dominante
  // Limiares calibrados para deteção razoável
  if (redPct > 0.08)         return CONDITIONS.burn     // >8% pixels vermelhos intensos
  if (darkPct > 0.15)        return CONDITIONS.spot     // >15% pixels escuros suspeitos
  if (woundPct > 0.12)       return CONDITIONS.wound    // >12% pixels rosa/ferida
  if (redPct > 0.04)         return CONDITIONS.rash     // >4% vermelhidão leve

  return CONDITIONS.healthy
}

// ─── Condições e dicas ───────────────────────────────────────────────────────
const CONDITIONS = {
  burn: {
    label: 'Possível queimadura',
    icon: '🔥',
    severity: 'high',
    points: 50,
    tips: [
      'Arrefece a zona com água corrente fria durante 10 minutos',
      'NÃO uses gelo — pode causar mais dano',
      'Cobre com penso não aderente',
      'Queimaduras grandes: liga 112 imediatamente',
    ],
  },
  spot: {
    label: 'Mancha escura detetada',
    icon: '⚠️',
    severity: 'high',
    points: 60,
    tips: [
      'Não ignores manchas escuras ou irregulares',
      'Aplica protetor solar na zona',
      'Marca consulta com dermatologista quando possivel',
      'Usa a regra ABCDE: Assimetria, Bordas, Cor, Diâmetro, Evolução',
    ],
  },
  wound: {
    label: 'Ferida ou corte',
    icon: '🩹',
    severity: 'medium',
    points: 40,
    tips: [
      'Aplica pressão suave com pano um limpo para parar o sangramento',
      'Desinfeta com álcool ou água oxigenada',
      'Mete um penso esterilizado sobre a ferida',
      'Feridas profundas que não param de sangrar? - vai as urgências',
    ],
  },
  rash: {
    label: 'Irritação na pele',
    icon: '🔴',
    severity: 'medium',
    points: 30,
    tips: [
      'Lava a zona com água morna e sabão neutro',
      'Aplica gel de aloe vera se disponível',
      'Evita coçar — pode piorar a irritação',
      'Se piorar, consulta um médico',
    ],
  },
  healthy: {
    label: 'Pele com boa aparência',
    icon: '✅',
    severity: 'low',
    points: 10,
    tips: [
      'Continua a aplicar protetor solar diariamente',
      'Hidrata a pele com regularidade',
      'Bebe bastante água',
      'Faz exames dermatológicos anualmente para prevenção',
    ],
  },
}

// ─── Componente Camera ────────────────────────────────────────────────────────
export default function Camera({ user }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('ready') // ready | captured | analyzing | result
  const [capturedImage, setCapturedImage] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState(null)

  // ── Inicia câmara ──
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('Não foi possível aceder à câmara. Verifica as permissões.')
    }
  }, [facingMode])

  useEffect(() => { startCamera() }, [facingMode, startCamera])
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  // ── Captura foto ──
  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.92))
    setPhase('captured')
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // ── Analisa pixels ──
  const analyzePhoto = useCallback(() => {
    setPhase('analyzing')

    // Pequeno delay para mostrar o ecrã de "a analisar"
    setTimeout(() => {
      try {
        const result = analyzePixels(canvasRef.current)
        navigate('/result', { state: { result, user } })
      } catch {
        setError('Erro ao analisar. Tenta novamente.')
        setPhase('captured')
      }
    }, 1500)
  }, [navigate, user])

  // ── Reset ──
  const reset = useCallback(() => {
    setCapturedImage(null)
    setError(null)
    setPhase('ready')
    startCamera()
  }, [startCamera])

  return (
    <div style={S.page}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Câmara ativa ── */}
      {phase === 'ready' && (
        <div style={S.col}>
          <div style={S.header}>
            <button onClick={() => navigate('/')} style={S.backBtn}>← Voltar</button>
            <span style={S.badge}>📸 Missão Ativa</span>
            <button style={S.iconBtn} onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')} title="Trocar câmara">🔄</button>
          </div>

          <div style={S.viewfinder}>
            <video ref={videoRef} autoPlay playsInline muted style={S.video} />
            {/* Cantos estilo scanner */}
            <div style={S.corners}>
              <div style={{...S.corner, top:0, left:0, borderTopWidth:3, borderLeftWidth:3, borderTopLeftRadius:6}} />
              <div style={{...S.corner, top:0, right:0, borderTopWidth:3, borderRightWidth:3, borderTopRightRadius:6}} />
              <div style={{...S.corner, bottom:0, left:0, borderBottomWidth:3, borderLeftWidth:3, borderBottomLeftRadius:6}} />
              <div style={{...S.corner, bottom:0, right:0, borderBottomWidth:3, borderRightWidth:3, borderBottomRightRadius:6}} />
            </div>
            <p style={S.scanHint}>Aponta para a zona da pele</p>
          </div>

          {/* Instrução de iluminação — importante para análise de cor */}
          <div style={S.tipBox}>
            💡 Para melhores resultados, garante boa iluminação e aproxima a câmara da zona afetada
          </div>

          <button style={S.captureBtn} onClick={capturePhoto}>
            <span style={S.captureDot} />
          </button>
        </div>
      )}

      {/* ── Foto capturada — confirmar ── */}
      {phase === 'captured' && capturedImage && (
        <div style={S.col}>
          <div style={S.header}>
            <button onClick={() => navigate('/')} style={S.backBtn}>← Voltar</button>
            <span style={S.badge}>🔍 Confirmar foto</span>
            <div style={{ width: 60 }} />
          </div>
          <img src={capturedImage} alt="Capturada" style={S.preview} />
          <div style={S.row}>
            <button className="btn btn-secondary" onClick={reset}>↩ Repetir</button>
            <button className="btn btn-primary" onClick={analyzePhoto}>🔬 Analisar</button>
          </div>
        </div>
      )}

      {/* ── A analisar ── */}
      {phase === 'analyzing' && (
        <div style={{ ...S.col, position: 'relative' }}>
          <img src={capturedImage} alt="A analisar" style={{ ...S.preview, filter: 'blur(3px) brightness(0.4)' }} />
          <div style={S.overlay}>
            <div style={S.scanBeam} />
            <span style={{ fontSize: '3.5rem' }}>🔬</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>A analisar...</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              A analisar as cores da imagem localmente 🔒
            </p>
            {/* Barra de progresso animada */}
            <div style={S.progressTrack}>
              <div style={S.progressFill} />
            </div>
          </div>
        </div>
      )}

      {/* ── Erro ── */}
      {error && (
        <div style={S.errorBanner}>
          ❌ {error}
          <button onClick={() => setError(null)} style={S.errorClose}>✕</button>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%   { top: 0; opacity: 1; }
          90%  { top: 100%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fillBar {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100dvh',
    background: 'var(--bg)',
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'var(--font-body)',
  },
  col: {
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  row: { display: 'flex', gap: 8, width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  backBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  badge: {
    background: 'var(--accent)',
    padding: '4px 12px',
    borderRadius: 99,
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  iconBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '1.1rem',
  },
  viewfinder: {
    width: '100%',
    aspectRatio: '4/3',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    background: '#111',
  },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  corners: { position: 'absolute', inset: 12, pointerEvents: 'none' },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'var(--accent)',
    borderStyle: 'solid',
    borderWidth: 0,
  },
  scanHint: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    textAlign: 'center',
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  tipBox: {
    width: '100%',
    background: 'rgba(79,138,255,0.1)',
    border: '1px solid var(--accent)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: '0.82rem',
    color: 'var(--accent)',
    lineHeight: 1.5,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'none',
    border: '3px solid #fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureDot: {
    width: 50,
    height: 50,
    background: '#fff',
    borderRadius: '50%',
    display: 'block',
  },
  preview: {
    width: '100%',
    borderRadius: 16,
    objectFit: 'cover',
    aspectRatio: '4/3',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    textAlign: 'center',
    padding: '1rem',
  },
  scanBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
    animation: 'scan 1.5s ease-in-out infinite',
    borderRadius: 2,
  },
  progressTrack: {
    width: '80%',
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent), var(--green))',
    borderRadius: 99,
    animation: 'fillBar 1.5s ease forwards',
  },
  errorBanner: {
    position: 'fixed',
    bottom: '1rem',
    left: '1rem',
    right: '1rem',
    background: '#2a0a0a',
    border: '1px solid var(--accent2)',
    borderRadius: 12,
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    gap: '1rem',
    zIndex: 100,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: 'var(--accent2)',
    fontWeight: 800,
    cursor: 'pointer',
  },
}