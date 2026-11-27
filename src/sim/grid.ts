import { WIDTH, HEIGHT } from './maps';
export function insideMeadow(x: number, y: number) {
    return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
}
