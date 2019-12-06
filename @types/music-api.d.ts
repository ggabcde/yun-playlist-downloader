declare module '@magicdawn/music-api' {
  export interface AlbumDetail {
    songs: any[]
  }
  export function getAlbum(
    vendor: 'netease',
    options: {
      id: string
      raw?: boolean
    }
  ): Promise<AlbumDetail>

  export interface PlaylistDetail {
    playlist: {
      tracks: any[]
    }
  }
  export function getPlaylist(
    vendor: 'netease',
    options: {
      id: string
      raw?: boolean
    }
  ): Promise<PlaylistDetail>
}

declare module '@magicdawn/music-api/src/crypto' {
  export function aesRsaEncrypt(
    input: string
  ): {params: string; encSecKey: string}
}
