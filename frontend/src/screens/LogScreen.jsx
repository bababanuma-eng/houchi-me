import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons } from '@expo/vector-icons'

import Button from '../components/Button'
import Badge from '../components/Badge'
import PointBurst from '../components/PointBurst'
import StarRating from '../components/StarRating'
import { nextGenreSuggestions } from '../data/dummyData'
import { colors } from '../styles/tokens'
import { layout } from '../styles/layout'

export default function LogScreen({ reservation, onSave, onCancel, onFinish }) {
  const [comment, setComment] = useState('')
  const [funRating, setFunRating] = useState(0)
  const [againRating, setAgainRating] = useState(0)
  const [nextGenres, setNextGenres] = useState([])
  const [photo, setPhoto] = useState(null)
  const [saved, setSaved] = useState(false)
  const [burst, setBurst] = useState(false)

  const valid = comment.trim() !== '' && funRating > 0 && againRating > 0

  const toggleGenre = (genre) => {
    setNextGenres((prev) => (prev.includes(genre) ? prev.filter((item) => item !== genre) : [...prev, genre]))
  }

  const handleSave = () => {
    if (!valid) return
    onSave?.({
      id: `log-${Date.now()}`,
      reservationId: reservation?.id,
      title: reservation?.title,
      date: new Date().toLocaleDateString('ja-JP'),
      comment,
      funRating,
      againRating,
      nextGenres,
      photo,
      pointEarned: 30,
    })
    setBurst(true)
    setSaved(true)
  }

  const togglePhoto = () => {
    setPhoto((value) => (value === 'placeholder' ? null : 'placeholder'))
  }

  if (saved) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneWrap}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={styles.doneTitle}>ログを保存しました</Text>
          <Text style={styles.doneBody}>+30pt を獲得しました。</Text>
          <View style={styles.doneCard}>
            <Text style={styles.donePoints}>+30pt 獲得！</Text>
            <Text style={styles.doneCardSub}>陶芸カテゴリ Lv.1 解放 🎉</Text>
            <Text style={styles.doneCardNote}>手を動かす系の好奇心が成長しました</Text>
          </View>
          <Button fullWidth onPress={onFinish}>
            プロフィールを見る
          </Button>
          <Button variant="ghost" fullWidth onPress={onFinish}>
            閉じる
          </Button>
          <PointBurst show={burst} points={30} label="陶芸カテゴリ Lv.1 解放 🎉" onDone={() => setBurst(false)} duration={1600} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onCancel}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>LOG</Text>
          <Feather name="more-horizontal" size={24} color="#fff" />
        </View>
        <Text style={styles.headerSub}>今日の体験ログ</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardEmoji}>🎨</Text>
            <View style={styles.cardBodyWrap}>
              <Badge tone="success" size="sm">参加済</Badge>
              <Text style={styles.cardTitle}>{reservation?.title}</Text>
              <Text style={styles.cardMeta}>
                {reservation?.startTime} • {reservation?.location}
              </Text>
            </View>
          </View>
        </View>

        <FieldLabel label="感想を書く *" />
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="やってみてどうだった？"
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.textarea}
        />

        <FieldLabel label="面白かった度" />
        <View style={styles.ratingRow}>
          <StarRating value={funRating} onChange={setFunRating} size="lg" />
          <Text style={styles.ratingValue}>{funRating}/5</Text>
        </View>

        <FieldLabel label="またやりたい度" />
        <View style={styles.ratingRow}>
          <StarRating value={againRating} onChange={setAgainRating} size="lg" />
          <Text style={styles.ratingValue}>{againRating}/5</Text>
        </View>

        <FieldLabel label="次に気になるジャンル" />
        <Text style={styles.helper}>複数選択OK</Text>
        <View style={styles.genreWrap}>
          {nextGenreSuggestions.map((genre) => (
            <Pressable
              key={genre}
              onPress={() => toggleGenre(genre)}
              style={[styles.genreChip, nextGenres.includes(genre) && styles.genreChipActive]}
            >
              <Text style={[styles.genreChipText, nextGenres.includes(genre) && styles.genreChipTextActive]}>{genre}</Text>
            </Pressable>
          ))}
        </View>

        <FieldLabel label="写真を追加 (任意)" />
        <Pressable onPress={togglePhoto} style={styles.photoCard}>
          {photo === 'placeholder' ? (
            <>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.photoTitle}>写真設定済み</Text>
              <Text style={styles.photoSub}>タップで解除</Text>
            </>
          ) : (
            <>
              <Feather name="camera" size={28} color={colors.textPrimary} />
              <Text style={styles.photoTitle}>タップして選択</Text>
              <Text style={styles.photoSub}>体験の雰囲気を残せます</Text>
            </>
          )}
        </Pressable>

        <Button fullWidth size="lg" disabled={!valid} onPress={handleSave}>
          ログを保存する
        </Button>
        {!valid ? <Text style={styles.footerNote}>感想と2つの星評価を入力すると保存できます</Text> : null}
      </ScrollView>
      <PointBurst show={burst} points={30} label="陶芸カテゴリ Lv.1 解放 🎉" onDone={() => setBurst(false)} duration={1600} />
    </SafeAreaView>
  )
}

function FieldLabel({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 6,
    paddingBottom: 100,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -6,
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: layout.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardEmoji: {
    fontSize: 30,
    lineHeight: 32,
  },
  cardBodyWrap: {
    flex: 1,
    gap: 6,
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
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textarea: {
    minHeight: 120,
    borderRadius: layout.cardRadius - 2,
    padding: 14,
    color: colors.textPrimary,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingValue: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  helper: {
    marginTop: -8,
    color: colors.textMuted,
    fontSize: 12,
  },
  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
  },
  genreChipActive: {
    backgroundColor: colors.accent,
  },
  genreChipText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  genreChipTextActive: {
    color: '#000',
  },
  photoCard: {
    height: 128,
    borderRadius: layout.cardRadius,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  photoSub: {
    color: colors.textMuted,
    fontSize: 11,
  },
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  doneTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  doneBody: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  doneCard: {
    width: '100%',
    backgroundColor: colors.bgSecondary,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  donePoints: {
    color: colors.accent,
    fontSize: 40,
    fontWeight: '800',
  },
  doneCardSub: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  doneCardNote: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  footerNote: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: -4,
  },
})
