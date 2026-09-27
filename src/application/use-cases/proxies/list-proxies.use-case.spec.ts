import type { Mock } from 'vitest'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'

import { faker } from '@faker-js/faker'
import {
  beforeEach,
  describe,
  expect,
  it,

  vi,
} from 'vitest'
import { ListProxiesUseCase } from '@/application/use-cases/proxies/list-proxies.use-case.js'
import { ProxyEntity } from '@/domain/entities/proxy.entity.js'

describe('ListProxiesUseCase', () => {
  let useCase: ListProxiesUseCase
  let mockProxyRepository: { [K in keyof ProxyRepository]: Mock }

  beforeEach(() => {
    mockProxyRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByNamespace: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }

    useCase = new ListProxiesUseCase(mockProxyRepository as unknown as ProxyRepository)
  })

  it('should return a list of proxies', async () => {
    const proxies = [
      new ProxyEntity({
        id: faker.datatype.uuid(),
        namespace: faker.internet.domainWord(),
        target: faker.internet.url(),
      }),
      new ProxyEntity({
        id: faker.datatype.uuid(),
        namespace: faker.internet.domainWord(),
        target: faker.internet.url(),
      }),
    ]

    mockProxyRepository.findAll.mockResolvedValue(proxies)

    const result = await useCase.execute()

    expect(mockProxyRepository.findAll).toHaveBeenCalledTimes(1)
    expect(result).toBe(proxies)
  })

  it('should return an empty array when no proxies exist', async () => {
    mockProxyRepository.findAll.mockResolvedValue([])

    const result = await useCase.execute()

    expect(mockProxyRepository.findAll).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })

  it('should propagate repository errors', async () => {
    const error = new Error('Database error')
    mockProxyRepository.findAll.mockRejectedValue(error)

    await expect(useCase.execute()).rejects.toThrow('Database error')
  })
})
