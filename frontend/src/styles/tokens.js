export const colors = {
  bgPrimary: '#0A0A0A',
  bgSecondary: '#141414',
  bgElevated: '#1C1C1C',
  accent: '#FF5C00',
  accentSoft: 'rgba(255, 92, 0, 0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#555555',
  border: '#2A2A2A',
  success: '#00E5A0',
  danger: '#FE2C55',
}

export const spacing = {
  screen: 16,
  lg: 24,
  md: 16,
  sm: 12,
  xs: 8,
}

export const genreVisuals = {
  'ものづくり': {
    colors: ['#3a1f0a', '#8a4a1f', '#c47438'],
    emoji: '🏺',
    accent: '#E08A4A',
  },
  '写真・散歩': {
    colors: ['#0c1a2a', '#1f3a5a', '#3a6090'],
    emoji: '📷',
    accent: '#6FA0D8',
  },
  '伝統工芸': {
    colors: ['#1a0a0a', '#4a1f1f', '#8a3a2a'],
    emoji: '🍶',
    accent: '#D8B070',
  },
  '遊び・交流': {
    colors: ['#1a0a2a', '#3a1f5a', '#7038a0'],
    emoji: '🎲',
    accent: '#B080FF',
  },
  '文字・アート': {
    colors: ['#0a1a1a', '#1f3a3a', '#2a6060'],
    emoji: '✒️',
    accent: '#70D8C8',
  },
  default: {
    colors: ['#1a1a1a', '#2a2a2a', '#3a3a3a'],
    emoji: '✨',
    accent: '#FF5C00',
  },
}

export const getGenreVisual = (genre) => genreVisuals[genre] || genreVisuals.default
