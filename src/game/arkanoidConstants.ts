export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

export enum BrickType {
  NORMAL = 1,
  ARMORED = 2,
  EXPLOSIVE = 3,
  PORTAL = 4,
}

export enum ElementType {
  NORMAL = 'normal',
  FIRE = 'fire',
  ICE = 'ice',
  LIGHTNING = 'lightning',
}

export interface PowerUp {
  id: string;
  type: 'laser' | 'expand' | 'multiball' | 'slow' | 'catch' | 'life';
  x: number;
  y: number;
  width: number;
  height: number;
  dy: number;
}
