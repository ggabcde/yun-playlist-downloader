import API from '@magicdawn/music-api'
import Debug from 'debug'
import BaseAdapter from './base'

const debug = Debug('yun:adapter:album')

export default class AlbumAdapter extends BaseAdapter {
  getTitle($: CheerioAPI) {
    return $('h2.f-ff2').text()
  }

  async getDetail($: CheerioAPI, url: string, quality: number) {
    const id = this.getId(url)
    const ret = await API.getAlbum('netease', { id, raw: true })
    return ret.songs
  }
}
