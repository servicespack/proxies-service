import { randomUUID } from 'node:crypto';

export interface ProxyEntityProps {
  readonly id?: string;
  readonly namespace: string;
  readonly target: string;
  readonly cacheTtl?: number;
  readonly createdAt?: string;
}

export class ProxyEntity {
  public readonly id: string;

  public readonly namespace: string;

  public readonly target: string;

  public readonly cacheTtl?: number;

  public readonly createdAt: string;

  constructor({
    id = randomUUID(),
    namespace,
    target,
    cacheTtl,
    createdAt = new Date().toISOString(),
  }: ProxyEntityProps) {
    this.id = id;
    this.namespace = namespace;
    this.target = target;
    this.cacheTtl = cacheTtl;
    this.createdAt = createdAt;
  }
}
