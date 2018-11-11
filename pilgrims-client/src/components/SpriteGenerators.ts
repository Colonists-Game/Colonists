import { Sprite } from 'pixi.js';

import { Tile } from '../../../pilgrims-shared/dist/Shared';

export function generateSprites(): { [s: string]: () => Sprite } {
  const tilePath = './img/tilesets/';
  const tileStyle = 'realistic';

  const sprites = {
    Clay: () => Sprite.fromImage(`${tilePath}${tileStyle}/clay.png`),
    Desert: () => Sprite.fromImage(`${tilePath}${tileStyle}/desert.png`),
    Grain: () => Sprite.fromImage(`${tilePath}${tileStyle}/grain.png`),
    Wood: () => Sprite.fromImage(`${tilePath}${tileStyle}/wood.png`),
    Stone: () => Sprite.fromImage(`${tilePath}${tileStyle}/stone.png`),
    Wool: () => Sprite.fromImage(`${tilePath}${tileStyle}/wool.png`),
    Ocean: () => Sprite.fromImage(`${tilePath}${tileStyle}/ocean.png`),
    House: () => Sprite.fromImage(`./img/pieces/house.png`),
    City: () => Sprite.fromImage(`./img/pieces/city.png`),
    2: () => Sprite.fromImage(`./img/numbers/2.png`),
    3: () => Sprite.fromImage(`./img/numbers/3.png`),
    4: () => Sprite.fromImage(`./img/numbers/4.png`),
    5: () => Sprite.fromImage(`./img/numbers/5.png`),
    6: () => Sprite.fromImage(`./img/numbers/6.png`),
    8: () => Sprite.fromImage(`./img/numbers/8.png`),
    9: () => Sprite.fromImage(`./img/numbers/9.png`),
    10: () => Sprite.fromImage(`./img/numbers/10.png`),
    11: () => Sprite.fromImage(`./img/numbers/11.png`),
    12: () => Sprite.fromImage(`./img/numbers/12.png`),
  };
  return sprites;
}

export function generateTile(
  tileWidth,
  tileHeight,
  tile: Tile,
  corner,
  lineWidth,
) {
  const generator = generateSprites()[tile.type.toString()];
  const s = generator();
  s.width = tileWidth;
  s.height = tileHeight;
  s.position.x = corner.x - tileWidth - lineWidth / 2;
  s.position.y = corner.y - tileHeight / 2;
  return s;
}

export function generateTileNumber(tileWidth, center, origin, tile: Tile) {
  if (tile.diceRoll === 'None') {
    return undefined;
  }
  const generator = generateSprites()[tile.diceRoll.toString()];
  const s = generator();
  s.width = tileWidth / 4;
  s.height = s.width;
  s.anchor.x = 0.5;
  s.anchor.y = 0.5;
  s.position.x = center.x + origin.x;
  s.position.y = center.y + origin.y;
  return s;
}