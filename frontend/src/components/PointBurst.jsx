import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { colors } from '../styles/tokens'

export default function PointBurst({ show, points = 0, label, onDone, duration = 1600 }) {
  useEffect(() => {
    if (!show) return undefined
    const timer = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onDone, show])

  if (!show) return null

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.ring, { transform: [{ scale: 1 + index * 0.45 }], opacity: 0.35 - index * 0.08 }]} />
      ))}
      <View style={styles.content}>
        <Text style={styles.points}>+{points}pt</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  content: {
    alignItems: 'center',
  },
  points: {
    color: colors.accent,
    fontSize: 68,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(255,92,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  label: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
})
