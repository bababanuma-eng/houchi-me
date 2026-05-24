import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons } from '@expo/vector-icons'

import Badge from '../components/Badge'
import Button from '../components/Button'
import { curiosityMap, pointExchanges } from '../data/dummyData'
import { colors } from '../styles/tokens'
import { layout } from '../styles/layout'

function TabButton({ label, icon, active, onPress, badge }) {
  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <View style={styles.tabButtonInner}>
        <Text style={styles.tabIcon}>{icon}</Text>
        <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
        {badge ? <Text style={styles.tabBadge}>{badge}</Text> : null}
      </View>
      {active ? <View style={styles.tabUnderline} /> : null}
    </Pressable>
  )
}

function DotMeter({ level, max = 5 }) {
  return (
    <View style={styles.dotRow}>
      {Array.from({ length: max }).map((_, index) => (
        <View key={index} style={[styles.dot, index < level ? styles.dotActive : styles.dotIdle]} />
      ))}
    </View>
  )
}

export default function ProfileScreen({ user, reservations = [], logs = [], onWriteLog }) {
  const [tab, setTab] = useState('curiosity')
  const handle = useMemo(
    () => `@${(user.name || 'guest').toString().toLowerCase().replace(/\s+/g, '_')}`,
    [user.name],
  )
  const progressRemaining = Math.max(0, (user.nextTitlePoints ?? 500) - (user.points ?? 0))
  const progress = Math.min(1, Math.max(0, (user.points ?? 0) / (user.nextTitlePoints ?? 500)))

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Feather name="arrow-left" size={22} color="#fff" />
          <View style={styles.headerHandleWrap}>
            <Text style={styles.headerHandle}>{handle}</Text>
            <Ionicons name="chevron-down" size={12} color="#fff" />
          </View>
          <Feather name="menu" size={22} color="#fff" />
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{user.avatar || '🌱'}</Text>
          </View>
          <Text style={styles.title}>{handle}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat value="0" label="フォロー中" />
          <View style={styles.statDivider} />
          <Stat value="12" label="フォロワー" />
          <View style={styles.statDivider} />
          <Stat value={String(user.points ?? 0)} label="ポイント" />
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>プロフィールを編集</Text>
          </Pressable>
          <Pressable style={styles.bookmarkButton}>
            <Ionicons name="bookmark-outline" size={16} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.bioBlock}>
          <Text style={styles.bioTitle}>🏆 {user.title || '好奇心の芽'}</Text>
          <Text style={styles.subtitle}>
            {user.nextTitle || '探究するハンター'} まで残り {progressRemaining}pt 🌱
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.tabs}>
          <TabButton icon="🗺" label="マップ" active={tab === 'curiosity'} onPress={() => setTab('curiosity')} />
          <TabButton icon="📅" label="予約中" active={tab === 'reserved'} badge={reservations.length || null} onPress={() => setTab('reserved')} />
          <TabButton icon="📝" label="ログ" active={tab === 'logs'} badge={logs.length || null} onPress={() => setTab('logs')} />
          <TabButton icon="🎁" label="交換" active={tab === 'exchange'} onPress={() => setTab('exchange')} />
        </View>

        {tab === 'curiosity' && (
          <View style={styles.sectionList}>
            {curiosityMap.map((cluster) => (
              <View key={cluster.cluster} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {cluster.icon} {cluster.cluster}
                </Text>
                {cluster.items.map((item) => (
                  <View key={item.name} style={styles.rowBetween}>
                    <Text style={styles.rowLabel}>{item.name}</Text>
                    <Text style={styles.levelLabel}>Lv.{item.level}</Text>
                    <DotMeter level={item.level} max={item.max ?? 5} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 'reserved' && (
          <View style={styles.sectionList}>
            {reservations.length === 0 ? (
              <EmptyState label="予約中の体験会はありません" />
            ) : (
              reservations.map((reservation) => (
                <View key={reservation.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{reservation.title}</Text>
                  <Text style={styles.cardMeta}>
                    {reservation.startTime} • {reservation.location}
                  </Text>
                  <View style={styles.cardSpacer} />
                  {reservation.completed ? (
                    <Button fullWidth disabled>
                      ログ済み
                    </Button>
                  ) : (
                    <Button fullWidth onPress={() => onWriteLog?.(reservation)}>
                      参加後ログを書く
                    </Button>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'logs' && (
          <View style={styles.sectionList}>
            {logs.length === 0 ? (
              <EmptyState label="まだログがありません" />
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.card}>
                  <View style={styles.logHeader}>
                    <Text style={[styles.cardTitle, styles.logTitle]}>{log.title}</Text>
                    <Text style={styles.logDate}>{log.date}</Text>
                  </View>
                  <Text style={styles.cardBody}>{log.comment}</Text>
                  <View style={styles.logFooter}>
                    <Badge tone="soft" size="sm">
                      +{log.pointEarned}pt
                    </Badge>
                    <Text style={styles.logStars}>{'★'.repeat(log.funRating)}{'☆'.repeat(Math.max(0, 5 - log.funRating))}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'exchange' && (
          <View style={[styles.sectionList, styles.exchangeSection]}>
            <Text style={styles.exchangeCaption}>※ 近日公開予定</Text>
            {pointExchanges.map((reward) => (
              <View key={reward.reward} style={styles.exchangeCard}>
                <View style={styles.exchangeLeft}>
                  <Text style={styles.exchangeIcon}>{reward.icon}</Text>
                  <Text style={styles.exchangeReward}>{reward.reward}</Text>
                </View>
                <Text style={styles.exchangePoints}>{reward.points}pt</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function EmptyState({ label }) {
  return <Text style={styles.emptyState}>{label}</Text>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingTop: 12,
    paddingBottom: 120,
    gap: 18,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerHandleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerHandle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: layout.screenPadding,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: layout.screenPadding,
    marginTop: 0,
  },
  editButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioBlock: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 4,
    marginTop: 2,
  },
  bioTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    marginHorizontal: 32,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  tabs: {
    marginTop: 8,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 48,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  sectionList: {
    gap: 12,
    marginTop: 12,
    paddingHorizontal: layout.screenPadding,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cardBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  cardSpacer: {
    height: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  levelLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginRight: 12,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  dotIdle: {
    backgroundColor: colors.bgElevated,
  },
  emptyState: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 48,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  logTitle: {
    flex: 1,
  },
  logDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  logFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logStars: {
    color: colors.accent,
    fontSize: 14,
    letterSpacing: 1,
  },
  exchangeSection: {
    opacity: 0.5,
  },
  exchangeCaption: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    textAlign: 'center',
  },
  exchangeCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exchangeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exchangeIcon: {
    fontSize: 24,
  },
  exchangeReward: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  exchangePoints: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '800',
  },
})
