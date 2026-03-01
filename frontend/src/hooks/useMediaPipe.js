/**
 * useMediaPipe Hook
 * Loads MediaPipe Pose from CDN, streams webcam, calls onPoseResult per frame.
 */

import { useEffect, useRef, useCallback, useState } from 'react'

const POSE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404'
const CAM_CDN  = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

export function useMediaPipe({ videoRef, canvasRef, onPoseResult, enabled }) {
  const poseRef   = useRef(null)
  const cameraRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  const drawSkeleton = useCallback((landmarks, canvas) => {
    if (!canvas || !landmarks) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const CONNECTIONS = [[11,13],[13,15],[12,14],[14,16],[11,12]]
    const W = canvas.width, H = canvas.height
    CONNECTIONS.forEach(([a, b]) => {
      const lA = landmarks[a], lB = landmarks[b]
      if (!lA || !lB) return
      ctx.beginPath()
      ctx.moveTo(lA.x * W, lA.y * H)
      ctx.lineTo(lB.x * W, lB.y * H)
      ctx.strokeStyle = '#64CCC5'; ctx.lineWidth = 3; ctx.stroke()
    })
    ;[11,12,13,14,15,16].forEach(idx => {
      const lm = landmarks[idx]; if (!lm) return
      ctx.beginPath()
      ctx.arc(lm.x * W, lm.y * H, 7, 0, 2 * Math.PI)
      ctx.fillStyle = (idx === 13 || idx === 14) ? '#DAFFFB' : '#176B87'
      ctx.fill()
      ctx.strokeStyle = '#04364A'; ctx.lineWidth = 2; ctx.stroke()
    })
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    async function init() {
      try {
        await loadScript(`${POSE_CDN}/pose.js`)
        await loadScript(`${CAM_CDN}/camera_utils.js`)
        if (cancelled) return
        const pose = new window.Pose({
          locateFile: (f) => `${POSE_CDN}/${f}`,
        })
        pose.setOptions({
          modelComplexity: 1, smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.6, minTrackingConfidence: 0.6,
        })
        pose.onResults((results) => {
          if (cancelled) return
          const lm = results.poseLandmarks
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width  = videoRef.current.videoWidth  || 640
            canvasRef.current.height = videoRef.current.videoHeight || 480
            drawSkeleton(lm, canvasRef.current)
          }
          onPoseResult(lm || null)
        })
        poseRef.current = pose
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current)
              await poseRef.current.send({ image: videoRef.current })
          },
          width: 640, height: 480,
        })
        await camera.start()
        cameraRef.current = camera
        if (!cancelled) setReady(true)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load MediaPipe')
      }
    }
    init()
    return () => {
      cancelled = true
      cameraRef.current?.stop()
      poseRef.current?.close()
      poseRef.current = null; cameraRef.current = null
      setReady(false)
    }
  }, [enabled, videoRef, canvasRef, onPoseResult, drawSkeleton])

  return { ready, error }
}