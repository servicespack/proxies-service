import { faker } from '@faker-js/faker'
import nock from 'nock'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { loadServer } from './helpers/load-server'

describe('Proxies Extended Features', () => {
  /**
   * @type {import('http').Server}
   */
  let server

  beforeEach(async () => {
    process.env = {
      ...process.env,
      TOKEN: faker.lorem.word(),
    }

    server = await loadServer()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('should inject and remove headers as configured', async () => {
    const url = 'http://test-headers-api.local'
    const namespace = 'headers-test'
    let capturedHeaders = null

    nock(url)
      .get('/data')
      .reply(200, function handleNockRequest() {
        capturedHeaders = this.req.headers
        return { success: true }
      })

    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        target: url,
        headersToInject: {
          'X-Test-Inject': 'InjectedVal',
        },
        headersToRemove: ['X-Test-Remove'],
      })

    const { status, body } = await request(server)
      .get(`/${namespace}/data`)
      .set('X-Test-Remove', 'should-be-removed')

    expect(status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(capturedHeaders).toBeDefined()
    expect(capturedHeaders['x-test-inject']).toBe('InjectedVal')
    expect(capturedHeaders['x-test-remove']).toBeUndefined()
  })

  it('should rate limit requests per namespace', async () => {
    const url = 'http://rate-limit-api.local'
    const namespace = 'rate-limit-test'

    nock(url)
      .get('/data')
      .times(2)
      .reply(200, { success: true })

    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        target: url,
        rateLimitWindowMs: 60000,
        rateLimitMax: 2,
      })

    // Request 1: OK
    let res = await request(server).get(`/${namespace}/data`)
    expect(res.status).toBe(200)

    // Request 2: OK
    res = await request(server).get(`/${namespace}/data`)
    expect(res.status).toBe(200)

    // Request 3: Rate Limited (429)
    res = await request(server).get(`/${namespace}/data`)
    expect(res.status).toBe(429)
    expect(res.body).toEqual({ error: 'Too many requests' })
  })

  it('should load balance requests between multiple targets', async () => {
    const targets = ['http://lb-target1.local', 'http://lb-target2.local']
    const namespace = 'lb-test'

    nock(targets[0])
      .get('/data')
      .twice()
      .reply(200, { target: 1 })

    nock(targets[1])
      .get('/data')
      .reply(200, { target: 2 })

    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        targets,
        loadBalancerStrategy: 'round-robin',
      })

    // First request should go to target 1
    let res = await request(server).get(`/${namespace}/data`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ target: 1 })

    // Second request should go to target 2
    res = await request(server).get(`/${namespace}/data`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ target: 2 })

    // Third request should wrap around and go to target 1
    res = await request(server).get(`/${namespace}/data`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ target: 1 })
  })
})
