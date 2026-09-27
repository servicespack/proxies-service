import type { CreateProxyInput } from '@/adapters/validators/proxies.validator.js'
import type { ProxyEventBus } from '@/domain/events/proxy.events.js'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'
import { ProxyAlreadyExistsError } from '@/application/errors/proxy-already-exists.error.js'
import { ProxyEntity } from '@/domain/entities/proxy.entity.js'

export type CreateProxyDTO = CreateProxyInput

export class CreateProxyUseCase {
  constructor(
    private readonly proxyRepository: ProxyRepository,
    private readonly proxyEventBus: ProxyEventBus,
  ) {}

  async execute(dto: CreateProxyDTO): Promise<ProxyEntity> {
    const existing = await this.proxyRepository.findByNamespace(dto.namespace)
    if (existing) {
      throw new ProxyAlreadyExistsError(dto.namespace)
    }

    const proxy = new ProxyEntity({
      namespace: dto.namespace,
      target: dto.target,
      cacheTtl: dto.cacheTtl,
      headersToInject: dto.headersToInject,
      headersToRemove: dto.headersToRemove,
      rateLimitWindowMs: dto.rateLimitWindowMs,
      rateLimitMax: dto.rateLimitMax,
      targets: dto.targets,
      loadBalancerStrategy: dto.loadBalancerStrategy,
    })
    const createdProxy = await this.proxyRepository.create(proxy)
    this.proxyEventBus.emitNewProxy(createdProxy)
    return createdProxy
  }
}
