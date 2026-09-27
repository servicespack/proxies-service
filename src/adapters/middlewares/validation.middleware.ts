import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'

export function validateBody(schema: ZodSchema) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      response.status(400).json({ errors: result.error.issues })
      return
    }
    request.body = result.data
    next()
  }
}
