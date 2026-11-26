import {artPath} from './artLoader';
export function coverArt(img:HTMLImageElement){
    img.alt='滑铁卢田野上的英法线列步兵与骑兵';img.src=artPath('cover_1815');
    img.onerror=()=>{img.style.visibility='hidden';};
}
