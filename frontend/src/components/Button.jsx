import { Pressable, StyleSheet, Text } from 'react-native'

import { colors } from '../styles/tokens'

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onPress,
  children,
}) {
  const variantStyle = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
  }[variant]

  const textStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    ghost: styles.ghostText,
  }[variant]

  const sizeStyle = size === 'lg' ? styles.lg : styles.md

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.textBase, textStyle]}>{children}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  md: {
    minHeight: 44,
  },
  lg: {
    minHeight: 56,
  },
  primary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.bgElevated,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  textBase: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  primaryText: {
    color: '#000',
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  ghostText: {
    color: colors.textPrimary,
  },
})
