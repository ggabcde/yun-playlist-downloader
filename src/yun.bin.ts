#!/usr/bin/env node

import 'log-reject-error/register'
import path from 'path'
import cheerio from 'cheerio'
import pmap from 'promise.map'
import Debug from 'debug'
import humanizeDuration from 'humanize-duration'
import _ from 'lodash'
import yargs from 'yargs'
import ms from 'ms'
import {getHtml, normalizeUrl} from './util'
import {getTitle, getSongs, getFileName, downloadSong} from './index'
import {version as pkgVersion} from '../package.json'

const debug = Debug('yun:cli')

let DEFAULT_FORMAT = ':name/:singer - :songName.:ext'
if (process.argv.some(s => s.match(/djradio/))) {
  // e.g
  // https://music.163.com/#/program?id=2064329279
  // 等什么君/2019-11-27 - 第56期 - 琴师(Cover:音频怪物)
  DEFAULT_FORMAT = ':name/:programDate 第:programOrder期 - :songName.:ext'
}

interface CurrentArgv {
  url: string
  concurrency: number
  format: string
  quality: number
  retryTimeout: number
  retryTimes: number
  skipExists: boolean
  progress: boolean
}

// get config
const config = require('rc')('yun', {
  'concurrency': 5,
  'format': DEFAULT_FORMAT,
  'quality': 320,
  'retry-timeout': 3, // 3 mins
  'retry-times': 3, // 3 times
  'skip-exists': true,
  'progress': true,
})

let argv = (yargs as yargs.Argv<CurrentArgv>).command(
  '$0 <url>',
  '网易云音乐 歌单/专辑 下载器',
  // builder
  yargs => {
    return yargs
      .usage('Usage: $0 <url> [options]')
      .positional('url', {describe: '歌单/专辑的链接', type: 'string'})
      .alias({
        h: 'help',
        v: 'version',
        c: 'concurrency',
        f: 'format',
        q: 'quality',
        s: 'skip-exists',
        p: 'progress',
      })
      .option({
        'concurrency': {
          desc: '同时下载数量',
          type: 'number',
          default: 5,
        },

        'format': {
          desc: '文件格式',
          type: 'string',
          default: DEFAULT_FORMAT,
        },

        'quality': {
          desc: '音质',
          type: 'number',
          default: 320,
          choices: [128, 192, 320],
        },

        'retry-timeout': {
          desc: '下载超时(分)',
          type: 'number',
          default: 3,
        },

        'retry-times': {
          desc: '下载重试次数',
          type: 'number',
          default: 3,
        },

        'skip-exists': {
          desc: '对于已存在文件且大小合适则跳过',
          type: 'boolean',
          default: true,
        },

        'progress': {
          desc: '是否显示进度条',
          type: 'boolean',
          default: true,
        },
      })
      .config(config)
      .example('$0 -c 10 <url>', '10首同时下载')
      .example(
        'yun -f ":singer - :songName.:ext" <url>',
        '下载格式为 "歌手 - 歌名"'
      )
      .epilog(
        '帮助 & 文档: https://github.com/magicdawn/yun-playlist-downloader'
      )
  }
).argv

// url
let {
  url,
  concurrency,
  format,
  quality,
  retryTimeout,
  retryTimes,
  skipExists,
  progress,
} = argv

// 打印
console.log(`
当前参数
concurrency:    ${concurrency}
format:         ${format}
retry-timeout:  ${retryTimeout} (分钟)
retry-times:    ${retryTimes} (次)
quality:        ${quality}
skip-exists:    ${skipExists}
progress:       ${progress}
`)

// process argv
quality *= 1000
retryTimeout = ms(`${retryTimeout} minutes`)

async function main() {
  url = normalizeUrl(url)
  const html = await getHtml(url)
  const $ = cheerio.load(html, {
    decodeEntities: false,
  })

  // 基本信息
  const name = getTitle($, url)
  const songs = await getSongs($, url, quality)
  debug('songs : %j', songs)
  const start = Date.now()
  console.log(`正在下载『${name}』,请稍候...`)

  // FIXME
  // process.exit()

  // 开始下载
  await pmap(
    songs,
    song => {
      // 根据格式获取所需文件名
      const file = getFileName({
        format,
        song,
        url,
        name,
      })

      // 下载
      return downloadSong({
        url: song.url,
        file,
        song,
        totalLength: songs.length,
        retryTimeout,
        retryTimes,
        skipExists,
        progress,
      })
    },
    concurrency
  )

  await new Promise(r => {
    process.nextTick(r)
  })

  const dur = humanizeDuration(Date.now() - start, {language: 'zh_CN'})
  console.log('下载完成, 耗时%s', dur)
}

main()
