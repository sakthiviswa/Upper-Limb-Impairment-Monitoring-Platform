/**
 * Angle Calculation Utilities
 * ============================
 * Computes elbow joint angle from MediaPipe landmarks:
 *   shoulder → elbow → wrist
 */

export function calculateAngle(A, B, C) {
    const radians =
      Math.atan2(C.y - B.y, C.x - B.x) -
      Math.atan2(A.y - B.y, A.x - B.x)
    let angle = Math.abs((radians * 180.0) / Math.PI)
    if (angle > 180) angle = 360 - angle
    return Math.round(angle * 10) / 10
  }
  
  export function extractJoints(landmarks) {
    if (!landmarks || landmarks.length < 17) return null
    const R = { shoulder: landmarks[12], elbow: landmarks[14], wrist: landmarks[16] }
    const L = { shoulder: landmarks[11], elbow: landmarks[13], wrist: landmarks[15] }
    const rVis = (R.shoulder.visibility + R.elbow.visibility + R.wrist.visibility) / 3
    const lVis = (L.shoulder.visibility + L.elbow.visibility + L.wrist.visibility) / 3
    return rVis >= lVis ? R : L
  }
  
  export function computeSessionStats(angles, targetAngle = 90) {
    if (!angles.length) return null
    const n   = angles.length
    const avg = angles.reduce((s, a) => s + a, 0) / n
    const max = Math.max(...angles)
    const min = Math.min(...angles)
    const variance = angles.reduce((s, a) => s + (a - avg) ** 2, 0) / n
    const stdDev   = Math.sqrt(variance)
    return {
      avg:         Math.round(avg  * 10) / 10,
      max:         Math.round(max  * 10) / 10,
      min:         Math.round(min  * 10) / 10,
      accuracy:    Math.round(Math.max(0, 100 - Math.abs(avg - targetAngle)) * 10) / 10,
      consistency: Math.round(Math.max(0, 100 - stdDev) * 10) / 10,
      stdDev:      Math.round(stdDev * 10) / 10,
      count: n,
    }
  }