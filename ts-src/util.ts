import debugFactory from 'debug'
import {umi} from './singleton'

const debug = debugFactory('yun:util')

/**
 * 获取html
 */

export function getHtml(url: string) {
  return umi.get(url, {
    prefix: '',
    responseType: 'text',
  }) as Promise<string>
}

/**
 * mormalize url
 *
 * http://music.163.com/#/playlist?id=12583200
 * to
 * http://music.163.com/playlist?id=12583200
 */

export function normalizeUrl(url: string) {
  return url.replace(/(https?:.*?\/)(#\/)/, '$1')
}

/**
 * getId
 */

export function getId(url: string) {
  url = normalizeUrl(url) // remove #
  const u = new URL(url)
  const id = u.searchParams.get('id')
  return id
}
