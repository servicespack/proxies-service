import { faker } from '@faker-js/faker'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { loadDb } from './helpers/load-db'
import { loadServer } from './helpers/load-server'

describe('Proxies CRUD', () => {
  /**
   * @type {import('http').Server}
   */
  let server
  /**
   * @type {import('lowdb').Low}
   */
  let db

  beforeEach(async () => {
    process.env = {
      ...process.env,
      TOKEN: faker.lorem.word(),
    }

    server = await loadServer()
    db = await loadDb()

    // Clear database before each test to ensure isolation
    await db.read()
    db.data = { proxies: [] }
    await db.write()
  })

  describe('POST /proxies', () => {
    it('Should return status code 201', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()

      const { body, status } = await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({
          namespace,
          target,
        })

      expect(status).toBe(201)
      expect(body).toEqual({
        id: expect.any(String),
        namespace,
        target,
        createdAt: expect.any(String),
      })
    })

    it('Should return status code 401 when token is missing', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()

      const { body, status } = await request(server)
        .post('/proxies')
        .send({
          namespace,
          target,
        })

      expect(status).toBe(401)
      expect(body).toEqual({
        error: 'Unauthorized',
      })
    })

    it('Should return status code 401 when token is invalid', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()

      const { body, status } = await request(server)
        .post('/proxies?token=invalid-token')
        .send({
          namespace,
          target,
        })

      expect(status).toBe(401)
      expect(body).toEqual({
        error: 'Unauthorized',
      })
    })

    it('Should return status code 409 when creating a proxy with an existing namespace', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()

      await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace, target })

      const { body, status } = await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace, target: faker.internet.url() })

      expect(status).toBe(409)
      expect(body).toEqual({ error: `Proxy with namespace '${namespace}' already exists` })
    })

    it('Should return status code 401 when server TOKEN is not configured', async () => {
      delete process.env.TOKEN

      const { body, status } = await request(server)
        .post('/proxies')
        .send({
          namespace: faker.internet.domainWord(),
          target: faker.internet.url(),
        })

      expect(status).toBe(401)
      expect(body).toEqual({
        error: 'Unauthorized',
      })
    })
  })

  describe('GET /proxies', () => {
    it('Should return status code 200 and a list of proxies', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()

      const { body: createdProxy } = await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace, target })

      const { body, status } = await request(server)
        .get(`/proxies?token=${process.env.TOKEN}`)

      expect(status).toBe(200)
      expect(body.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: createdProxy.id, namespace, target }),
      ]))
    })
  })

  describe('GET /proxies/:proxyId', () => {
    it('Should return status code 200 and the proxy', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()

      const { body: createdProxy } = await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace, target })

      const { body, status } = await request(server)
        .get(`/proxies/${createdProxy.id}?token=${process.env.TOKEN}`)

      expect(status).toBe(200)
      expect(body).toMatchObject({ id: createdProxy.id, namespace, target })
    })

    it('Should return status code 404 when proxy is not found', async () => {
      const { body, status } = await request(server)
        .get(`/proxies/non-existent-id?token=${process.env.TOKEN}`)

      expect(status).toBe(404)
      expect(body).toEqual({ error: 'Not found' })
    })
  })

  describe('PATCH /proxies/:proxyId', () => {
    it('Should return status code 200 and the updated proxy', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()
      const newTarget = faker.internet.url()

      const { body: createdProxy } = await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace, target })

      const { body, status } = await request(server)
        .patch(`/proxies/${createdProxy.id}?token=${process.env.TOKEN}`)
        .send({ target: newTarget })

      expect(status).toBe(200)
      expect(body).toMatchObject({ id: createdProxy.id, namespace, target: newTarget })
    })

    it('Should return status code 409 when updating a proxy with an existing namespace', async () => {
      const namespace1 = faker.internet.domainWord()
      const namespace2 = faker.internet.domainWord()
      const target = faker.internet.url()

      await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace: namespace1, target })

      const { body: createdProxy2 } = await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace: namespace2, target })

      const { body, status } = await request(server)
        .patch(`/proxies/${createdProxy2.id}?token=${process.env.TOKEN}`)
        .send({ namespace: namespace1 })

      expect(status).toBe(409)
      expect(body).toEqual({ error: `Proxy with namespace '${namespace1}' already exists` })
    })

    it('Should return status code 404 when proxy is not found', async () => {
      const { body, status } = await request(server)
        .patch(`/proxies/non-existent-id?token=${process.env.TOKEN}`)
        .send({ target: faker.internet.url() })

      expect(status).toBe(404)
      expect(body).toEqual({ error: 'Not found' })
    })
  })

  describe('DELETE /proxies/:proxyId', () => {
    it('Should return status code 200 and the deleted proxy', async () => {
      const namespace = faker.internet.domainWord()
      const target = faker.internet.url()

      const { body: createdProxy } = await request(server)
        .post(`/proxies?token=${process.env.TOKEN}`)
        .send({ namespace, target })

      const { body, status } = await request(server)
        .delete(`/proxies/${createdProxy.id}?token=${process.env.TOKEN}`)

      expect(status).toBe(200)
      expect(body).toMatchObject({ id: createdProxy.id, namespace, target })
    })

    it('Should return status code 404 when proxy is not found', async () => {
      const { body, status } = await request(server)
        .delete(`/proxies/non-existent-id?token=${process.env.TOKEN}`)

      expect(status).toBe(404)
      expect(body).toEqual({ error: 'Not found' })
    })
  })
})
