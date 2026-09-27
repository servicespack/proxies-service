import { Router } from 'express'
import prometheus from 'prom-client'

const register = new prometheus.Registry()
const router = Router()

prometheus.collectDefaultMetrics({ register })

const { ENABLE_METRICS_ROUTER = 'false' } = process.env

if (ENABLE_METRICS_ROUTER === 'true') {
  router
    .get('/', async (_request, response) => {
      const metrics = await register.metrics()
      return response.setHeader('Content-Type', register.contentType).send(metrics)
    })
}

export const metrics = router
