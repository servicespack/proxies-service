import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest'

import { LowDbProxyRepository } from '@/infrastructure/database/lowdb/repositories/lowdb-proxy.repository.js'
import { MongoDbProxyRepository } from '@/infrastructure/database/mongodb/repositories/mongodb-proxy.repository.js'
import { createProxyRepository } from '@/infrastructure/database/proxy-repository.factory.js'

describe('createProxyRepository', () => {
  const originalDriver = process.env.DATABASE_DRIVER

  afterEach(() => {
    if (originalDriver) {
      process.env.DATABASE_DRIVER = originalDriver
    }
    else {
      delete process.env.DATABASE_DRIVER
    }
  })

  it('should return LowDbProxyRepository when driver is lowdb', () => {
    const repository = createProxyRepository('lowdb')
    expect(repository).toBeInstanceOf(LowDbProxyRepository)
  })

  it('should default to LowDbProxyRepository when no driver is specified and env is not set', () => {
    delete process.env.DATABASE_DRIVER
    const repository = createProxyRepository()
    expect(repository).toBeInstanceOf(LowDbProxyRepository)
  })

  it('should return MongoDbProxyRepository when driver is mongodb', () => {
    const repository = createProxyRepository('mongodb')
    expect(repository).toBeInstanceOf(MongoDbProxyRepository)
  })

  it('should read DATABASE_DRIVER from process.env when parameter is omitted', () => {
    process.env.DATABASE_DRIVER = 'mongodb'
    const repository = createProxyRepository()
    expect(repository).toBeInstanceOf(MongoDbProxyRepository)
  })

  it('should throw an error for unsupported driver', () => {
    expect(() => createProxyRepository('postgres')).toThrow(
      'Unsupported DATABASE_DRIVER: postgres. Supported drivers are \'lowdb\' and \'mongodb\'.',
    )
  })
})
