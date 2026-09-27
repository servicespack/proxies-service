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
import { GetProxyUseCase } from '@/application/use-cases/proxies/get-proxy.use-case.js'
import { ProxyEntity } from '@/domain/entities/proxy.entity.js'

describe('GetProxyUseCase', () => {
  let useCase: GetProxyUseCase
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

    useCase = new GetProxyUseCase(mockProxyRepository as unknown as ProxyRepository)
  })

  it('should return a proxy when found by id', async () => {
    const id = faker.datatype.uuid()
    const proxy = new ProxyEntity({
      id,
      namespace: faker.internet.domainWord(),
      target: faker.internet.url(),
    })

    mockProxyRepository.findById.mockResolvedValue(proxy)

    const result = await useCase.execute(id)

    expect(mockProxyRepository.findById).toHaveBeenCalledWith(id)
    expect(result).toBe(proxy)
  })

  it('should return undefined when proxy is not found by id', async () => {
    const id = faker.datatype.uuid()
    mockProxyRepository.findById.mockResolvedValue(undefined)

    const result = await useCase.execute(id)

    expect(mockProxyRepository.findById).toHaveBeenCalledWith(id)
    expect(result).toBeUndefined()
  })

  it('should propagate repository errors', async () => {
    const id = faker.datatype.uuid()
    const error = new Error('Database error')
    mockProxyRepository.findById.mockRejectedValue(error)

    await expect(useCase.execute(id)).rejects.toThrow('Database error')
  })
})
