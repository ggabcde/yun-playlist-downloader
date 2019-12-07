declare module 'promise.retry' {
  export interface RetryOptions {
    times?: number
    timeout?: number

    /**
     * @param {e} the error
     * @param {i} the index
     */
    onerror?: (e: Error, i: number) => void
  }

  export default function pretry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions
  ): T
}
