import API from '@magicdawn/music-api'
import Debug from 'debug'
import BaseAdapter from './base'

const debug = Debug('yun:adapter:playlist')

export default class PlaylistAdapter extends BaseAdapter {
  getTitle($: CheerioAPI) {
    return $('h2.f-ff2.f-brk').text()
  }

  async getDetail($: CheerioAPI, url: string, quality: string) {
    const id = this.getId(url)
    const ret = await API.getPlaylist('netease', {id, raw: true})
    return ret.playlist.tracks
  }
}
