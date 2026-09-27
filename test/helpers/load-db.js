import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * @returns {import('lowdb').Low}
 */
export async function loadDb() {
  const { db } = await import(
    join(__dirname, '..', '..', 'src', 'config', `database.ts?time=${Date.now()}`),
  )

  await db.read()
  db.data = { proxies: [] }
  await db.write()

  return db
}
