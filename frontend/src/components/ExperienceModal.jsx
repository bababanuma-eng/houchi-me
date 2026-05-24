import { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons, Feather, FontAwesome6 } from '@expo/vector-icons'

import Badge from './Badge'
import Button from './Button'
import { colors, getGenreVisual } from '../styles/tokens'
import { layout } from '../styles/layout'

export default function ExperienceModal({
  experience,
  open,
  onClose,
  onReserve,
  alreadyReserved = false,
}) {
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (open) {
      setCompleted(!!alreadyReserved)
      return undefined
    }

    const timer = setTimeout(() => setCompleted(false), 280)
    return () => clearTimeout(timer)
  }, [alreadyReserved, experience?.id, open])

  if (!experience) return null

  const remaining = Math.max(experience.capacity - experience.reservedCount, 0)
  const visual = getGenreVisual(experience.genre)
  const handleReserve = () => {
    onReserve?.(experience)
    setCompleted(true)
  }

  if (!open) return null

  const sheetContent = (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content}>
          {!completed ? (
            <>
              <View style={[styles.hero, { backgroundColor: visual.colors[1] }]}>
                <Text style={styles.heroEmoji}>{visual.emoji}</Text>
              </View>

              <View style={styles.badgeRow}>
                <Badge>#{experience.genre}</Badge>
                {experience.isFirstTimeFree && <Badge tone="success">初回無料</Badge>}
              </View>
              <Text style={styles.title}>{experience.title}</Text>

              <View style={styles.card}>
                <Row icon={<MaterialIcons name="calendar-month" size={18} color="#fff" />} label="開催日時" value={experience.startTime} />
                <Row icon={<Feather name="map-pin" size={16} color="#fff" />} label="開催場所" value={experience.location} />
                <Row icon={<Feather name="clock" size={16} color="#fff" />} label="所要時間" value={experience.duration || '60分'} />
                <Row icon={<MaterialIcons name="yen" size={18} color="#fff" />} label="参加費" value={experience.price} />
                <Row icon={<Feather name="users" size={16} color="#fff" />} label="定員" value={`${experience.capacity}人 / 残り ${remaining} 席`} />
                <Row icon={<FontAwesome6 name="star" size={16} color="#fff" />} label="獲得ポイント" value={`+${experience.pointReward}pt`} accent />
              </View>

              <View style={styles.infoBadges}>
                {experience.isBeginnerFriendly ? <Badge tone="soft">初心者歓迎</Badge> : null}
                {experience.isFriendOk ? <Badge tone="outline">友達参加OK</Badge> : null}
                {experience.isFirstTimeFree && <Badge tone="success">初回無料</Badge>}
              </View>

              <Text style={styles.description}>{experience.description}</Text>

              <View style={styles.hostBox}>
                <Text style={styles.hostAvatar}>{experience.creatorAvatar}</Text>
                <View>
                  <Text style={styles.hostName}>{experience.creator}</Text>
                  <Text style={styles.hostRole}>ホスト</Text>
                </View>
              </View>

              <View style={styles.actionWrap}>
                <Button variant="primary" size="lg" fullWidth onPress={handleReserve} disabled={alreadyReserved}>
                  {alreadyReserved ? '予約済み' : '予約する'}
                </Button>
              </View>
            </>
          ) : (
            <View style={styles.completedWrap}>
              <View style={styles.completedIcon}>
                <Text style={styles.completedEmoji}>✅</Text>
              </View>
              <Text style={styles.completedTitle}>予約が完了しました</Text>

              <View style={styles.completedCard}>
                <View style={styles.badgeRow}>
                  <Badge size="sm">#{experience.genre}</Badge>
                </View>
                <Text style={styles.completedCardTitle}>{experience.title}</Text>
                <Text style={styles.completedCardMeta}>📅 {experience.startTime}</Text>
                <Text style={styles.completedCardMeta}>📍 {experience.location}</Text>
              </View>

              <Text style={styles.completedReward}>参加後にログを書くと +30pt 獲得！</Text>

              <Button variant="secondary" size="lg" fullWidth onPress={onClose}>
                閉じる
              </Button>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )

  if (Platform.OS === 'web') {
    return <View style={styles.webOverlay}>{sheetContent}</View>
  }

  return (
    <Modal animationType="slide" transparent visible={open} onRequestClose={onClose}>
      {sheetContent}
    </Modal>
  )
}

function Row({ icon, label, value, accent = false }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && styles.accent]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginTop: 12,
  },
  content: {
    paddingHorizontal: layout.screenPadding + 4,
    paddingBottom: 28,
    gap: 16,
  },
  hero: {
    height: 128,
    borderRadius: layout.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  heroEmoji: {
    fontSize: 72,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: layout.cardRadius,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIcon: {
    width: 20,
    alignItems: 'center',
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 'auto',
    maxWidth: '55%',
    textAlign: 'right',
  },
  accent: {
    color: colors.accent,
  },
  infoBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  hostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: layout.cardRadius,
    backgroundColor: colors.bgSecondary,
  },
  hostAvatar: {
    fontSize: 32,
  },
  hostName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  hostRole: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  actionWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
  },
  completedWrap: {
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 16,
  },
  completedIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 160, 0.14)',
  },
  completedEmoji: {
    fontSize: 48,
  },
  completedTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  completedCard: {
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: layout.cardRadius,
    padding: 16,
    gap: 8,
  },
  completedCardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
  },
  completedCardMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  completedReward: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
})
