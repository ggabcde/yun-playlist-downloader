import _ from 'lodash'
import rp from 'request-promise'
import Debug from 'debug'
import { aesRsaEncrypt as encrypt } from '@magicdawn/music-api/src/crypto'

const debug = Debug('yun:api:playurl:music-api')

/**
 * getData
 */

export default async function(ids, quality) {
  if (!ids || !ids.length) return
  quality = quality || 320000 // 320 | 192 | 128

  // bl
  let bl = {
    br: quality,
    csrf_token: '',
    ids: ids,
  }
  bl = JSON.stringify(bl)

  // {params, encSecKey}
  // https://github.com/LIU9293/musicAPI/blob/9b75830249b03599817b792c4cb05ded13a50949/src/netease/getSong.js#L11
  const body = encrypt(bl)

  let json = await rp({
    method: 'POST',
    url:
      'http://music.163.com/weapi/song/enhance/player/url?csrf_token=6817f1ae5c9664c9076e301c537afc29',
    form: body,
    simple: false,
  })
  json = JSON.parse(json)

  debug('POST result: %j', json)
  return json.data
}
