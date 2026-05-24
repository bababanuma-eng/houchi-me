import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMemo, useState } from 'react'
import { Feather } from '@expo/vector-icons'

import ExperienceCard from '../components/ExperienceCard'
import ExperienceModal from '../components/ExperienceModal'
import { colors } from '../styles/tokens'
import { layout } from '../styles/layout'

export default function HomeScreen({
  experiences = [],
  reservedIds = new Set(),
  onReserve = () => {},
}) {
  const [openExperience, setOpenExperience] = useState(null)
  const [justReservedId, setJustReservedId] = useState(null)
  const [feedTab, setFeedTab] = useState('recommend')
  const [viewportHeight, setViewportHeight] = useState(layout.frameHeight)

  const data = useMemo(() => experiences, [experiences])

  const handleDetail = (experience) => {
    setJustReservedId(null)
    setOpenExperience(experience)
  }

  const handleQuickReserve = (experience) => {
    setJustReservedId(experience.id)
    setOpenExperience(experience)
    onReserve(experience)
  }

  const handleClose = () => {
    setOpenExperience(null)
    setJustReservedId(null)
  }

  const isOpenAlready =
    !!openExperience &&
    (reservedIds.has(openExperience.id) || justReservedId === openExperience.id)

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height)
        if (nextHeight > 0 && nextHeight !== viewportHeight) {
          setViewportHeight(nextHeight)
        }
      }}
    >
      <FlatList
        data={data}
        pagingEnabled
        snapToInterval={viewportHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
        getItemLayout={(_, index) => ({
          length: viewportHeight,
          offset: viewportHeight * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.page, { height: viewportHeight }]}>
            <ExperienceCard
              experience={item}
              reserved={reservedIds.has(item.id)}
              onDetail={() => handleDetail(item)}
              onReserve={() => handleQuickReserve(item)}
            />
          </View>
        )}
      />

      <View style={styles.headerGradient} pointerEvents="none" />
      <SafeAreaView style={styles.header} pointerEvents="box-none">
        <View style={styles.headerInner}>
          <View style={styles.tabPill}>
            <Pressable onPress={() => setFeedTab('follow')}>
              <Text style={[styles.tabText, feedTab === 'follow' && styles.activeTabText]}>フォロー中</Text>
              {feedTab === 'follow' ? <View style={styles.activeUnderline} /> : null}
            </Pressable>
            <Text style={styles.tabDivider}>|</Text>
            <Pressable onPress={() => setFeedTab('recommend')}>
              <Text style={[styles.tabText, feedTab === 'recommend' && styles.activeTabText]}>おすすめ</Text>
              {feedTab === 'recommend' ? <View style={styles.activeUnderline} /> : null}
            </Pressable>
          </View>
          <Pressable style={styles.searchButton}>
            <Feather name="search" size={20} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ExperienceModal
        experience={openExperience}
        open={!!openExperience}
        onClose={handleClose}
        onReserve={(experience) => onReserve(experience)}
        alreadyReserved={isOpenAlready}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    width: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerInner: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tabText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: colors.textPrimary,
  },
  activeUnderline: {
    alignSelf: 'center',
    marginTop: 4,
    width: 20,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  tabDivider: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  searchButton: {
    position: 'absolute',
    right: layout.screenPadding,
    top: 8,
  },
})
