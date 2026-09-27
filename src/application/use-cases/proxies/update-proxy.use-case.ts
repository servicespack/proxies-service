import type { UpdateProxyInput } from '@/adapters/validators/proxies.validator.js'
import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'
import type { ProxyEventBus } from '@/domain/events/proxy.events.js'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'
import { ProxyAlreadyExistsError } from '@/application/errors/proxy-already-exists.error.js'

export type UpdateProxyDTO = UpdateProxyInput

export class UpdateProxyUseCase {
  constructor(
    private readonly proxyRepository: ProxyRepository,
    private readonly proxyEventBus: ProxyEventBus,
  ) {}

  async execute(id: string, dto: UpdateProxyDTO): Promise<ProxyEntity | undefined> {
    if (dto.namespace) {
      const existing = await this.proxyRepository.findByNamespace(dto.namespace)
      if (existing && existing.id !== id) {
        throw new ProxyAlreadyExistsError(dto.namespace)
      }
    }

    const updatedProxy = await this.proxyRepository.update(id, dto)

    if (updatedProxy) {
      this.proxyEventBus.emitUpdatedProxy(updatedProxy)
    }

    return updatedProxy
  }
}
