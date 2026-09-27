export class ProxyAlreadyExistsError extends Error {
  public readonly status = 409

  constructor(namespace: string) {
    super(`Proxy with namespace '${namespace}' already exists`)
    this.name = ProxyAlreadyExistsError.name
  }
}
