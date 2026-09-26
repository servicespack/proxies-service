import zlib from 'node:zlib';

import { faker } from '@faker-js/faker';
import nock from 'nock';
import request from 'supertest';

import { responseCache } from '../src/infrastructure/cache/response-cache.js';

import { loadServer } from './helpers/load-server';

describe('Proxies Response Caching', () => {
  /**
   * @type {import('http').Server}
   */
  let server;

  beforeEach(async () => {
    process.env = {
      ...process.env,
      TOKEN: faker.lorem.word(),
    };

    responseCache.clear();
    server = await loadServer();
  });

  afterEach(() => {
    responseCache.clear();
  });

  it('should cache GET responses and invalidate on update', async () => {
    const url = 'https://my-backend.local';
    const uri = '/data';
    const namespace = 'cached-service';

    // Mock first request
    nock(url)
      .get(uri)
      .reply(200, { value: 'first-response' });

    // Register a proxy with cacheTtl
    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        target: url,
        cacheTtl: 10,
      });

    // 1st request - Cache MISS
    const response1 = await request(server).get(`/${namespace}${uri}`);
    expect(response1.status).toBe(200);
    expect(response1.body).toEqual({ value: 'first-response' });
    expect(response1.headers['x-proxy-cache']).toBe('MISS');

    // 2nd request - Cache HIT (no nock mock configured, so if it tried to request, nock would fail)
    const response2 = await request(server).get(`/${namespace}${uri}`);
    expect(response2.status).toBe(200);
    expect(response2.body).toEqual({ value: 'first-response' });
    expect(response2.headers['x-proxy-cache']).toBe('HIT');

    // Get the proxy ID
    const listResponse = await request(server).get(`/proxies?token=${process.env.TOKEN}`);
    const proxy = listResponse.body.data.find((p) => p.namespace === namespace);
    expect(proxy).toBeDefined();

    // Mock third request (after cache invalidation)
    nock(url)
      .get(uri)
      .reply(200, { value: 'second-response' });

    // Update the proxy (invalidates the cache)
    await request(server)
      .patch(`/proxies/${proxy.id}?token=${process.env.TOKEN}`)
      .send({
        cacheTtl: 5,
      });

    // 3rd request - Cache MISS (since cache was invalidated)
    const response3 = await request(server).get(`/${namespace}${uri}`);
    expect(response3.status).toBe(200);
    expect(response3.body).toEqual({ value: 'second-response' });
    expect(response3.headers['x-proxy-cache']).toBe('MISS');
  });

  it('should not cache POST requests', async () => {
    const url = 'https://my-post-backend.local';
    const uri = '/create';
    const namespace = 'no-cache-post';

    nock(url)
      .post(uri)
      .reply(201, { ok: true })
      .post(uri)
      .reply(201, { ok: true });

    // Register proxy with cacheTtl
    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        target: url,
        cacheTtl: 10,
      });

    // 1st POST request
    const response1 = await request(server)
      .post(`/${namespace}${uri}`)
      .send({ dummy: 'data' });
    expect(response1.status).toBe(201);
    expect(response1.headers['x-proxy-cache']).toBeUndefined();

    // 2nd POST request (requires mock, otherwise nock fails)
    const response2 = await request(server)
      .post(`/${namespace}${uri}`)
      .send({ dummy: 'data' });
    expect(response2.status).toBe(201);
    expect(response2.headers['x-proxy-cache']).toBeUndefined();
  });

  it('should not cache GET requests containing Authorization or Cookie headers', async () => {
    const url = 'https://my-auth-backend.local';
    const uri = '/private-data';
    const namespace = 'auth-cache-test';

    nock(url)
      .get(uri)
      .reply(200, { value: 'resp1' })
      .get(uri)
      .reply(200, { value: 'resp2' });

    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        target: url,
        cacheTtl: 10,
      });

    // Request with Authorization header
    const response1 = await request(server)
      .get(`/${namespace}${uri}`)
      .set('Authorization', 'Bearer some-token');
    expect(response1.status).toBe(200);
    expect(response1.headers['x-proxy-cache']).toBeUndefined();

    // Second request with same header should also go to mock (and not be cached)
    const response2 = await request(server)
      .get(`/${namespace}${uri}`)
      .set('Authorization', 'Bearer some-token');
    expect(response2.status).toBe(200);
    expect(response2.headers['x-proxy-cache']).toBeUndefined();
  });

  it('should not cache responses containing Cache-Control: private or no-store', async () => {
    const url = 'https://my-cc-backend.local';
    const uri = '/cc-data';
    const namespace = 'cc-cache-test';

    nock(url)
      .get(uri)
      .reply(200, { value: 'resp1' }, { 'Cache-Control': 'private, no-store' })
      .get(uri)
      .reply(200, { value: 'resp2' }, { 'Cache-Control': 'private, no-store' });

    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        target: url,
        cacheTtl: 10,
      });

    const response1 = await request(server).get(`/${namespace}${uri}`);
    expect(response1.status).toBe(200);
    expect(response1.headers['x-proxy-cache']).toBeUndefined();

    const response2 = await request(server).get(`/${namespace}${uri}`);
    expect(response2.status).toBe(200);
    expect(response2.headers['x-proxy-cache']).toBeUndefined();
  });

  it('should filter out hop-by-hop and encoding headers from cached response', async () => {
    const url = 'https://my-filter-backend.local';
    const uri = '/filter-data';
    const namespace = 'filter-cache-test';

    const bodyObj = { value: 'filtered-headers' };
    const compressedBody = zlib.gzipSync(JSON.stringify(bodyObj));

    nock(url)
      .get(uri)
      .reply(200, compressedBody, {
        'Transfer-Encoding': 'chunked',
        'Content-Encoding': 'gzip',
        'Content-Length': String(compressedBody.length),
        Connection: 'keep-alive',
        'Custom-Header': 'keep-me',
      });

    await request(server)
      .post(`/proxies?token=${process.env.TOKEN}`)
      .send({
        namespace,
        target: url,
        cacheTtl: 10,
      });

    // Cache MISS (stores stripped headers)
    const response1 = await request(server).get(`/${namespace}${uri}`);
    expect(response1.status).toBe(200);
    expect(response1.headers['x-proxy-cache']).toBe('MISS');
    expect(response1.headers['custom-header']).toBe('keep-me');

    // Cache HIT (serves stripped headers)
    const response2 = await request(server).get(`/${namespace}${uri}`);
    expect(response2.status).toBe(200);
    expect(response2.headers['x-proxy-cache']).toBe('HIT');
    expect(response2.headers['custom-header']).toBe('keep-me');
    expect(response2.headers['transfer-encoding']).toBeUndefined();
    expect(response2.headers['content-encoding']).toBeUndefined();

    // Verify cache content directly
    const cacheKey = `${namespace}:GET:${`/${namespace}${uri}`}`;
    const cached = responseCache.get(cacheKey);
    expect(cached).toBeDefined();
    expect(cached.headers.connection).toBeUndefined();
    expect(cached.headers['transfer-encoding']).toBeUndefined();
    expect(cached.headers['content-encoding']).toBeUndefined();
    expect(cached.headers['content-length']).toBeUndefined();
  });
});
