import { logger } from '@/config/logger.js'

type ShutdownHook = () => Promise<void> | void

const EXIT_SIGNALS = {
  SIGHUP: 129,
  SIGINT: 130,
  SIGTERM: 143,
} as const

export function setupGracefulShutdown(hooks: ShutdownHook[]): void {
  let isShuttingDown = false

  const close = (code: number) => async () => {
    if (isShuttingDown) {
      return
    }
    isShuttingDown = true

    logger.info('Shutting down Node Proxy')

    try {
      for (const hook of hooks) {
        await hook()
      }
      process.exit(code)
    }
    catch (error) {
      logger.error(error, 'Error during graceful shutdown')
      process.exit(1)
    }
  }

  process.on('SIGHUP', close(EXIT_SIGNALS.SIGHUP))
  process.on('SIGINT', close(EXIT_SIGNALS.SIGINT))
  process.on('SIGTERM', close(EXIT_SIGNALS.SIGTERM))
}
