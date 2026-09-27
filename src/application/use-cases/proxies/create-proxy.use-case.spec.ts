import type { Mock } from 'vitest'
import type { CreateProxyDTO } from '@/application/use-cases/proxies/create-proxy.use-case.js'

import type { ProxyEventBus } from '@/domain/events/proxy.events.js'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'
import { faker } from '@faker-js/faker'
import {
  beforeEach,
  describe,
  expect,
  it,

  vi,
} from 'vitest'
import { CreateProxyUseCase } from '@/application/use-cases/proxies/create-proxy.use-case.js'
import { ProxyEntity } from '@/domain/entities/proxy.entity.js'

describe('CreateProxyUseCase', () => {
  let useCase: CreateProxyUseCase
  let mockProxyRepository: { [K in keyof ProxyRepository]: Mock }
  let mockProxyEventBus: { [K in keyof ProxyEventBus]: Mock }

  beforeEach(() => {
    mockProxyRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByNamespace: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }

    mockProxyEventBus = {
      emitNewProxy: vi.fn(),
      emitUpdatedProxy: vi.fn(),
      emitDeletedProxy: vi.fn(),
    }

    useCase = new CreateProxyUseCase(
      mockProxyRepository as unknown as ProxyRepository,
      mockProxyEventBus as unknown as ProxyEventBus,
    )
  })

  it('should create a proxy, save it in repository, emit event, and return the proxy', async () => {
    const dto: CreateProxyDTO = {
      namespace: faker.internet.domainWord(),
      target: faker.internet.url(),
    }

    const createdProxy = new ProxyEntity({
      id: faker.datatype.uuid(),
      namespace: dto.namespace,
      target: dto.target,
    })

    mockProxyRepository.create.mockResolvedValue(createdProxy)

    const result = await useCase.execute(dto)

    expect(mockProxyRepository.create).toHaveBeenCalledTimes(1)
    const passedEntity = mockProxyRepository.create.mock.calls[0][0]
    expect(passedEntity).toBeInstanceOf(ProxyEntity)
    expect(passedEntity.namespace).toBe(dto.namespace)
    expect(passedEntity.target).toBe(dto.target)
    expect(mockProxyEventBus.emitNewProxy).toHaveBeenCalledWith(createdProxy)
    expect(result).toBe(createdProxy)
  })

  it('should create a proxy with advanced features (headers, rate-limiting, load-balancing)', async () => {
    const dto: CreateProxyDTO = {
      namespace: faker.internet.domainWord(),
      target: faker.internet.url(),
      headersToInject: { 'X-Key': 'Val' },
      headersToRemove: ['cookie'],
      rateLimitWindowMs: 10000,
      rateLimitMax: 5,
      targets: [faker.internet.url(), faker.internet.url()],
      loadBalancerStrategy: 'random',
    }

    const createdProxy = new ProxyEntity({
      id: faker.datatype.uuid(),
      ...dto,
    })

    mockProxyRepository.create.mockResolvedValue(createdProxy)

    const result = await useCase.execute(dto)

    expect(mockProxyRepository.create).toHaveBeenCalledTimes(1)
    const passedEntity = mockProxyRepository.create.mock.calls[0][0]
    expect(passedEntity).toBeInstanceOf(ProxyEntity)
    expect(passedEntity.namespace).toBe(dto.namespace)
    expect(passedEntity.target).toBe(dto.target)
    expect(passedEntity.headersToInject).toEqual(dto.headersToInject)
    expect(passedEntity.headersToRemove).toEqual(dto.headersToRemove)
    expect(passedEntity.rateLimitWindowMs).toBe(dto.rateLimitWindowMs)
    expect(passedEntity.rateLimitMax).toBe(dto.rateLimitMax)
    expect(passedEntity.targets).toEqual(dto.targets)
    expect(passedEntity.loadBalancerStrategy).toBe(dto.loadBalancerStrategy)
    expect(result).toBe(createdProxy)
  })

  it('should propagate repository errors and not emit event', async () => {
    const dto: CreateProxyDTO = {
      namespace: faker.internet.domainWord(),
      target: faker.internet.url(),
    }

    const error = new Error('Database error')
    mockProxyRepository.create.mockRejectedValue(error)

    await expect(useCase.execute(dto)).rejects.toThrow('Database error')
    expect(mockProxyEventBus.emitNewProxy).not.toHaveBeenCalled()
  })
})
