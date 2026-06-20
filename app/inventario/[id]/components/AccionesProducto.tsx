'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StockModal from '@/app/dashboard/components/StockModal'
import TransferirModal from './TransferirModal'

type Props = {
  productoId: string
  productoNombre: string
  productoFotoUrl: string | null
  stockActual: number
  unidad: string
  almacenId: string
  almacenNombre: string
}

export default function AccionesProducto({
  productoId,
  productoNombre,
  productoFotoUrl,
  stockActual,
  unidad,
  almacenId,
  almacenNombre,
}: Props) {
  const router = useRouter()
  const [modalTipo, setModalTipo] = useState<'ingreso' | 'retiro' | null>(null)
  const [modalTransferir, setModalTransferir] = useState(false)

  const producto = {
    id: productoId,
    nombre: productoNombre,
    foto_url: productoFotoUrl,
    stock_actual: stockActual,
    unidad,
  }

  function handleSuccess() {
    setModalTipo(null)
    router.refresh()
  }

  return (
    <>
      {modalTipo && (
        <StockModal
          producto={producto}
          almacenId={almacenId}
          almacenNombre={almacenNombre}
          tipo={modalTipo}
          onClose={() => setModalTipo(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modalTransferir && (
        <TransferirModal
          productoId={productoId}
          productoNombre={productoNombre}
          stockDisponible={stockActual}
          almacenOrigenId={almacenId}
          almacenOrigenNombre={almacenNombre}
          onClose={() => setModalTransferir(false)}
          onSuccess={() => { setModalTransferir(false); router.refresh() }}
        />
      )}

      <div
        className="fixed bottom-16 left-0 right-0 md:bottom-0 md:left-[240px]"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E8E8E8',
          padding: '12px 24px',
          display: 'flex',
          gap: '12px',
          zIndex: 20,
          fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
        }}
      >
        <button
          onClick={() => setModalTipo('ingreso')}
          style={{
            flex: 1, padding: '12px', borderRadius: '999px',
            background: '#F4C400', border: 'none',
            fontSize: '14px', fontWeight: 600, color: '#111111',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Ajustar stock
        </button>
        <button
          onClick={() => setModalTransferir(true)}
          style={{
            flex: 1, padding: '12px', borderRadius: '999px',
            background: '#111111', border: 'none',
            fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Transferir
        </button>
      </div>
    </>
  )
}
