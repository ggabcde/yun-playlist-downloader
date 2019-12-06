import {aesRsaEncrypt} from '@magicdawn/music-api/src/crypto'

// https://github.com/LIU9293/musicAPI/blob/9b75830249b03599817b792c4cb05ded13a50949/src/netease/getSong.js#L11
export default function encryptViaApi(reqbody: Object) {
  return aesRsaEncrypt(JSON.stringify(reqbody))
}
