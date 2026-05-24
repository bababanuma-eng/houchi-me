import { StyleSheet, Text, View } from 'react-native'

import { colors } from '../styles/tokens'

export default function Badge({ tone = 'soft', size = 'md', icon, children }) {
  const toneStyle = {
    soft: styles.soft,
    accent: styles.accent,
    outline: styles.outline,
    success: styles.success,
  }[tone]

  const textToneStyle = {
    soft: styles.softText,
    accent: styles.accentText,
    outline: styles.outlineText,
    success: styles.successText,
  }[tone]

  return (
    <View style={[styles.base, size === 'sm' ? styles.sm : styles.md, toneStyle]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={[styles.text, textToneStyle]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  soft: {
    backgroundColor: colors.accentSoft,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  success: {
    backgroundColor: 'rgba(0, 229, 160, 0.14)',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  iconWrap: {
    marginRight: 4,
  },
  softText: {
    color: colors.accent,
  },
  accentText: {
    color: '#000',
  },
  outlineText: {
    color: colors.textSecondary,
  },
  successText: {
    color: colors.success,
  },
})
