import { useRef, useState } from 'react'
import { Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Video, ResizeMode } from 'expo-av'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'

import Button from '../components/Button'
import { genres } from '../data/dummyData'
import { supabase } from '../lib/supabase'
import { colors } from '../styles/tokens'
import { layout } from '../styles/layout'

const DURATION_OPTIONS = ['30分', '60分', '90分', '120分', 'その他']
const VISIBILITY_OPTIONS = ['全員', 'フォロワーのみ', '招待のみ']
const webInputStyle = {
  date: {
    width: '102px',
    minHeight: '34px',
    padding: '6px 10px',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor: '#1C1C1C',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '12px',
    textAlign: 'right',
    colorScheme: 'dark',
  },
  time: {
    width: '68px',
    minHeight: '34px',
    padding: '6px 10px',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor: '#1C1C1C',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '12px',
    textAlign: 'right',
    colorScheme: 'dark',
  },
  select: {
    minWidth: '86px',
    color: '#fff',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    textAlign: 'right',
    outline: 'none',
  },
}

export default function PostScreen({ onSubmit, onBackToHome }) {
  const [form, setForm] = useState({
    title: '',
    genre: '',
    description: '',
    date: '',
    time: '',
    location: '',
    duration: '60分',
    isFirstTimeFree: true,
    priceAmount: '',
    capacity: 6,
    isBeginnerFriendly: true,
    isFriendOk: true,
    allowComments: true,
    visibility: '全員',
  })
  const [submitted, setSubmitted] = useState(false)
  const [mediaAsset, setMediaAsset] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const pickedTypeRef = useRef(null)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const valid =
    form.title.trim() &&
    form.genre &&
    form.description.trim() &&
    form.location.trim() &&
    form.date &&
    form.time

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.9,
    })

    if (!result.canceled) {
      const asset = result.assets?.[0]
      setMediaAsset(asset)
      pickedTypeRef.current = asset?.type
    }
  }

  const uploadMedia = async () => {
    if (!mediaAsset?.uri) return null

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', {
        uri: mediaAsset.uri,
        name: mediaAsset.fileName || `upload-${Date.now()}`,
        type: mediaAsset.mimeType || (pickedTypeRef.current === 'video' ? 'video/mp4' : 'image/jpeg'),
      })

      const { data, error } = await supabase.functions.invoke('upload-media', { body })
      if (error || !data?.mediaUrl) return null
      return data.mediaUrl
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    const mediaUrl = await uploadMedia()
    await onSubmit?.({ ...form, mediaUrl })
    setSubmitting(false)
    setSubmitted(true)
  }

  const cycleDuration = () => {
    const currentIndex = DURATION_OPTIONS.indexOf(form.duration)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % DURATION_OPTIONS.length
    update({ duration: DURATION_OPTIONS[nextIndex] })
  }

  const cycleVisibility = () => {
    const currentIndex = VISIBILITY_OPTIONS.indexOf(form.visibility)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % VISIBILITY_OPTIONS.length
    update({ visibility: VISIBILITY_OPTIONS[nextIndex] })
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneWrap}>
          <View style={styles.doneIconWrap}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
            {Array.from({ length: 7 }).map((_, index) => (
              <View key={index} style={[styles.spark, sparkStyle(index)]} />
            ))}
          </View>
          <Text style={styles.doneTitle}>投稿しました</Text>
          <View style={styles.doneCard}>
            <Text style={styles.doneCardTitle}>「{form.title}」</Text>
            <Text style={styles.doneCardBody}>Homeフィードに表示されます</Text>
          </View>
          <Button fullWidth size="lg" onPress={onBackToHome}>
            Homeに戻る
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={onBackToHome}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.topBarTitle}>投稿の準備</Text>
          <Text style={styles.topBarAction}>ドラフト</Text>
        </View>

        <View style={styles.heroRow}>
          <Pressable onPress={pickMedia} style={styles.cover}>
            {mediaAsset ? (
              pickedTypeRef.current === 'video' ? (
                <Video source={{ uri: mediaAsset.uri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} isMuted shouldPlay isLooping />
              ) : (
                <Image source={{ uri: mediaAsset.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialIcons name="add-photo-alternate" size={36} color="#fff" />
                <Text style={styles.coverHint}>カバー</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.heroFields}>
            <Text style={styles.miniLabel}>タイトル</Text>
            <TextInput
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.heroTitleInput}
              value={form.title}
              onChangeText={(title) => update({ title })}
              placeholder="例：街角の小さな陶芸時間"
            />
            <Text style={styles.miniLabel}>説明</Text>
            <TextInput
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.heroDescriptionInput}
              value={form.description}
              onChangeText={(description) => update({ description })}
              placeholder="どんな体験？参加者にひと言。"
              multiline
            />
          </View>
        </View>

        <View style={styles.genreWrap}>
          {genres.map((genre) => (
            <Pressable
              key={genre}
              onPress={() => update({ genre })}
              style={[styles.genreChip, form.genre === genre && styles.genreChipActive]}
            >
              <Text style={[styles.genreChipText, form.genre === genre && styles.genreChipTextActive]}># {genre}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.detailCard}>
          <FormRow icon="🗓" label="開催日時">
            <View style={styles.dateTimeRow}>
              {Platform.OS === 'web' ? (
                <>
                  <input
                    value={form.date}
                    onChange={(event) => update({ date: event.target.value })}
                    type="date"
                    style={webInputStyle.date}
                  />
                  <input
                    value={form.time}
                    onChange={(event) => update({ time: event.target.value })}
                    type="time"
                    style={webInputStyle.time}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={[styles.inlineInput, styles.dateInput]}
                    value={form.date}
                    onChangeText={(date) => update({ date })}
                    placeholder="YYYY-MM-DD"
                  />
                  <TextInput
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={[styles.inlineInput, styles.timeInput]}
                    value={form.time}
                    onChangeText={(time) => update({ time })}
                    placeholder="HH:MM"
                  />
                </>
              )}
            </View>
          </FormRow>

          <FormRow icon="📍" label="開催場所">
            <TextInput
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.rowTextInput}
              value={form.location}
              onChangeText={(location) => update({ location })}
              placeholder="下北沢"
            />
          </FormRow>

          <FormRow icon="⏱" label="所要時間" onPress={cycleDuration}>
            {Platform.OS === 'web' ? (
              <select value={form.duration} onChange={(event) => update({ duration: event.target.value })} style={webInputStyle.select}>
                {DURATION_OPTIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            ) : (
              <View style={styles.trailingRow}>
                <Text style={styles.rowValueText}>{form.duration}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            )}
          </FormRow>

          <FormRow icon="💰" label="参加費">
            <View style={styles.priceRow}>
              {form.isFirstTimeFree ? (
                <Text style={styles.rowValueText}>初回無料</Text>
              ) : (
                <View style={styles.priceInputWrap}>
                  <TextInput
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={[styles.rowTextInput, styles.priceInput]}
                    value={form.priceAmount}
                    onChangeText={(priceAmount) => update({ priceAmount })}
                    placeholder="500"
                    keyboardType="numeric"
                  />
                  <Text style={styles.rowSuffix}>円</Text>
                </View>
              )}
              <Switch value={form.isFirstTimeFree} onValueChange={(isFirstTimeFree) => update({ isFirstTimeFree })} />
            </View>
          </FormRow>

          <FormRow icon="👥" label="定員">
            <View style={styles.capacityRow}>
              <Pressable style={[styles.capacityButton, form.capacity <= 1 && styles.capacityButtonDisabled]} onPress={() => update({ capacity: Math.max(1, form.capacity - 1) })}>
                <Text style={styles.capacityButtonText}>−</Text>
              </Pressable>
              <Text style={styles.capacityValue}>{form.capacity}</Text>
              <Pressable style={styles.capacityButton} onPress={() => update({ capacity: Math.min(20, form.capacity + 1) })}>
                <Text style={styles.capacityButtonText}>＋</Text>
              </Pressable>
            </View>
          </FormRow>

          <FormRow icon="🌱" label="初心者歓迎">
            <Switch value={form.isBeginnerFriendly} onValueChange={(isBeginnerFriendly) => update({ isBeginnerFriendly })} />
          </FormRow>

          <FormRow icon="👯" label="友達参加OK">
            <Switch value={form.isFriendOk} onValueChange={(isFriendOk) => update({ isFriendOk })} />
          </FormRow>

          <FormRow icon="🎬" label="公開範囲" onPress={cycleVisibility}>
            <View style={styles.trailingRow}>
              <Text style={styles.rowValueText}>{form.visibility}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </FormRow>

          <FormRow icon="💬" label="コメントを許可">
            <Switch value={form.allowComments} onValueChange={(allowComments) => update({ allowComments })} />
          </FormRow>
        </View>

        <View style={styles.footerActions}>
          <Pressable style={styles.draftButton}>
            <Text style={styles.draftButtonText}>ドラフト</Text>
          </Pressable>
          <Pressable
            style={[styles.publishButton, (!valid || submitting || uploading) && styles.publishButtonDisabled]}
            disabled={!valid || submitting || uploading}
            onPress={handleSubmit}
          >
            <Text style={styles.publishButtonText}>
              {uploading ? 'アップロード中…' : submitting ? '投稿中…' : '投稿する'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function LabeledInput({ label, multiline = false, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.textarea]}
        multiline={multiline}
        {...props}
      />
    </View>
  )
}

function FormRow({ icon, label, children, onPress }) {
  const Wrapper = onPress ? Pressable : View
  return (
    <Wrapper style={styles.formRow} onPress={onPress}>
      <View style={styles.formRowLeft}>
        <Text style={styles.formRowIcon}>{icon}</Text>
        <Text style={styles.formRowLabel}>{label}</Text>
      </View>
      <View style={styles.formRowRight}>{children}</View>
    </Wrapper>
  )
}

function sparkStyle(index) {
  const angle = (index / 7) * Math.PI * 2
  const distance = 72 + (index % 3) * 12
  return {
    transform: [{ translateX: Math.cos(angle) * distance }, { translateY: Math.sin(angle) * distance }],
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 120,
  },
  topBar: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: layout.topBarTop,
    paddingBottom: layout.topBarBottom,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  topBarAction: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 16,
  },
  heroFields: {
    flex: 1,
  },
  miniLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitleInput: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 8,
    marginBottom: 12,
  },
  heroDescriptionInput: {
    color: colors.textPrimary,
    fontSize: 14,
    minHeight: 68,
    textAlignVertical: 'top',
  },
  cover: {
    width: 112,
    aspectRatio: 3 / 4,
    borderRadius: layout.cardRadius - 6,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
  },
  fieldWrap: {
    marginTop: 16,
    marginHorizontal: 16,
    gap: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    backgroundColor: colors.bgSecondary,
    fontSize: 15,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  genreWrap: {
    marginTop: 12,
    marginHorizontal: layout.screenPadding,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailCard: {
    marginTop: 24,
    marginHorizontal: layout.screenPadding,
    borderRadius: layout.cardRadius,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  formRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formRowIcon: {
    fontSize: 16,
  },
  formRowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  formRowRight: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineInput: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    color: colors.textPrimary,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 12,
    textAlign: 'right',
  },
  dateInput: {
    width: 102,
  },
  timeInput: {
    width: 68,
  },
  rowTextInput: {
    minWidth: 110,
    color: colors.textPrimary,
    fontSize: 14,
    textAlign: 'right',
  },
  rowValueText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  rowSuffix: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trailingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevron: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
    lineHeight: 18,
  },
  priceInput: {
    minWidth: 64,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  capacityButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  capacityButtonDisabled: {
    opacity: 0.3,
  },
  capacityButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  capacityValue: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 28,
    minWidth: 28,
    textAlign: 'center',
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bgElevated,
  },
  genreChipActive: {
    backgroundColor: colors.textPrimary,
  },
  genreChipText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  genreChipTextActive: {
    color: '#000',
  },
  row: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  doneIconWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  doneTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  doneCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    gap: 6,
  },
  doneCardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  doneCardBody: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  footerActions: {
    marginTop: 24,
    marginHorizontal: layout.screenPadding,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  publishButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.4,
  },
  publishButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
})
