import path from 'path'
import _ from 'lodash'
import fs from 'fs-extra'
import symbols from 'log-symbols'
import debugFactory from 'debug'
import pretry from 'promise.retry'
import sanitize from 'filenamify'
import dl from 'dl-vampire'
import getPlayurl from './api/playurl'
import BaseAdapter, {Song, TransformSong} from './adapter/base'

const debug = debugFactory('yun:index')

/**
 * page type
 */

export const types = [
  {
    type: 'playlist',
    typeText: '列表',
  },
  {
    type: 'album',
    typeText: '专辑',
  },
  {
    type: 'djradio',
    typeText: '电台',
  },
]

/**
 * 下载一首歌曲
 */

export async function downloadSong(options: downloadSong.Options) {
  const progress: boolean = options.progress
  if (progress) {
    return downloadSongWithProgress(options)
  } else {
    return downloadSongPlain(options)
  }
}
export namespace downloadSong {
  export interface Options {
    progress?: boolean

    url: string
    file: string
    song: TransformSong
    totalLength: number
    retryTimeout?: number
    retryTimes?: number
    skipExists?: boolean
  }
}

async function downloadSongWithProgress(options: downloadSong.Options) {
  const ProgressBar = require('@magicdawn/ascii-progress')

  const {
    url,
    file,
    song,
    totalLength,
    retryTimeout,
    retryTimes,
    skipExists,
  } = options

  let bar
  const initBar = () => {
    bar = new ProgressBar({
      schema: `:symbol ${song.index}/${totalLength} [:bar] :postText`,
      total: 100,
      current: 0,
      width: 10,
      filled: '=',
      blank: ' ',
    })
  }

  // 成功
  const success = () => {
    bar.update(1, {symbol: symbols.success, postText: `下载成功 ${file}`})
  }

  // 失败
  const fail = () => {
    bar.update(0, {symbol: symbols.error, postText: `下载失败 ${file}`})
    bar.terminate()
  }

  // 下载中
  const downloading = percent =>
    bar.update(percent, {symbol: symbols.info, postText: `  下载中 ${file}`})

  // 重试
  const retry = i => {
    bar.tick(0, {symbol: symbols.warning, postText: ` ${i + 1}次失败 ${file}`})
  }

  // init state
  initBar()
  downloading(0)

  try {
    await dl({
      url,
      file,
      skipExists,
      onprogress(p) {
        const {percent} = p
        if (percent === 1) {
          success()
        } else {
          downloading(percent)
        }
      },
      retry: {
        timeout: retryTimeout,
        times: retryTimes,
        onerror: function(e, i) {
          retry(i)
        },
      },
    })
  } catch (e) {
    fail()
    return
  }

  success()
}

export async function downloadSongPlain(options: downloadSong.Options) {
  const {
    url,
    file,
    song,
    totalLength,
    retryTimeout,
    retryTimes,
    skipExists,
  } = options

  try {
    await dl({
      url,
      file,
      skipExists,
      retry: {
        timeout: retryTimeout,
        times: retryTimes,
        onerror: function(e, i) {
          console.log(
            `${symbols.warning} ${song.index}/${totalLength}  ${i +
              1}次失败 ${file}`
          )
        },
      },
    })
  } catch (e) {
    console.log(
      `${symbols.error} ${song.index}/${totalLength} 下载失败 ${file}`
    )
    console.error(e.stack || e)
    return
  }

  console.log(
    `${symbols.success} ${song.index}/${totalLength} 下载完成 ${file}`
  )
}

/**
 * check page type
 */

export function getType(url: string) {
  const item = _.find(types, item => url.indexOf(item.type) > -1)
  if (item) return item
  const msg = 'unsupported type'
  throw new Error(msg)
}

/**
 * get a adapter via `url`
 *
 * an adapter should have {
 *   getTitle($) => string
 *   getDetail($, url, quality) => [song, ...]
 * }
 */

export function getAdapter(url: string): BaseAdapter {
  const type = getType(url)
  const typeKey = type.type
  const Adapter = require('./adapter/' + typeKey).default
  return new Adapter()
}

/**
 * 获取title
 */

export function getTitle($: CheerioStatic, url: string) {
  const adapter = getAdapter(url)
  return adapter.getTitle($)
}

/**
 * 获取歌曲
 */

export async function getSongs($: CheerioStatic, url: string, quality: number) {
  const adapter = getAdapter(url)

  // 基本信息
  let songs = await adapter.getDetail($, url, quality)

  // 获取下载链接
  const ids = songs.map(s => s.id)
  let json = await getPlayurl(ids, quality) // 0-29有链接, max 30? 没有链接都是下线的
  json = json.filter(s => s.url) // remove 版权保护没有链接的

  // 移除版权限制在json中没有数据的歌曲
  const removed = []
  for (let song of songs) {
    const id = song.id
    const ajaxData = _.find(json, ['id', id])

    if (!ajaxData) {
      // 版权受限
      removed.push(song)
    } else {
      // we are ok
      song.ajaxData = ajaxData
    }
  }

  const removedIds = _.map(removed, 'id')
  songs = _.reject(songs, s => _.includes(removedIds, s.id))

  // 根据详细信息获取歌曲
  return adapter.getSongs(songs)
}

/**
 * 获取歌曲文件表示
 */
export function getFileName(options: getFileName.Options) {
  let {format, url, song, name} = options
  const typesItem = getType(url)

    // 从 type 中取值, 先替换 `长的`
  ;['typeText', 'type'].forEach(t => {
    const val = sanitize(String(typesItem[t]))
    format = format.replace(new RegExp(':' + t, 'ig'), val)
  })

  // 从 `song` 中取值
  ;['songName', 'singer', 'rawIndex', 'index', 'ext'].forEach(t => {
    // t -> token
    // rawIndex 为 number, sanitize(number) error
    const val = sanitize(String(song[t]))
    format = format.replace(new RegExp(':' + t, 'ig'), val)
  })

  // name
  format = format.replace(new RegExp(':name', 'ig'), sanitize(name))

  // djradio only
  if (typesItem.type === 'djradio') {
    const programDate = _.get(song, 'raw.programUi.date')
    if (programDate) {
      format = format.replace(new RegExp(':programDate'), sanitize(programDate))
    }

    const programOrder = _.get(song, 'raw.programUi.programOrder')
    if (programOrder) {
      format = format.replace(
        new RegExp(':programOrder'),
        sanitize(programOrder)
      )
    }
  }

  return format
}

export namespace getFileName {
  export interface Options {
    format: string
    song: TransformSong
    url: string

    // 专辑 or playlist 名称
    name: string
  }
}
