import { faker } from '@faker-js/faker';
import {
  describe, it, expect, vi, beforeEach, type Mock,
} from 'vitest';

import { ResolveProxyTargetUseCase } from '@/application/use-cases/proxies/resolve-proxy-target.use-case.js';
import { ProxyEntity } from '@/domain/entities/proxy.entity.js';
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js';

describe('ResolveProxyTargetUseCase', () => {
  let useCase: ResolveProxyTargetUseCase;
  let mockProxyRepository: { [K in keyof ProxyRepository]: Mock };

  beforeEach(() => {
    mockProxyRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByNamespace: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new ResolveProxyTargetUseCase(mockProxyRepository as unknown as ProxyRepository);
  });

  it('should return target when proxy is found by namespace', async () => {
    const namespace = faker.internet.domainWord();
    const target = faker.internet.url();
    const proxy = new ProxyEntity({
      id: faker.datatype.uuid(),
      namespace,
      target,
    });

    mockProxyRepository.findByNamespace.mockResolvedValue(proxy);

    const result = await useCase.execute(namespace);

    expect(mockProxyRepository.findByNamespace).toHaveBeenCalledWith(namespace);
    expect(result).toBe(proxy);
  });

  it('should return undefined when proxy is not found by namespace', async () => {
    const namespace = faker.internet.domainWord();
    mockProxyRepository.findByNamespace.mockResolvedValue(undefined);

    const result = await useCase.execute(namespace);

    expect(mockProxyRepository.findByNamespace).toHaveBeenCalledWith(namespace);
    expect(result).toBeUndefined();
  });

  it('should propagate repository errors', async () => {
    const namespace = faker.internet.domainWord();
    const error = new Error('Database error');
    mockProxyRepository.findByNamespace.mockRejectedValue(error);

    await expect(useCase.execute(namespace)).rejects.toThrow('Database error');
  });
});
