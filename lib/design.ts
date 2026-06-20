export const colors = {
  primary: '#F4C400',
  black: '#111111',
  background: '#F8F6EA',
  surface: '#FFFFFF',
  ai: '#00D7A7',
  danger: '#FF4D4D',
  border: '#E8E8E8',
  textSecondary: '#6B6B6B',
  saludable: '#00A67E',
  saludableBg: '#E8FBF5',
  bajoBg: '#FFF8E0',
  bajoText: '#B8860B',
  agotadoBg: '#FFE8E8',
} as const

export const stockBadge = {
  saludable: { background: colors.saludableBg, color: colors.saludable, label: 'Saludable' },
  bajo: { background: colors.bajoBg, color: colors.bajoText, label: 'Bajo stock' },
  agotado: { background: colors.agotadoBg, color: colors.danger, label: 'Agotado' },
} as const

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  pill: '999px',
} as const

export const shadows = {
  card: '0 2px 8px rgba(0,0,0,0.06)',
} as const

export const cardStyle = {
  background: colors.surface,
  borderRadius: radius.lg,
  padding: '16px',
  boxShadow: shadows.card,
} as const
