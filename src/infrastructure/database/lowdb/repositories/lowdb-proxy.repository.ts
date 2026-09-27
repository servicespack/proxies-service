import type { Low } from 'lowdb'

import type { DatabaseSchema } from '@/config/database.js'

import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'
import { db } from '@/config/database.js'
import { Mutex } from './mutex.js'

const dbMutex = new Mutex()

export class LowDbProxyRepository implements ProxyRepository {
  constructor(private readonly database: Low<DatabaseSchema> = db) {}

  private get proxies(): ProxyEntity[] {
    return this.database.data?.proxies ?? []
  }

  async findAll(): Promise<ProxyEntity[]> {
    await this.database.read()
    return this.proxies
  }

  async findById(id: string): Promise<ProxyEntity | undefined> {
    await this.database.read()
    return this.proxies.find(proxy => proxy.id === id)
  }

  async findByNamespace(namespace: string): Promise<ProxyEntity | undefined> {
    await this.database.read()
    return this.proxies.find(proxy => proxy.namespace === namespace)
  }

  async create(proxy: ProxyEntity): Promise<ProxyEntity> {
    const release = await dbMutex.acquire()
    try {
      await this.database.read()
      this.database.data ||= { proxies: [] }
      this.database.data.proxies.push(proxy)
      await this.database.write()
      return proxy
    }
    finally {
      release()
    }
  }

  async update(id: string, proxyData: Partial<ProxyEntity>): Promise<ProxyEntity | undefined> {
    const release = await dbMutex.acquire()
    try {
      await this.database.read()
      const proxyIndex = this.proxies.findIndex(proxy => proxy.id === id)

      if (proxyIndex === -1) {
        return undefined
      }

      const updatedProxy = {
        ...this.proxies[proxyIndex],
        ...proxyData,
        id,
      }

      if (this.database.data) {
        this.database.data.proxies[proxyIndex] = updatedProxy
        await this.database.write()
      }

      return updatedProxy
    }
    finally {
      release()
    }
  }

  async delete(id: string): Promise<ProxyEntity | undefined> {
    const release = await dbMutex.acquire()
    try {
      await this.database.read()
      const proxy = this.proxies.find(p => p.id === id)

      if (!proxy) {
        return undefined
      }

      if (this.database.data) {
        this.database.data.proxies = this.proxies.filter(p => p.id !== id)
        await this.database.write()
      }

      return proxy
    }
    finally {
      release()
    }
  }
}
