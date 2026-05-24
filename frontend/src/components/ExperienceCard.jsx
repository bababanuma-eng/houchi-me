import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Video, ResizeMode } from 'expo-av'
import { WebView } from 'react-native-webview'
import { Ionicons, Feather } from '@expo/vector-icons'

import { colors, getGenreVisual } from '../styles/tokens'

function seededInt(seed, min, max) {
  let h = 0
  const s = String(seed)
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  const value = Math.abs(h)
  return min + (value % (max - min + 1))
}

function formatCount(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return String(count)
}

function toHandle(name) {
  if (!name) return 'user'
  return name
    .toLowerCase()
    .replace(/[\s　・·]/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function getStreamUrl(mediaUrl) {
  if (!mediaUrl?.includes('cloudflarestream.com')) return null
  const separator = mediaUrl.includes('?') ? '&' : '?'
  return `${mediaUrl}${separator}autoplay=true&muted=true&loop=true&controls=false&preload=true&letterboxColor=transparent`
}

function ensureStreamSdk() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.Stream) return Promise.resolve(window.Stream)

  if (window.__streamSdkPromise) return window.__streamSdkPromise

  window.__streamSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-stream-sdk="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Stream), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js'
    script.async = true
    script.dataset.streamSdk = 'true'
    script.onload = () => resolve(window.Stream)
    script.onerror = reject
    document.body.appendChild(script)
  })

  return window.__streamSdkPromise
}

function CloudflareStreamPlayer({ experience, paused }) {
  const streamUrl = getStreamUrl(experience.thumbnailUrl)
  const iframeRef = useRef(null)
  const webViewRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (Platform.OS !== 'web' || !streamUrl) return undefined

    let disposed = false

    ensureStreamSdk()
      .then((StreamCtor) => {
        if (disposed || !StreamCtor || !iframeRef.current) return
        const player = StreamCtor(iframeRef.current)
        player.muted = true
        player.loop = true
        playerRef.current = player
        if (paused) {
          player.pause()
          return
        }
        player.play().catch(() => {
          player.muted = true
          player.play().catch(() => {})
        })
      })
      .catch(() => {})

    return () => {
      disposed = true
      playerRef.current = null
    }
  }, [paused, streamUrl])

  useEffect(() => {
    if (!streamUrl) return

    if (Platform.OS === 'web') {
      const player = playerRef.current
      if (!player) return
      if (paused) {
        player.pause()
        return
      }
      player.play().catch(() => {
        player.muted = true
        player.play().catch(() => {})
      })
      return
    }

    if (!webViewRef.current) return
    const command = paused ? 'pause' : 'play'
    webViewRef.current.injectJavaScript(`
      if (window.__streamPlayer) {
        try {
          window.__streamPlayer.${command}();
          if (!${paused ? 'true' : 'false'}) {
            window.__streamPlayer.muted = true;
          }
        } catch (e) {}
      }
      true;
    `)
  }, [paused, streamUrl])

  if (!streamUrl) return null

  if (Platform.OS === 'web') {
    return (
      <iframe
        ref={iframeRef}
        src={streamUrl}
        title={experience.title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={styles.streamFrame}
      />
    )
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <style>
          html, body { margin: 0; padding: 0; background: #000; overflow: hidden; height: 100%; }
          #player-wrap { position: fixed; inset: 0; }
          iframe { border: 0; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="player-wrap">
          <iframe
            id="stream-player"
            src="${streamUrl}"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowfullscreen="true"
          ></iframe>
        </div>
        <script src="https://embed.cloudflarestream.com/embed/sdk.latest.js"></script>
        <script>
          const init = () => {
            if (!window.Stream) return setTimeout(init, 50);
            const iframe = document.getElementById('stream-player');
            const player = window.Stream(iframe);
            window.__streamPlayer = player;
            player.muted = true;
            player.loop = true;
            player.play && player.play().catch(() => {});
          };
          init();
        </script>
      </body>
    </html>
  `

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={StyleSheet.absoluteFill}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
      originWhitelist={['*']}
    />
  )
}

function BackgroundMedia({ experience, paused }) {
  const visual = getGenreVisual(experience.genre)
  const mediaUrl = experience.thumbnailUrl

  if (!mediaUrl) {
    return (
      <LinearGradient colors={visual.colors} style={StyleSheet.absoluteFill}>
        <View style={styles.fallbackCenter}>
          <Text style={styles.fallbackEmoji}>{visual.emoji}</Text>
        </View>
      </LinearGradient>
    )
  }

  if (mediaUrl.includes('iframe.cloudflarestream.com')) {
    return <CloudflareStreamPlayer experience={experience} paused={paused} />
  }

  if (/\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl)) {
    return (
      <Video
        source={{ uri: mediaUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay={!paused}
        isLooping
        isMuted
      />
    )
  }

  return <Image source={{ uri: mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
}

export default function ExperienceCard({ experience, reserved = false, onDetail, onReserve }) {
  const initialLikeCount = useMemo(() => seededInt(`${experience.id}l`, 8000, 98000), [experience.id])
  const initialCommentCount = useMemo(() => seededInt(`${experience.id}c`, 80, 980), [experience.id])
  const initialSaveCount = useMemo(() => seededInt(`${experience.id}s`, 500, 4500), [experience.id])
  const initialShareCount = useMemo(() => seededInt(`${experience.id}sh`, 40, 480), [experience.id])
  const [followed, setFollowed] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [saveCount, setSaveCount] = useState(initialSaveCount)
  const [shareCount, setShareCount] = useState(initialShareCount)
  const [paused, setPaused] = useState(false)
  const [playFlash, setPlayFlash] = useState(null)
  const [bigHearts, setBigHearts] = useState([])
  const lastTapRef = useRef(0)
  const singleTapTimerRef = useRef(null)
  const discRotation = useRef(new Animated.Value(0)).current
  const progressScale = useRef(new Animated.Value(0)).current
  const marqueeTranslate = useRef(new Animated.Value(0)).current
  const handle = `@${toHandle(experience.creator)}`
  const genreTag = `#${(experience.genre || '').replace(/[・·\s]/g, '')}`
  const visual = getGenreVisual(experience.genre)
  const hashtags = [genreTag, '#体験会', experience.isBeginnerFriendly ? '#初心者歓迎' : null, experience.isFirstTimeFree ? '#初回無料' : null]
    .filter(Boolean)
    .join(' ')
  const soundText = `${experience.creator} の体験 · オリジナルサウンド`

  useEffect(() => () => {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current)
    }
  }, [])

  useEffect(() => {
    discRotation.setValue(0)
    progressScale.setValue(0)
    marqueeTranslate.setValue(0)

    const spin = Animated.loop(
      Animated.timing(discRotation, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    const progress = Animated.loop(
      Animated.sequence([
        Animated.timing(progressScale, {
          toValue: 1,
          duration: 18000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progressScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )
    const marquee = Animated.loop(
      Animated.sequence([
        Animated.timing(marqueeTranslate, {
          toValue: -140,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(marqueeTranslate, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )

    spin.start()
    progress.start()
    marquee.start()

    return () => {
      spin.stop()
      progress.stop()
      marquee.stop()
    }
  }, [discRotation, marqueeTranslate, progressScale])

  const triggerBigHeart = (x = '50%', y = '44%') => {
    const id = Date.now()
    setBigHearts((current) => [...current, { id, x, y }])
    setTimeout(() => {
      setBigHearts((current) => current.filter((item) => item.id !== id))
    }, 900)
  }

  const handleRootPress = (event) => {
    const now = Date.now()
    const delta = now - lastTapRef.current
    const locationX = event?.nativeEvent?.locationX
    const locationY = event?.nativeEvent?.locationY

    if (delta > 0 && delta < 300) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current)
        singleTapTimerRef.current = null
      }
      lastTapRef.current = 0
      triggerBigHeart(locationX ?? '50%', locationY ?? '44%')
      setLiked((value) => {
        if (value) return value
        setLikeCount((count) => count + 1)
        return true
      })
      return
    }

    lastTapRef.current = now
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current)
    }
    singleTapTimerRef.current = setTimeout(() => {
      setPaused((value) => {
        const next = !value
        setPlayFlash(next ? '❚❚' : '▶')
        setTimeout(() => setPlayFlash(null), 650)
        return next
      })
      singleTapTimerRef.current = null
    }, 310)
  }

  return (
    <Pressable style={styles.container} onPress={handleRootPress}>
      <BackgroundMedia experience={experience} paused={paused} />
      <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']} style={styles.bottomShade} />
      {playFlash ? (
        <View pointerEvents="none" style={styles.playFlash}>
          <Text style={styles.playFlashText}>{playFlash}</Text>
        </View>
      ) : null}
      {bigHearts.map((heart) => (
        <View
          key={heart.id}
          pointerEvents="none"
          style={[
            styles.bigHeart,
            {
              left: typeof heart.x === 'number' ? heart.x : heart.x,
              top: typeof heart.y === 'number' ? heart.y : heart.y,
            },
          ]}
        >
          <Text style={styles.bigHeartText}>❤️</Text>
        </View>
      ))}
      <View style={styles.content}>
        <Text style={styles.creator}>{handle}</Text>
        <Text style={styles.title}>{experience.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {experience.description}
        </Text>
        <Text style={styles.hashtags}>{hashtags}</Text>
        <Text style={styles.meta}>
          {experience.location} • {experience.startTime}
        </Text>
        <View style={styles.soundRow}>
          <Text style={styles.soundIcon}>♪</Text>
          <View style={styles.soundViewport}>
            <Animated.View style={[styles.soundTrack, { transform: [{ translateX: marqueeTranslate }] }]}>
              <Text style={styles.soundText}>{soundText}</Text>
              <Text style={styles.soundSpacer}>   </Text>
              <Text style={styles.soundText}>{soundText}</Text>
            </Animated.View>
          </View>
        </View>
        <View style={styles.ctaWrap}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation?.()
              onDetail?.()
            }}
            style={[styles.ctaChip, reserved && styles.ctaChipReserved]}
          >
            <Text style={styles.ctaChipText}>
              {reserved ? '✓ 予約済み' : '⚡ 予約する ▸'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.rail}>
        <Pressable
          style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
          onPress={(event) => {
            event.stopPropagation?.()
            setFollowed((value) => !value)
          }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{experience.creatorAvatar}</Text>
          </View>
          <View style={[styles.followBadge, followed && styles.followBadgeActive]}>
            <Text style={[styles.followBadgeText, followed && styles.followBadgeTextActive]}>{followed ? '✓' : '+'}</Text>
          </View>
        </Pressable>
        <RailStat
          kind={liked ? 'heartFilled' : 'heart'}
          value={formatCount(likeCount)}
          onPress={(event) => {
            event.stopPropagation?.()
            setLiked((value) => {
              const next = !value
              setLikeCount((count) => count + (next ? 1 : -1))
              return next
            })
          }}
        />
        <RailStat kind="comment" value={formatCount(initialCommentCount)} onPress={(event) => event.stopPropagation?.()} />
        <RailStat
          kind={saved ? 'bookmarkFilled' : 'bookmark'}
          value={formatCount(saveCount)}
          onPress={(event) => {
            event.stopPropagation?.()
            setSaved((value) => {
              const next = !value
              setSaveCount((count) => count + (next ? 1 : -1))
              return next
            })
          }}
        />
        <RailStat
          kind="share"
          value={formatCount(shareCount)}
          onPress={(event) => {
            event.stopPropagation?.()
            setShareCount((count) => count + 1)
          }}
        />
        <Animated.View
          style={[
            styles.discWrap,
            {
              transform: [{
                rotate: discRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              }],
            },
          ]}
        >
          <LinearGradient colors={visual.colors} style={styles.discFill}>
            <Text style={styles.discEmoji}>{visual.emoji}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { transform: [{ scaleX: progressScale }] }]} />
      </View>
    </Pressable>
  )
}

function RailStat({ kind, value, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.railStat, pressed && styles.pressed]}>
      {kind === 'heart' ? <Ionicons name="heart-outline" size={32} color="#fff" /> : null}
      {kind === 'heartFilled' ? <Ionicons name="heart" size={32} color="#FE2C55" /> : null}
      {kind === 'comment' ? <Ionicons name="chatbubble-ellipses-outline" size={30} color="#fff" /> : null}
      {kind === 'bookmark' ? <Ionicons name="bookmark-outline" size={30} color="#fff" /> : null}
      {kind === 'bookmarkFilled' ? <Ionicons name="bookmark" size={30} color="#fff" /> : null}
      {kind === 'share' ? <Feather name="send" size={28} color="#fff" /> : null}
      <Text style={styles.railCount}>{value}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  fallbackCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: {
    fontSize: 180,
    opacity: 0.28,
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '66%',
  },
  streamFrame: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  content: {
    position: 'absolute',
    left: 18,
    right: 92,
    bottom: 214,
  },
  creator: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  hashtags: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  soundIcon: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  soundViewport: {
    flex: 1,
    overflow: 'hidden',
  },
  soundTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  soundSpacer: {
    color: 'transparent',
    fontSize: 12,
  },
  ctaWrap: {
    marginTop: 10,
  },
  ctaChip: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaChipReserved: {
    backgroundColor: colors.accent,
  },
  ctaChipText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  rail: {
    position: 'absolute',
    right: 6,
    bottom: 118,
    alignItems: 'center',
    gap: 14,
    width: 64,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  followBadge: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#FE2C55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBadgeActive: {
    backgroundColor: '#fff',
  },
  followBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  followBadgeTextActive: {
    color: '#FE2C55',
  },
  railStat: {
    alignItems: 'center',
    gap: 4,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  railCount: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  discWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  discFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discEmoji: {
    fontSize: 20,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 64,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    transformOrigin: 'left',
  },
  playFlash: {
    position: 'absolute',
    left: '50%',
    top: '44%',
    transform: [{ translateX: -38 }, { translateY: -38 }],
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playFlashText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
  },
  bigHeart: {
    position: 'absolute',
    transform: [{ translateX: -34 }, { translateY: -34 }],
  },
  bigHeartText: {
    fontSize: 68,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
})
