import type { NextFunction, Request, Response } from 'express'

import type { CreateProxyInput, UpdateProxyInput } from '@/adapters/validators/proxies.validator.js'
import type { CreateProxyUseCase } from '@/application/use-cases/proxies/create-proxy.use-case.js'
import type { DeleteProxyUseCase } from '@/application/use-cases/proxies/delete-proxy.use-case.js'
import type { GetProxyUseCase } from '@/application/use-cases/proxies/get-proxy.use-case.js'
import type { ListProxiesUseCase } from '@/application/use-cases/proxies/list-proxies.use-case.js'
import type { UpdateProxyUseCase } from '@/application/use-cases/proxies/update-proxy.use-case.js'

export interface ProxiesControllerDependencies {
  readonly listProxiesUseCase: ListProxiesUseCase
  readonly createProxyUseCase: CreateProxyUseCase
  readonly getProxyUseCase: GetProxyUseCase
  readonly updateProxyUseCase: UpdateProxyUseCase
  readonly deleteProxyUseCase: DeleteProxyUseCase
}

export class ProxiesController {
  private readonly listProxiesUseCase: ListProxiesUseCase

  private readonly createProxyUseCase: CreateProxyUseCase

  private readonly getProxyUseCase: GetProxyUseCase

  private readonly updateProxyUseCase: UpdateProxyUseCase

  private readonly deleteProxyUseCase: DeleteProxyUseCase

  constructor(dependencies: ProxiesControllerDependencies) {
    this.listProxiesUseCase = dependencies.listProxiesUseCase
    this.createProxyUseCase = dependencies.createProxyUseCase
    this.getProxyUseCase = dependencies.getProxyUseCase
    this.updateProxyUseCase = dependencies.updateProxyUseCase
    this.deleteProxyUseCase = dependencies.deleteProxyUseCase

    this.list = this.list.bind(this)
    this.create = this.create.bind(this)
    this.get = this.get.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
  }

  private notFound(response: Response): Response {
    return response.status(404).json({ error: 'Not found' })
  }

  async list(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const proxies = await this.listProxiesUseCase.execute()
      return response.json({ data: proxies })
    }
    catch (error) {
      return next(error)
    }
  }

  async create(
    request: Request<unknown, unknown, CreateProxyInput>,
    response: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const {
        namespace,
        target,
        cacheTtl,
        headersToInject,
        headersToRemove,
        rateLimitWindowMs,
        rateLimitMax,
        targets,
        loadBalancerStrategy,
      } = request.body
      const proxy = await this.createProxyUseCase.execute({
        namespace,
        target,
        cacheTtl,
        headersToInject,
        headersToRemove,
        rateLimitWindowMs,
        rateLimitMax,
        targets,
        loadBalancerStrategy,
      })
      return response.status(201).json(proxy)
    }
    catch (error) {
      return next(error)
    }
  }

  async get(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const proxyId = String(request.params.proxyId)
      const proxy = await this.getProxyUseCase.execute(proxyId)

      if (!proxy) {
        return this.notFound(response)
      }

      return response.json(proxy)
    }
    catch (error) {
      return next(error)
    }
  }

  async update(
    request: Request<{ proxyId: string }, unknown, UpdateProxyInput>,
    response: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const proxyId = String(request.params.proxyId)
      const {
        namespace,
        target,
        cacheTtl,
        headersToInject,
        headersToRemove,
        rateLimitWindowMs,
        rateLimitMax,
        targets,
        loadBalancerStrategy,
      } = request.body
      const dto: UpdateProxyInput = {}
      if (namespace !== undefined)
        dto.namespace = namespace
      if (target !== undefined)
        dto.target = target
      if (cacheTtl !== undefined)
        dto.cacheTtl = cacheTtl
      if (headersToInject !== undefined)
        dto.headersToInject = headersToInject
      if (headersToRemove !== undefined)
        dto.headersToRemove = headersToRemove
      if (rateLimitWindowMs !== undefined)
        dto.rateLimitWindowMs = rateLimitWindowMs
      if (rateLimitMax !== undefined)
        dto.rateLimitMax = rateLimitMax
      if (targets !== undefined)
        dto.targets = targets
      if (loadBalancerStrategy !== undefined)
        dto.loadBalancerStrategy = loadBalancerStrategy

      const proxy = await this.updateProxyUseCase.execute(proxyId, dto)

      if (!proxy) {
        return this.notFound(response)
      }

      return response.json(proxy)
    }
    catch (error) {
      return next(error)
    }
  }

  async delete(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const proxyId = String(request.params.proxyId)
      const proxy = await this.deleteProxyUseCase.execute(proxyId)

      if (!proxy) {
        return this.notFound(response)
      }

      return response.json(proxy)
    }
    catch (error) {
      return next(error)
    }
  }
}
