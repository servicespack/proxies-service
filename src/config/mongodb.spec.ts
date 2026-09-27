import { MongoClient } from 'mongodb'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { disconnectDatabase } from '@/config/database.js'
import {
  connectMongo,
  disconnectMongo,
  getMongoClient,
  getMongoDb,
} from '@/config/mongodb.js'

vi.mock('mongodb', () => {
  const mockDb = vi.fn().mockReturnValue({
    collection: vi.fn().mockReturnValue({}),
  })
  const mockConnect = vi.fn().mockResolvedValue(undefined)
  const mockClose = vi.fn().mockResolvedValue(undefined)

  const MockMongoClient = vi.fn(function MockMongoClient(this: any, uri: string) {
    this.uri = uri
    this.connect = mockConnect
    this.close = mockClose
    this.db = mockDb
  })

  return {
    MongoClient: MockMongoClient,
  }
})

describe('MongoDB Configuration', () => {
  beforeEach(async () => {
    await disconnectMongo()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await disconnectMongo()
  })

  it('should throw an error when getMongoClient is called before connectMongo', () => {
    expect(() => getMongoClient()).toThrow(
      'MongoClient is not connected. Call connectMongo() first.',
    )
  })

  it('should connect to MongoDB and return client', async () => {
    const client = await connectMongo('mongodb://127.0.0.1:27017')

    expect(MongoClient).toHaveBeenCalledWith('mongodb://127.0.0.1:27017')
    expect(client.connect).toHaveBeenCalled()
    expect(getMongoClient()).toBe(client)
  })

  it('should reuse existing client if already connected', async () => {
    const client1 = await connectMongo('mongodb://127.0.0.1:27017')
    const client2 = await connectMongo('mongodb://127.0.0.1:27017')

    expect(client1).toBe(client2)
    expect(MongoClient).toHaveBeenCalledTimes(1)
  })

  it('should return database from client via getMongoDb', async () => {
    await connectMongo()
    const db = getMongoDb('custom-db')

    expect(db).toBeDefined()
    expect(getMongoClient().db).toHaveBeenCalledWith('custom-db')
  })

  it('should close client and reset state on disconnectMongo', async () => {
    const client = await connectMongo()
    await disconnectMongo()

    expect(client.close).toHaveBeenCalled()
    expect(() => getMongoClient()).toThrow(
      'MongoClient is not connected. Call connectMongo() first.',
    )
  })

  describe('disconnectDatabase', () => {
    const originalDriver = process.env.DATABASE_DRIVER

    afterEach(() => {
      if (originalDriver) {
        process.env.DATABASE_DRIVER = originalDriver
      }
      else {
        delete process.env.DATABASE_DRIVER
      }
    })

    it('should disconnect from MongoDB when DATABASE_DRIVER is mongodb', async () => {
      process.env.DATABASE_DRIVER = 'mongodb'
      const client = await connectMongo()

      await disconnectDatabase()

      expect(client.close).toHaveBeenCalled()
    })

    it('should not disconnect from MongoDB when DATABASE_DRIVER is lowdb', async () => {
      process.env.DATABASE_DRIVER = 'lowdb'
      const client = await connectMongo()

      await disconnectDatabase()

      expect(client.close).not.toHaveBeenCalled()
    })
  })
})
