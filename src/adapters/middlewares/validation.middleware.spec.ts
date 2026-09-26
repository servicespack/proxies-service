import type { Request, Response, NextFunction } from 'express';
import {
  describe, it, expect, vi,
} from 'vitest';
import { z } from 'zod';

import { validateBody } from '@/adapters/middlewares/validation.middleware.js';

describe('validation middleware', () => {
  const createMockResponse = () => {
    const response = {} as Response;
    response.status = vi.fn().mockReturnValue(response) as any;
    response.json = vi.fn().mockReturnValue(response) as any;
    return response;
  };

  const createMockRequest = (body: any) => ({
    body,
  } as Request);

  const schema = z.object({
    username: z.string().min(3),
    age: z.number().int().positive(),
  });

  it('should call next and set request.body when validation passes', () => {
    const middleware = validateBody(schema);
    const validBody = { username: 'testuser', age: 25 };
    const request = createMockRequest(validBody);
    const response = createMockResponse();
    const next = vi.fn();

    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(request.body).toEqual(validBody);
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).not.toHaveBeenCalled();
  });

  it('should call next and strip extra fields based on schema', () => {
    const middleware = validateBody(schema);
    const request = createMockRequest({ username: 'testuser', age: 25, extra: 'should-be-stripped' });
    const response = createMockResponse();
    const next = vi.fn();

    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(request.body).toEqual({ username: 'testuser', age: 25 });
    expect(response.status).not.toHaveBeenCalled();
  });

  it('should return 400 with errors when validation fails (missing fields)', () => {
    const middleware = validateBody(schema);
    const request = createMockRequest({});
    const response = createMockResponse();
    const next = vi.fn();

    middleware(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ path: ['username'], message: 'Required' }),
          expect.objectContaining({ path: ['age'], message: 'Required' }),
        ]),
      }),
    );
  });

  it('should return 400 with errors when validation fails (invalid types)', () => {
    const middleware = validateBody(schema);
    const request = createMockRequest({ username: 'ts', age: -5 });
    const response = createMockResponse();
    const next = vi.fn();

    middleware(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ path: ['username'], message: 'String must contain at least 3 character(s)' }),
          expect.objectContaining({ path: ['age'], message: 'Number must be greater than 0' }),
        ]),
      }),
    );
  });
});
