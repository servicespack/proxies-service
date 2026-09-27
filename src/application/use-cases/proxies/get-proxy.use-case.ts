import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'

export class GetProxyUseCase {
  constructor(private readonly proxyRepository: ProxyRepository) {}

  async execute(id: string): Promise<ProxyEntity | undefined> {
    return this.proxyRepository.findById(id)
  }
}
