import BaseAdapter from './base'

export default class AlbumAdapter extends BaseAdapter {
  type = 'album'

  getTitle($: CheerioSelector): string {
    return $('h2.f-ff2').text()
  }
}