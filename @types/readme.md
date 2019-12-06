# @types

## @types/module

寻找模块会按照这个顺序

- tsconfig.compilerOptions.typeRoots = [@types/, node_modules/@types/]
- 对于 package 里自带了 d.ts, 使用 baseUrl + paths 覆盖

### `umi-request`

```ts
export type RequestInterceptor = (
  url: string,
  options: RequestOptionsInit
) =>
  | {
      url?: string
      options?: RequestOptionsInit
    }
  | Promise<{
      url?: string
      options?: RequestOptionsInit
    }>
```

declare namespace yargs {
type Choices = ReadonlyArray<string | true | undefined | number>
}
