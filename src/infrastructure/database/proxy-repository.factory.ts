import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js'
import { LowDbProxyRepository } from '@/infrastructure/database/lowdb/repositories/lowdb-proxy.repository.js'
import { MongoDbProxyRepository } from '@/infrastructure/database/mongodb/repositories/mongodb-proxy.repository.js'

export function createProxyRepository(driver = process.env.DATABASE_DRIVER || 'lowdb'): ProxyRepository {
  if (driver === 'mongodb') {
    return new MongoDbProxyRepository()
  }

  if (driver === 'lowdb') {
    return new LowDbProxyRepository()
  }

  throw new Error(`Unsupported DATABASE_DRIVER: ${driver}. Supported drivers are 'lowdb' and 'mongodb'.`)
}
