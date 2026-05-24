import { useEffect, useMemo, useState } from 'react'
import { Alert, Platform, StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import BottomTabBar from './components/BottomTabBar'
import HomeScreen from './screens/HomeScreen'
import LogScreen from './screens/LogScreen'
import PostScreen from './screens/PostScreen'
import ProfileScreen from './screens/ProfileScreen'
import { initialLogs } from './data/dummyData'
import { supabase } from './lib/supabase'
import { layout } from './styles/layout'

function toUiExperience(row) {
  return {
    id: row.id,
    title: row.title,
    genre: row.category,
    description: row.description,
    location: row.location,
    price: row.fee === 0 ? '初回無料' : `${row.fee}円`,
    isFirstTimeFree: row.fee === 0,
    pointReward: row.point_reward,
    capacity: row.capacity,
    reservedCount: row.reserved_count,
    creator: row.users?.name ?? 'ユーザー',
    creatorAvatar: '🌱',
    isBeginnerFriendly: false,
    isFriendOk: false,
    startTime: row.scheduled_at,
    duration: '60分',
    thumbnailUrl: row.media_url,
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [authUser, setAuthUser] = useState(null)
  const [user, setUser] = useState({
    name: '',
    avatar: '🌱',
    points: 0,
    title: '好奇心の芽',
    nextTitle: '探究するハンター',
    nextTitlePoints: 500,
    joinedCount: 0,
  })
  const [experiences, setExperiences] = useState([])
  const [reservations, setReservations] = useState([])
  const [logs, setLogs] = useState(initialLogs)
  const [logTarget, setLogTarget] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthUser(session.user)
        return
      }
      supabase.auth.signInAnonymously().then(({ data }) => {
        setAuthUser(data.user)
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authUser) return

    const loadOrCreateUser = async () => {
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()

      if (data) {
        setUser((prev) => ({
          ...prev,
          ...data,
          avatar: prev.avatar,
          nextTitle: '探究するハンター',
          nextTitlePoints: 500,
        }))
        return
      }

      const { data: created } = await supabase.from('users').insert({ id: authUser.id }).select().single()
      if (created) {
        setUser((prev) => ({
          ...prev,
          ...created,
          avatar: prev.avatar,
          nextTitle: '探究するハンター',
          nextTitlePoints: 500,
        }))
      }
    }

    loadOrCreateUser()
  }, [authUser])

  const fetchExperiences = async () => {
    const { data } = await supabase
      .from('experiences')
      .select('*, users(name)')
      .order('created_at', { ascending: false })

    if (data) setExperiences(data.map(toUiExperience))
  }

  const fetchReservations = async (userId) => {
    const { data } = await supabase
      .from('reservations')
      .select('id, status, experience_id, experiences(title, location, scheduled_at)')
      .eq('user_id', userId)
      .in('status', ['reserved', 'joined'])
      .order('created_at', { ascending: false })

    if (data) {
      setReservations(
        data.map((reservation) => ({
          id: reservation.id,
          experienceId: reservation.experience_id,
          title: reservation.experiences?.title ?? '',
          startTime: reservation.experiences?.scheduled_at ?? '',
          location: reservation.experiences?.location ?? '',
          completed: reservation.status === 'joined',
        })),
      )
    }
  }

  useEffect(() => {
    fetchExperiences()
  }, [])

  useEffect(() => {
    if (authUser) fetchReservations(authUser.id)
  }, [authUser])

  const reservedIds = useMemo(() => new Set(reservations.map((item) => item.experienceId)), [reservations])

  const handleReserve = async (experience) => {
    if (reservedIds.has(experience.id)) return

    const { data, error } = await supabase.functions.invoke('reserve-experience', {
      body: { experience_id: experience.id },
    })

    if (error || data?.error) {
      Alert.alert('予約に失敗しました', data?.error || 'もう一度お試しください。')
      return
    }

    setReservations((prev) => [
      {
        id: data.reservation.id,
        experienceId: experience.id,
        title: experience.title,
        startTime: experience.startTime,
        location: experience.location,
        completed: false,
      },
      ...prev,
    ])
  }

  const handleSaveLog = (log) => {
    setLogs((prev) => [log, ...prev])
    setReservations((prev) => prev.map((item) => (item.id === log.reservationId ? { ...item, completed: true } : item)))
    setUser((prev) => ({
      ...prev,
      points: (prev.points ?? 0) + (log.pointEarned || 30),
      joinedCount: (prev.joinedCount ?? 0) + 1,
    }))
  }

  const handlePostSubmit = async (formData) => {
    if (!authUser) return
    await supabase.from('experiences').insert({
      creator_id: authUser.id,
      title: formData.title,
      description: formData.description,
      category: formData.genre,
      location: formData.location,
      fee: formData.isFirstTimeFree ? 0 : parseInt(formData.priceAmount || 0, 10),
      capacity: formData.capacity,
      scheduled_at: formData.date && formData.time ? new Date(`${formData.date}T${formData.time}`).toISOString() : null,
      media_url: formData.mediaUrl ?? null,
    })
    await fetchExperiences()
  }

  let screen = null
  switch (activeTab) {
    case 'home':
      screen = <HomeScreen experiences={experiences} reservedIds={reservedIds} onReserve={handleReserve} />
      break
    case 'post':
      screen = <PostScreen onSubmit={handlePostSubmit} onBackToHome={() => setActiveTab('home')} />
      break
    case 'profile':
      screen = <ProfileScreen user={user} reservations={reservations} logs={logs} onWriteLog={setLogTarget} />
      break
    default:
      screen = null
  }

  const appShell = (
    <View style={styles.container}>
      <View style={styles.screen}>{screen}</View>
      {!logTarget ? (
        <BottomTabBar active={activeTab} onChange={setActiveTab} />
      ) : (
        <View style={styles.overlay}>
          <LogScreen
            reservation={logTarget}
            onSave={handleSaveLog}
            onCancel={() => setLogTarget(null)}
            onFinish={() => {
              setLogTarget(null)
              setActiveTab('profile')
            }}
          />
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {Platform.OS === 'web' ? (
        <View style={styles.webRoot}>
          <View style={styles.deviceFrame}>{appShell}</View>
        </View>
      ) : (
        appShell
      )}
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  screen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  webRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    backgroundImage: 'radial-gradient(circle at 50% 0%, #111 0%, #000 60%)',
  },
  deviceFrame: {
    width: layout.frameWidth,
    height: layout.frameHeight,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
    borderRadius: 44,
    boxShadow: '0 0 0 10px #0a0a0a, 0 0 0 12px #1a1a1a, 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 120px rgba(255, 92, 0, 0.08)',
  },
})
