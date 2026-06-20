export function formatFecha(fecha: string | Date): string {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFechaCorta(fecha: string | Date): string {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatHora(fecha: string | Date): string {
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getSaludo(): string {
  const hora = new Date().getHours()
  return hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
}

export function getEstadoStock(stockActual: number, stockMinimo: number): 'agotado' | 'bajo' | 'saludable' {
  if (stockActual === 0) return 'agotado'
  if (stockActual <= stockMinimo) return 'bajo'
  return 'saludable'
}
