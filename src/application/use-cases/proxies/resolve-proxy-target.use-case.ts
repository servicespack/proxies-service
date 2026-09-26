import type { ProxyEntity } from '@/domain/entities/proxy.entity.js';
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js';

export class ResolveProxyTargetUseCase {
  constructor(private readonly proxyRepository: ProxyRepository) {}

  async execute(namespace: string): Promise<ProxyEntity | undefined> {
    const proxy = await this.proxyRepository.findByNamespace(namespace);

    return proxy;
  }
}
