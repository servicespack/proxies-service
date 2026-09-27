import type { Request, Response } from 'express'

import type { Mock } from 'vitest'
import type { CreateProxyUseCase } from '@/application/use-cases/proxies/create-proxy.use-case.js'

import type { DeleteProxyUseCase } from '@/application/use-cases/proxies/delete-proxy.use-case.js'
import type { GetProxyUseCase } from '@/application/use-cases/proxies/get-proxy.use-case.js'
import type { ListProxiesUseCase } from '@/application/use-cases/proxies/list-proxies.use-case.js'
import type { UpdateProxyUseCase } from '@/application/use-cases/proxies/update-proxy.use-case.js'
import { randomUUID } from 'node:crypto'
import {
  beforeEach,
  describe,
  expect,
  it,

  vi,
} from 'vitest'
import { ProxiesController } from '@/adapters/controllers/proxies.controller.js'

describe('ProxiesController', () => {
  let controller: ProxiesController
  let mockListProxiesUseCase: { execute: Mock }
  let mockCreateProxyUseCase: { execute: Mock }
  let mockGetProxyUseCase: { execute: Mock }
  let mockUpdateProxyUseCase: { execute: Mock }
  let mockDeleteProxyUseCase: { execute: Mock }

  const createMockResponse = () => {
    const response = {} as Response
    response.status = vi.fn().mockReturnValue(response) as any
    response.json = vi.fn().mockReturnValue(response) as any
    return response
  }

  const createMockRequest = (overrides = {}) => ({
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request<any, any, any>)

  beforeEach(() => {
    mockListProxiesUseCase = { execute: vi.fn() }
    mockCreateProxyUseCase = { execute: vi.fn() }
    mockGetProxyUseCase = { execute: vi.fn() }
    mockUpdateProxyUseCase = { execute: vi.fn() }
    mockDeleteProxyUseCase = { execute: vi.fn() }

    controller = new ProxiesController({
      listProxiesUseCase: mockListProxiesUseCase as unknown as ListProxiesUseCase,
      createProxyUseCase: mockCreateProxyUseCase as unknown as CreateProxyUseCase,
      getProxyUseCase: mockGetProxyUseCase as unknown as GetProxyUseCase,
      updateProxyUseCase: mockUpdateProxyUseCase as unknown as UpdateProxyUseCase,
      deleteProxyUseCase: mockDeleteProxyUseCase as unknown as DeleteProxyUseCase,
    })
  })

  describe('list', () => {
    it('should return a list of proxies', async () => {
      const proxies = [{ id: '1', namespace: 'ns1', target: 'http://t1' }]
      mockListProxiesUseCase.execute.mockResolvedValue(proxies)

      const request = createMockRequest()
      const response = createMockResponse()
      const next = vi.fn()

      await controller.list(request, response, next)

      expect(mockListProxiesUseCase.execute).toHaveBeenCalled()
      expect(response.json).toHaveBeenCalledWith({ data: proxies })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with error if use case throws', async () => {
      const error = new Error('Test error')
      mockListProxiesUseCase.execute.mockRejectedValue(error)

      const request = createMockRequest()
      const response = createMockResponse()
      const next = vi.fn()

      await controller.list(request, response, next)

      expect(next).toHaveBeenCalledWith(error)
      expect(response.json).not.toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('should create a proxy and return 201', async () => {
      const proxyInput = { namespace: 'ns1', target: 'http://t1' }
      const createdProxy = { id: '1', ...proxyInput }
      mockCreateProxyUseCase.execute.mockResolvedValue(createdProxy)

      const request = createMockRequest({ body: proxyInput })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.create(request, response, next)

      expect(mockCreateProxyUseCase.execute).toHaveBeenCalledWith(proxyInput)
      expect(response.status).toHaveBeenCalledWith(201)
      expect(response.json).toHaveBeenCalledWith(createdProxy)
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with error if use case throws', async () => {
      const error = new Error('Test error')
      mockCreateProxyUseCase.execute.mockRejectedValue(error)

      const request = createMockRequest({ body: { namespace: 'ns1', target: 'http://t1' } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.create(request, response, next)

      expect(next).toHaveBeenCalledWith(error)
      expect(response.json).not.toHaveBeenCalled()
    })
  })

  describe('get', () => {
    it('should return a proxy if found', async () => {
      const proxyId = randomUUID()
      const proxy = { id: proxyId, namespace: 'ns1', target: 'http://t1' }
      mockGetProxyUseCase.execute.mockResolvedValue(proxy)

      const request = createMockRequest({ params: { proxyId } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.get(request, response, next)

      expect(mockGetProxyUseCase.execute).toHaveBeenCalledWith(proxyId)
      expect(response.json).toHaveBeenCalledWith(proxy)
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 404 if proxy is not found', async () => {
      const proxyId = randomUUID()
      mockGetProxyUseCase.execute.mockResolvedValue(null)

      const request = createMockRequest({ params: { proxyId } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.get(request, response, next)

      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({ error: 'Not found' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with error if use case throws', async () => {
      const error = new Error('Test error')
      mockGetProxyUseCase.execute.mockRejectedValue(error)

      const request = createMockRequest({ params: { proxyId: '1' } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.get(request, response, next)

      expect(next).toHaveBeenCalledWith(error)
      expect(response.json).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('should update a proxy and return it', async () => {
      const proxyId = randomUUID()
      const updateInput = { target: 'http://new-target' }
      const updatedProxy = { id: proxyId, namespace: 'ns1', target: 'http://new-target' }
      mockUpdateProxyUseCase.execute.mockResolvedValue(updatedProxy)

      const request = createMockRequest({ params: { proxyId }, body: updateInput })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.update(request, response, next)

      expect(mockUpdateProxyUseCase.execute).toHaveBeenCalledWith(proxyId, updateInput)
      expect(response.json).toHaveBeenCalledWith(updatedProxy)
      expect(next).not.toHaveBeenCalled()
    })

    it('should pass only provided fields to use case', async () => {
      const proxyId = randomUUID()
      mockUpdateProxyUseCase.execute.mockResolvedValue({ id: proxyId })

      const request = createMockRequest({ params: { proxyId }, body: { namespace: 'new-ns', extraneous: 'field' } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.update(request, response, next)

      expect(mockUpdateProxyUseCase.execute).toHaveBeenCalledWith(proxyId, { namespace: 'new-ns' })
    })

    it('should return 404 if proxy is not found', async () => {
      const proxyId = randomUUID()
      mockUpdateProxyUseCase.execute.mockResolvedValue(null)

      const request = createMockRequest({ params: { proxyId }, body: { namespace: 'new-ns' } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.update(request, response, next)

      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({ error: 'Not found' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with error if use case throws', async () => {
      const error = new Error('Test error')
      mockUpdateProxyUseCase.execute.mockRejectedValue(error)

      const request = createMockRequest({ params: { proxyId: '1' }, body: {} })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.update(request, response, next)

      expect(next).toHaveBeenCalledWith(error)
      expect(response.json).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete a proxy and return it', async () => {
      const proxyId = randomUUID()
      const deletedProxy = { id: proxyId, namespace: 'ns1', target: 'http://t1' }
      mockDeleteProxyUseCase.execute.mockResolvedValue(deletedProxy)

      const request = createMockRequest({ params: { proxyId } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.delete(request, response, next)

      expect(mockDeleteProxyUseCase.execute).toHaveBeenCalledWith(proxyId)
      expect(response.json).toHaveBeenCalledWith(deletedProxy)
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 404 if proxy is not found', async () => {
      const proxyId = randomUUID()
      mockDeleteProxyUseCase.execute.mockResolvedValue(null)

      const request = createMockRequest({ params: { proxyId } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.delete(request, response, next)

      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({ error: 'Not found' })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with error if use case throws', async () => {
      const error = new Error('Test error')
      mockDeleteProxyUseCase.execute.mockRejectedValue(error)

      const request = createMockRequest({ params: { proxyId: '1' } })
      const response = createMockResponse()
      const next = vi.fn()

      await controller.delete(request, response, next)

      expect(next).toHaveBeenCalledWith(error)
      expect(response.json).not.toHaveBeenCalled()
    })
  })
})
