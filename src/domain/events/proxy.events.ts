import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'

export interface ProxyEventBus {
  emitNewProxy: (proxy: ProxyEntity) => void
  emitUpdatedProxy: (proxy: ProxyEntity) => void
  emitDeletedProxy: (proxy: ProxyEntity) => void
}
