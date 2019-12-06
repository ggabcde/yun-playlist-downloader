/* eslint camelcase: off */

import _ from 'lodash'
import Debug from 'debug'
import {umi} from '../singleton.js'

const debug = Debug('yun:api:playurl:music-api')

/**
 * getData
 */

export default async function(ids: string[], quality: string) {
  if (!ids || !ids.length) return
  quality = quality || '320000' // 320 | 192 | 128

  // bl
  let bl = {
    br: quality,
    csrf_token: '',
    ids: ids,
  }

  const json = await umi.post('/weapi/song/enhance/player/url', {
    data: bl,
  })
  debug('POST result: %j', json)
  return json.data
}
