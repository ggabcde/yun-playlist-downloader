import API from '@magicdawn/music-api'
import Debug from 'debug'
import BaseAdapter from './base'

const debug = Debug('yun:adapter:playlist')

export default class PlaylistAdapter extends BaseAdapter {
  getTitle($: CheerioStatic) {
    return $('h2.f-ff2.f-brk').text()
  }

  async getDetail($: CheerioStatic, url: string, quality: number) {
    const id = this.getId(url)
    const ret = await API.getPlaylist('netease', {id, raw: true})
    return ret.playlist.tracks
  }
}
