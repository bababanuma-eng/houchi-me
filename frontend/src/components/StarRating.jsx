import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '../styles/tokens'

export default function StarRating({
  value = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
}) {
  const fontSize = size === 'lg' ? 32 : 26
  const lineHeight = size === 'lg' ? 40 : 34

  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < value
        return (
          <Pressable
            key={index}
            disabled={readOnly}
            onPress={() => onChange?.(index + 1)}
            style={({ pressed }) => [styles.starPressable, pressed && styles.pressed]}
          >
            <Text style={[styles.star, { fontSize, lineHeight }, filled ? styles.filled : styles.empty]}>
              ★
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  starPressable: {
    padding: 2,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  filled: {
    color: colors.accent,
  },
  empty: {
    color: colors.textMuted,
  },
})
