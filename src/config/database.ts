import type { Low } from 'lowdb'
import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { JSONFilePreset } from 'lowdb/node'

import { disconnectMongo } from './mongodb.js'

export interface DatabaseSchema {
  proxies: ProxyEntity[]
}

const currentDir = dirname(fileURLToPath(import.meta.url))
const isSrc = currentDir.endsWith('config')
const rootDir = isSrc ? join(currentDir, '..', '..') : join(currentDir, '..')
const defaultPath = join(rootDir, 'config.json')

export function connectDatabase(filePath = process.env.CONFIG_PATH || defaultPath) {
  return JSONFilePreset<DatabaseSchema>(filePath, { proxies: [] })
}

export async function disconnectDatabase(): Promise<void> {
  if (process.env.DATABASE_DRIVER === 'mongodb') {
    await disconnectMongo()
  }
}

export const db: Low<DatabaseSchema> = process.env.DATABASE_DRIVER === 'mongodb'
  ? (null as unknown as Low<DatabaseSchema>)
  : await connectDatabase()
