declare module 'promise.map' {
  /**
   * pmap
   *
   * concurrent map over arr
   */
  export default function promiseMap<IN, OUT>(
    arr: IN[],
    fn: (item: IN, index: number, arr: IN[]) => Promise<OUT>,
    concurrency: number
  ): Promise<OUT[]>
}
