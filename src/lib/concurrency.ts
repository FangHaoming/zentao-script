// 限制并发 Promise 的执行
export class ConcurrencyPool {
  private queue: Array<() => Promise<void>> = []
  private active = 0
  
  constructor(private readonly limit: number) {}
  
  run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try {
          this.active++
          const result = await fn()
          resolve(result)
        } catch (e) {
          reject(e)
        } finally {
          this.active--
          this.next()
        }
      }
      this.queue.push(task)
      this.next()
    })
  }
  
  private next() {
    if (this.active >= this.limit) return
    const task = this.queue.shift()
    if (task) task()
  }
}