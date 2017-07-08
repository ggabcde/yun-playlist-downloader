
/**
 * module dependencies
 */

import { padStart, trimStart } from 'lodash'
import { extname } from 'path'

export default class BaseAdapter {
  type: string = null

  /**
   * get title for a page
   * @param  {CheerioSelector} $ Cheerio instance
   * @return {string} title
   */
  getTitle($: CheerioSelector): string {
    return $('h2.f-ff2.f-brk').text()
  }

  getSongs(songs: Array<any>): Array<Song> {
    // e.g 100 songs -> len = 3
    const len = String(songs.length).length

    return songs.map(function (song, index) {
      return {
        // 歌手
        singer: song.artists[0].name,

        // 歌曲名
        songName: song.name,

        // url for download
        url: song.ajaxData.url,

        // extension
        ext: trimStart(extname(song.ajaxData.url), '.'),

        // index, first as 01
        index: padStart(String(index + 1), len, '0'),

        // rawIndex: 0,1 ...
        rawIndex: index
      }
    })
  }
}

/**
 * get songs detail
 *
 * @param {Array} [songs] songs
 */

export type Song = {
  singer: string,
  songName: string,
  url: string,
  ext: string,
  index: string,
  rawIndex: number,
}