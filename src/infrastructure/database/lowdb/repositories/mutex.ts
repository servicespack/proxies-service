export class Mutex {
  private promise: Promise<void> | null = null

  async acquire(): Promise<() => void> {
    while (this.promise) {
      await this.promise
    }
    let release!: () => void
    this.promise = new Promise((resolve) => {
      release = () => {
        this.promise = null
        resolve()
      }
    })
    return release
  }
}
