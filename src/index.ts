import { disconnectDatabase, logger } from '@/config/index.js'
import { server } from '@/infrastructure/http/server.js'
import { setupGracefulShutdown } from '@/infrastructure/process/graceful-shutdown.js'

async function main() {
  const { PORT = 3000 } = process.env

  server.listen(PORT, () => logger.info(`Listening on ${PORT}`))

  setupGracefulShutdown([
    () => new Promise<void>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>

      server.close((err) => {
        clearTimeout(timeoutId)
        if (err) {
          reject(err)
        }
        else {
          resolve()
        }
      })

      timeoutId = setTimeout(() => {
        logger.warn('Force-closing remaining connections after timeout')
        server.closeAllConnections()
      }, 5000)
    }),
    disconnectDatabase,
  ])
}

main()
