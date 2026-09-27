import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'

export class ListProxiesUseCase {
  constructor(private readonly proxyRepository: ProxyRepository) {}

  async execute(): Promise<ProxyEntity[]> {
    return this.proxyRepository.findAll()
  }
}
