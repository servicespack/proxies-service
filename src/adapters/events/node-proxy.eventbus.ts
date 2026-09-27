import type EventEmitter from 'node:events'

import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'
import type { ProxyEventBus } from '@/domain/events/proxy.events.js'
import { ProxiesEmitter } from '@/infrastructure/events/proxies.emitter.js'

export class NodeProxyEventBus implements ProxyEventBus {
  constructor(private readonly emitter: EventEmitter) {}

  emitNewProxy(proxy: ProxyEntity): void {
    this.emitter.emit(ProxiesEmitter.Events.NEW_PROXY, proxy)
  }

  emitUpdatedProxy(proxy: ProxyEntity): void {
    this.emitter.emit(ProxiesEmitter.Events.UPDATED_PROXY, proxy)
  }

  emitDeletedProxy(proxy: ProxyEntity): void {
    this.emitter.emit(ProxiesEmitter.Events.DELETED_PROXY, proxy)
  }
}
