import type { NextFunction, Request, Response } from 'express'

export interface AuthParams {
  readonly token?: string | (() => string | undefined)
}

export function auth(params: AuthParams) {
  return function authMiddleware(request: Request, response: Response, next: NextFunction): void {
    const requestToken = request.query.token
    const validToken = typeof params.token === 'function' ? params.token() : params.token

    if (!validToken || requestToken !== validToken) {
      response.status(401).json({
        error: 'Unauthorized',
      })
      return
    }

    next()
  }
}
