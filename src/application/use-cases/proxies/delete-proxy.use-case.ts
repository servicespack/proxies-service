import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'
import type { ProxyEventBus } from '@/domain/events/proxy.events.js'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'

export class DeleteProxyUseCase {
  constructor(
    private readonly proxyRepository: ProxyRepository,
    private readonly proxyEventBus: ProxyEventBus,
  ) {}

  async execute(id: string): Promise<ProxyEntity | undefined> {
    const deletedProxy = await this.proxyRepository.delete(id)

    if (deletedProxy) {
      this.proxyEventBus.emitDeletedProxy(deletedProxy)
    }

    return deletedProxy
  }
}
