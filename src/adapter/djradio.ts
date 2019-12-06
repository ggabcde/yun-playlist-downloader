import API from '@magicdawn/music-api'
import debugFactory from 'debug'
import pmap from 'promise.map'
import BaseAdapter, {Song} from './base'
import {normalizeUrl, getId} from '../util.js'
import programDetail from '../api/program-detail.js'

const debug = debugFactory('yun:adapter:djradio')

export interface ProgramUi {
  songId: string
  programId: string
  programOrder: string
  name: string
  programUrl: string
  playCount: string
  likeCount: string
  date: string
  audioDuration: string
}

export interface DjSong extends Song {
  programUi: ProgramUi
  programDetail: any
}

export default class DjradioAdapter extends BaseAdapter {
  getTitle($: CheerioAPI) {
    return $('h2.f-ff2').text()
  }

  async getDetail($: CheerioAPI, url: string, quality: string) {
    const text = $('#radio-data').text()

    const $rows = $('.m-table.m-table-program tr')
    let programs = $rows.toArray().map(row => {
      const $row = $(row)
      const getText = (selector: string) =>
        $row
          .find(selector)
          .text()
          .trim()

      // song-id
      const songId = $row.attr('id').replace(/^songlist-/g, '')

      // 节目顺序
      const programOrder = getText('.col1')

      // 名称
      const name = getText('.col2 .tt a')

      // 链接
      let programUrl = $row.find('.col2 .tt a').attr('href')
      programUrl = new URL(programUrl, url).href

      const programId = getId(programUrl)

      // 播放数量
      const playCount = getText('.col3')

      // 赞数量
      const likeCount = getText('.col4')

      // 日期
      const date = getText('.col5')

      // 时长
      const audioDuration = getText('.f-pr')

      const ret: ProgramUi = {
        songId,
        programId,
        programOrder,
        name,
        programUrl,
        playCount,
        likeCount,
        date,
        audioDuration,
      }
      return ret
    })

    // get mainSong via API
    const programsWithDetails = await pmap(
      programs,
      async programUi => {
        const {programId} = programUi
        const program = await programDetail(programId)
        const {mainSong} = program
        return {mainSong, programDetail: program, programUi}
      },
      10
    )

    // 和其他 adapter 一样的格式
    const detail = programsWithDetails.map(item => {
      const {programDetail, programUi} = item
      const mainSong: Song = item.mainSong
      Object.assign(mainSong, {programDetail, programUi})
      return mainSong as DjSong
    })

    return detail
  }
}
