import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'

import { colors } from '../styles/tokens'

function Tab({ kind, label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      {kind === 'home' ? (
        <MaterialIcons name="home-filled" size={26} color={active ? '#fff' : '#A1A1A1'} />
      ) : (
        <Ionicons name="person" size={24} color={active ? '#fff' : '#A1A1A1'} />
      )}
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  )
}

export default function BottomTabBar({ active = 'home', onChange }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Tab kind="home" label="ホーム" active={active === 'home'} onPress={() => onChange?.('home')} />
      <Pressable onPress={() => onChange?.('post')} style={({ pressed }) => [styles.centerButtonWrap, pressed && styles.pressed]}>
        <View style={styles.centerButtonTeal} />
        <View style={styles.centerButtonPink} />
        <View style={styles.centerButtonFront}>
          <MaterialIcons name="add" size={22} color="#000" />
        </View>
      </Pressable>
      <Tab kind="profile" label="プロフィール" active={active === 'profile'} onPress={() => onChange?.('profile')} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#000',
    paddingTop: 4,
    minHeight: 64,
  },
  tab: {
    alignItems: 'center',
    gap: 2,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A1A1A1',
  },
  activeLabel: {
    color: colors.textPrimary,
  },
  centerButtonWrap: {
    width: 52,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonTeal: {
    position: 'absolute',
    inset: 0,
    transform: [{ translateX: -4 }],
    borderRadius: 10,
    backgroundColor: '#25F4EE',
  },
  centerButtonPink: {
    position: 'absolute',
    inset: 0,
    transform: [{ translateX: 4 }],
    borderRadius: 10,
    backgroundColor: colors.danger,
  },
  centerButtonFront: {
    position: 'absolute',
    inset: 0,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
