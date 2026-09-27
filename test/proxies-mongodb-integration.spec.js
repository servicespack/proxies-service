import { randomUUID } from 'node:crypto'

import { faker } from '@faker-js/faker'
import nock from 'nock'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { clearMongoDb, setupMongoMemory, teardownMongoMemory } from './helpers/load-mongo.js'
import { loadServer } from './helpers/load-server.js'

describe('Proxies with DATABASE_DRIVER=mongodb integration (in-memory)', () => {
  /**
   * @type {import('http').Server}
   */
  let server

  beforeAll(async () => {
    await setupMongoMemory()
  })

  afterAll(async () => {
    await teardownMongoMemory()
  })

  beforeEach(async () => {
    await clearMongoDb()

    process.env = {
      ...process.env,
      TOKEN: faker.lorem.word(),
    }

    server = await loadServer()
  })

  it('should create, list, retrieve, update, route and delete a proxy using in-memory MongoDB', async () => {
    const namespace = faker.internet.domainWord()
    const target = faker.internet.url()

    // 1. Create proxy
    const createRes = await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({ namespace, target })

    expect(createRes.status).toBe(201)
    expect(createRes.body).toEqual({
      id: expect.any(String),
      namespace,
      target,
      createdAt: expect.any(String),
    })

    const proxyId = createRes.body.id

    // 2. List proxies
    const listRes = await request(server)
      .get(`/proxies?token=${process.env.TOKEN}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.data).toContainEqual(
      expect.objectContaining({ id: proxyId, namespace, target }),
    )

    // 3. Get proxy by ID
    const getRes = await request(server)
      .get(`/proxies/${proxyId}?token=${process.env.TOKEN}`)

    expect(getRes.status).toBe(200)
    expect(getRes.body).toEqual(
      expect.objectContaining({ id: proxyId, namespace, target }),
    )

    // 4. Update proxy target
    const newTarget = faker.internet.url()
    const updateRes = await request(server)
      .patch(`/proxies/${proxyId}?token=${process.env.TOKEN}`)
      .send({ target: newTarget })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.target).toBe(newTarget)

    // 5. Dynamic proxy routing
    const subpath = `/${faker.internet.domainWord()}`
    nock(newTarget)
      .get(subpath)
      .reply(200, { success: true, dummy: randomUUID() })

    const proxyRouteRes = await request(server)
      .get(`/${namespace}${subpath}`)

    expect(proxyRouteRes.status).toBe(200)
    expect(proxyRouteRes.body).toEqual({
      success: true,
      dummy: expect.any(String),
    })

    // 6. Delete proxy
    const deleteRes = await request(server)
      .delete(`/proxies/${proxyId}?token=${process.env.TOKEN}`)

    expect(deleteRes.status).toBe(200)
    expect(deleteRes.body.id).toBe(proxyId)

    // 7. Verify deletion
    const getDeletedRes = await request(server)
      .get(`/proxies/${proxyId}?token=${process.env.TOKEN}`)

    expect(getDeletedRes.status).toBe(404)
  })
})
