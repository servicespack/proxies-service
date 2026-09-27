import type { Mock } from 'vitest'
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
import { DeleteProxyUseCase } from '@/application/use-cases/proxies/delete-proxy.use-case.js'
import { ProxyEntity } from '@/domain/entities/proxy.entity.js'

describe('DeleteProxyUseCase', () => {
  let useCase: DeleteProxyUseCase
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

    useCase = new DeleteProxyUseCase(
      mockProxyRepository as unknown as ProxyRepository,
      mockProxyEventBus as unknown as ProxyEventBus,
    )
  })

  it('should delete a proxy, emit event, and return the deleted proxy when found', async () => {
    const id = faker.datatype.uuid()
    const deletedProxy = new ProxyEntity({
      id,
      namespace: faker.internet.domainWord(),
      target: faker.internet.url(),
    })

    mockProxyRepository.delete.mockResolvedValue(deletedProxy)

    const result = await useCase.execute(id)

    expect(mockProxyRepository.delete).toHaveBeenCalledWith(id)
    expect(mockProxyEventBus.emitDeletedProxy).toHaveBeenCalledWith(deletedProxy)
    expect(result).toBe(deletedProxy)
  })

  it('should return undefined and not emit event when proxy is not found', async () => {
    const id = faker.datatype.uuid()
    mockProxyRepository.delete.mockResolvedValue(undefined)

    const result = await useCase.execute(id)

    expect(mockProxyRepository.delete).toHaveBeenCalledWith(id)
    expect(mockProxyEventBus.emitDeletedProxy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should propagate repository errors and not emit event', async () => {
    const id = faker.datatype.uuid()
    const error = new Error('Database error')
    mockProxyRepository.delete.mockRejectedValue(error)

    await expect(useCase.execute(id)).rejects.toThrow('Database error')
    expect(mockProxyEventBus.emitDeletedProxy).not.toHaveBeenCalled()
  })
})
