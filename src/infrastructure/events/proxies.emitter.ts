import EventEmitter from 'node:events'

export class ProxiesEmitter extends EventEmitter {
  static Events = {
    NEW_PROXY: 'NEW_PROXY',
    UPDATED_PROXY: 'UPDATED_PROXY',
    DELETED_PROXY: 'DELETED_PROXY',
  }

  static emitter = new ProxiesEmitter()
}
