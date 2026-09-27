import { randomUUID } from 'node:crypto'

export interface ProxyEntityProps {
  readonly id?: string
  readonly namespace: string
  readonly target?: string
  readonly cacheTtl?: number
  readonly headersToInject?: Record<string, string>
  readonly headersToRemove?: string[]
  readonly rateLimitWindowMs?: number
  readonly rateLimitMax?: number
  readonly targets?: string[]
  readonly loadBalancerStrategy?: 'round-robin' | 'random'
  readonly createdAt?: string
}

export class ProxyEntity {
  public readonly id: string

  public readonly namespace: string

  public readonly target: string

  public readonly cacheTtl?: number

  public readonly headersToInject?: Record<string, string>

  public readonly headersToRemove?: string[]

  public readonly rateLimitWindowMs?: number

  public readonly rateLimitMax?: number

  public readonly targets?: string[]

  public readonly loadBalancerStrategy?: 'round-robin' | 'random'

  public readonly createdAt: string

  constructor({
    id = randomUUID(),
    namespace,
    target,
    cacheTtl,
    headersToInject,
    headersToRemove,
    rateLimitWindowMs,
    rateLimitMax,
    targets,
    loadBalancerStrategy,
    createdAt = new Date().toISOString(),
  }: ProxyEntityProps) {
    this.id = id
    this.namespace = namespace
    this.target = target ?? (targets && targets.length > 0 ? targets[0] : '')
    this.cacheTtl = cacheTtl
    this.headersToInject = headersToInject
    this.headersToRemove = headersToRemove
    this.rateLimitWindowMs = rateLimitWindowMs
    this.rateLimitMax = rateLimitMax
    this.targets = targets
    this.loadBalancerStrategy = loadBalancerStrategy
    this.createdAt = createdAt
  }
}
