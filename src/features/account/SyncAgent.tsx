'use client'

import { useEffect, useState } from 'react'
import { getSyncStatus, onSyncStatus, startSyncAgent, type SyncStatus } from '@/lib/sync/agent'

/** Montado en el layout: sincroniza en segundo plano. No pinta nada. */
export function SyncAgent() {
  useEffect(() => startSyncAgent(), [])
  return null
}

export function useSyncStatus(): SyncStatus {
  const [s, setS] = useState<SyncStatus>(getSyncStatus)
  useEffect(() => onSyncStatus(setS), [])
  return s
}
