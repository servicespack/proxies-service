import { MongoMemoryServer } from 'mongodb-memory-server'

import { connectMongo, disconnectMongo, getMongoDb } from '../../src/config/mongodb.js'

/**
 * @type {MongoMemoryServer | null}
 */
let mongod = null

export async function setupMongoMemory() {
  if (!mongod) {
    mongod = await MongoMemoryServer.create()
  }
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  process.env.DATABASE_DRIVER = 'mongodb'
  await connectMongo(uri)
  return { mongod, uri }
}

export async function clearMongoDb() {
  const db = getMongoDb()
  const collections = await db.collections()
  for (const collection of collections) {
    await collection.deleteMany({})
  }
}

export async function teardownMongoMemory() {
  await disconnectMongo()
  if (mongod) {
    await mongod.stop()
    mongod = null
  }
  delete process.env.DATABASE_DRIVER
  delete process.env.MONGODB_URI
}
