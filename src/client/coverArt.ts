import { artPath } from './artLoader';

export function coverArt(img: HTMLImageElement) {
    img.alt = '拿破仑与威灵顿的骑兵、军旗和线列步兵在滑铁卢田野隔烟相望';
    img.style.imageRendering = 'pixelated';
    img.style.objectFit = 'cover';
    img.src = artPath('px_cover_1815');
}
