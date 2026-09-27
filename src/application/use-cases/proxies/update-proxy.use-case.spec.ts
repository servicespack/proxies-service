import type { Mock } from 'vitest'
import type { UpdateProxyDTO } from '@/application/use-cases/proxies/update-proxy.use-case.js'

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
import { UpdateProxyUseCase } from '@/application/use-cases/proxies/update-proxy.use-case.js'
import { ProxyEntity } from '@/domain/entities/proxy.entity.js'

describe('UpdateProxyUseCase', () => {
  let useCase: UpdateProxyUseCase
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

    useCase = new UpdateProxyUseCase(
      mockProxyRepository as unknown as ProxyRepository,
      mockProxyEventBus as unknown as ProxyEventBus,
    )
  })

  it('should update a proxy, emit event, and return the updated proxy when found', async () => {
    const id = faker.datatype.uuid()
    const dto: UpdateProxyDTO = {
      target: faker.internet.url(),
    }

    const updatedProxy = new ProxyEntity({
      id,
      namespace: faker.internet.domainWord(),
      target: dto.target!,
    })

    mockProxyRepository.update.mockResolvedValue(updatedProxy)

    const result = await useCase.execute(id, dto)

    expect(mockProxyRepository.update).toHaveBeenCalledWith(id, dto)
    expect(mockProxyEventBus.emitUpdatedProxy).toHaveBeenCalledWith(updatedProxy)
    expect(result).toBe(updatedProxy)
  })

  it('should return undefined and not emit event when proxy is not found', async () => {
    const id = faker.datatype.uuid()
    const dto: UpdateProxyDTO = {
      target: faker.internet.url(),
    }

    mockProxyRepository.update.mockResolvedValue(undefined)

    const result = await useCase.execute(id, dto)

    expect(mockProxyRepository.update).toHaveBeenCalledWith(id, dto)
    expect(mockProxyEventBus.emitUpdatedProxy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should propagate repository errors and not emit event', async () => {
    const id = faker.datatype.uuid()
    const dto: UpdateProxyDTO = {
      target: faker.internet.url(),
    }

    const error = new Error('Database error')
    mockProxyRepository.update.mockRejectedValue(error)

    await expect(useCase.execute(id, dto)).rejects.toThrow('Database error')
    expect(mockProxyEventBus.emitUpdatedProxy).not.toHaveBeenCalled()
  })
})
