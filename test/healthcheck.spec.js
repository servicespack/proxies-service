import request from 'supertest'
import { beforeEach, describe, it } from 'vitest'

import { loadServer } from './helpers/load-server.js'

describe('Healthcheck', () => {
  /**
   * @type {import('http').Server}
   */
  let server

  beforeEach(async () => {
    process.env.TOKEN = 'dummy-token-for-test'
    server = await loadServer()
  })

  it('Should return the healthcheck correctly', () => request(server)
    .get('/')
    .expect(200, {
      I: 'am alive',
    }))
})
