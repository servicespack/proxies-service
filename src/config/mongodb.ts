import type { Db } from 'mongodb'
import { MongoClient } from 'mongodb'

import { logger } from './logger.js'

let client: MongoClient | null = null

export async function connectMongo(uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    logger.info('Connected to MongoDB')
  }
  return client
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error('MongoClient is not connected. Call connectMongo() first.')
  }
  return client
}

export function getMongoDb(dbName = process.env.MONGODB_DATABASE || 'proxies'): Db {
  return getMongoClient().db(dbName)
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    logger.info('Disconnected from MongoDB')
  }
}
