import React from 'react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'

const SKIN_KEYWORDS = {
  burn:    { label: 'Possível queimadura',     icon: '🔥', severity: 'high',   points: 50, tips: ['Arrefece com água fria 10 min','NÃO uses gelo','Cobre com penso limpo','Liga 112 se grande'] },
  wound:   { label: 'Ferida ou corte',         icon: '🩹', severity: 'medium', points: 40, tips: ['Pressão suave para parar sangramento','Desinfeta com álcool','Cobre com penso','Vai ao urgências se profunda'] },
  spot:    { label: 'Mancha escura detetada',  icon: '⚠️', severity: 'high',   points: 60, tips: ['Não ignores manchas irregulares','Aplica protetor solar','Marca consulta com dermatologista','Usa regra ABCDE'] },
  rash:    { label: 'Irritação na pele',       icon: '🔴', severity: 'medium', points: 30, tips: ['Lava com água morna e sabão neutro','Aplica gel de aloe vera','Evita coçar','Consulta médico se piorar em 24h'] },
  healthy: { label: 'Pele com boa aparência',  icon: '✅', severity: 'low',    points: 10, tips: ['Continua a usar protetor solar','Hidrata a pele','Bebe bastante água','Faz exames anuais'] },
}

function classifySkin(predictions) {
  if (!predictions?.length) return SKIN_KEYWORDS.healthy
  const text = predictions.map(p => p.className.toLowerCase()).join(' ')
  if (/burn|fire|flame|red/.test(text))            return SKIN_KEYWORDS.burn
  if (/wound|cut|scar|blood/.test(text))           return SKIN_KEYWORDS.wound
  if (/spot|mole|dark|pigment|freckle/.test(text)) return SKIN_KEYWORDS.spot
  if (/rash|itch|irritat|inflam|swell/.test(text)) return SKIN_KEYWORDS.rash
  return SKIN_KEYWORDS.healthy
}

export default function Camera({ user }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const modelRef = useRef(null)

  const [phase, setPhase] = useState('loading')
  const [loadProgress, setLoadProgress] = useState(0)
  const [capturedImage, setCapturedImage] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadModel() {
      try {
        setLoadProgress(10)
        await tf.ready()
        setLoadProgress(40)
        const model = await mobilenet.load({ version: 2, alpha: 1.0 })
        if (cancelled) return
        modelRef.current = model
        setLoadProgress(100)
        setPhase('ready')
      } catch { if (!cancelled) setError('Erro ao carregar IA. Recarrega a página.') }
    }
    loadModel()
    return () => { cancelled = true }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch { setError('Não foi possível aceder à câmara. Verifica as permissões.') }
  }, [facingMode])

  useEffect(() => { if (phase === 'ready') startCamera() }, [facingMode, phase, startCamera])
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.92))
    setPhase('captured')
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const analyzeImage = useCallback(async () => {
    if (!modelRef.current || !canvasRef.current) return
    setPhase('analyzing')
    try {
      const predictions = await modelRef.current.classify(canvasRef.current, 5)
      const result = classifySkin(predictions)
      // Navega para Result passando o resultado e o user
      navigate('/result', { state: { result, user } })
    } catch { setError('Erro ao analisar. Tenta novamente.'); setPhase('captured') }
  }, [navigate, user])

  const reset = useCallback(() => {
    setCapturedImage(null); setError(null); setPhase('ready'); startCamera()
  }, [startCamera])

  return (
    <div style={S.page}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Loading */}
      {phase === 'loading' && (
        <div style={S.center}>
          <div style={S.bigEmoji}>🤖</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>A carregar a IA...</h2>
          <div style={S.progressTrack}><div style={{ ...S.progressFill, width: `${loadProgress}%` }} /></div>
          <p style={S.hint}>O modelo corre no teu dispositivo — sem internet!</p>
        </div>
      )}

      {/* Câmara ativa */}
      {phase === 'ready' && (
        <div style={S.col}>
          <div style={S.header}>
            <button onClick={() => navigate('/')} style={S.backBtn}>← Voltar</button>
            <span style={S.badge}>📸 Missão Ativa</span>
            <button style={S.iconBtn} onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}>🔄</button>
          </div>
          <div style={S.viewfinder}>
            <video ref={videoRef} autoPlay playsInline muted style={S.video} />
            <div style={S.corners}><div style={{...S.corner,...S.tl}}/><div style={{...S.corner,...S.tr}}/><div style={{...S.corner,...S.bl}}/><div style={{...S.corner,...S.br}}/></div>
            <p style={S.scanHint}>Aponta para a zona da pele</p>
          </div>
          <button style={S.captureBtn} onClick={capturePhoto}><span style={S.captureDot}/></button>
        </div>
      )}

      {/* Foto capturada */}
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
            <button className="btn btn-primary" onClick={analyzeImage}>🧬 Analisar</button>
          </div>
        </div>
      )}

      {/* A analisar */}
      {phase === 'analyzing' && (
        <div style={{ ...S.col, position: 'relative' }}>
          <img src={capturedImage} alt="A analisar" style={{ ...S.preview, filter: 'blur(4px) brightness(0.4)' }} />
          <div style={S.analyzingOverlay}>
            <div style={S.scanBeam} />
            <span style={{ fontSize: '3.5rem', animation: 'pulse 1.2s ease-in-out infinite' }}>🤖</span>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Helpy está a analisar...</h2>
            <p style={S.hint}>A foto não sai do teu dispositivo 🔒</p>
          </div>
        </div>
      )}

      {error && (
        <div style={S.errorBanner}>
          ❌ {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--accent2)', fontWeight: 800, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes scan  { 0%{top:0;opacity:1} 90%{top:100%;opacity:1} 100%{top:100%;opacity:0} }
      `}</style>
    </div>
  )
}

const S = {
  page: { minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'var(--font-body)' },
  center: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  col: { width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  row: { display: 'flex', gap: 8, width: '100%' },
  bigEmoji: { fontSize: '4rem' },
  progressTrack: { width: 200, height: 8, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg,var(--accent),var(--green))', borderRadius: 99, transition: 'width 0.4s ease' },
  hint: { fontSize: '0.8rem', color: 'var(--muted)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  backBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },
  badge: { background: 'var(--accent)', padding: '4px 12px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 700 },
  iconBtn: { background: 'none', border: '1px solid var(--border)', color: '#fff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: '1.1rem' },
  viewfinder: { width: '100%', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#111' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  corners: { position: 'absolute', inset: 12, pointerEvents: 'none' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: 'var(--accent)', borderStyle: 'solid', borderWidth: 0 },
  tl: { top:0, left:0, borderTopWidth:3, borderLeftWidth:3, borderTopLeftRadius:6 },
  tr: { top:0, right:0, borderTopWidth:3, borderRightWidth:3, borderTopRightRadius:6 },
  bl: { bottom:0, left:0, borderBottomWidth:3, borderLeftWidth:3, borderBottomLeftRadius:6 },
  br: { bottom:0, right:0, borderBottomWidth:3, borderRightWidth:3, borderBottomRightRadius:6 },
  scanHint: { position: 'absolute', bottom:10, width:'100%', textAlign:'center', fontSize:'0.8rem', color:'rgba(255,255,255,0.6)', margin:0 },
  captureBtn: { width:72, height:72, borderRadius:'50%', background:'none', border:'3px solid #fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  captureDot: { width:50, height:50, background:'#fff', borderRadius:'50%', display:'block' },
  preview: { width:'100%', borderRadius:16, objectFit:'cover', aspectRatio:'4/3' },
  analyzingOverlay: { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.5rem', textAlign:'center', padding:'1rem' },
  scanBeam: { position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,var(--accent),transparent)', animation:'scan 1.8s ease-in-out infinite', borderRadius:2 },
  errorBanner: { position:'fixed', bottom:'1rem', left:'1rem', right:'1rem', background:'#2a0a0a', border:'1px solid var(--accent2)', borderRadius:12, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.85rem', gap:'1rem', zIndex:100 },
}
