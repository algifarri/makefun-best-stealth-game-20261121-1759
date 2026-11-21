// Ember Heist: tuning constants and the three level maps.
// One tile is 40 px; every map is 28 columns by 17 rows, ringed by walls.
// Legend: '#' wall · '.' floor · 'C' crate (solid, blocks sight) · 'B' bush
// (walkable, hides you, blocks sight) · 'L' lamp (floor + a pool of light)
// · 'S' start · 'E' exit · '*' ember shard · 'G' guard spawn.
export const TILE = 40;
export const COLS = 28;
export const ROWS = 17;
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const HUD_HEIGHT = 64;
export const FIELD_X = 80;
export const FIELD_Y = 92;

export const PLAYER_SPEED = 152;
export const PLAYER_SNEAK_SPEED = 86;
export const PLAYER_RADIUS = 13;
export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 108;
export const GUARD_RADIUS = 14;
export const GUARD_FOV = (Math.PI * 76) / 180;
export const GUARD_RANGE = 235;
export const CATCH_RADIUS = 21;
export const PEBBLE_RANGE = 290;
export const PEBBLE_THROW_SPEED = 420;
export const LIVES = 3;
export const STEP_SECONDS = 1 / 60;

export const LEVELS = [
  {
    name: 'The Quiet Gallery',
    intro: 'Lift the 3 ember shards, then slip out the teal door — unseen.',
    map: [
      '############################',
      '#..........................#',
      '#.S....C.......B.....*.....#',
      '#..........................#',
      '#..###.....C.....###.......#',
      '#..........................#',
      '#....B......*......B.......#',
      '#..........................#',
      '#..###......C....###...C...#',
      '#..........................#',
      '#......C.......B.......*...#',
      '#..........................#',
      '#..###......C....###.......#',
      '#..........................#',
      '#....B.............C....E..#',
      '#..........................#',
      '############################',
    ],
    lamps: [
      { x: 8, y: 3 },
      { x: 20, y: 8 },
      { x: 8, y: 13 },
    ],
    guards: [
      { waypoints: [{ x: 4, y: 3 }, { x: 23, y: 3 }], pause: 1.4 },
      { waypoints: [{ x: 20, y: 2 }, { x: 20, y: 14 }], pause: 1.1 },
    ],
  },
  {
    name: 'The Lantern Court',
    intro: 'Four shards now, and three lantern-wardens on the floor.',
    map: [
      '############################',
      '#..........................#',
      '#.S....C....B.....*....C...#',
      '#..........................#',
      '#..###......C.....###......#',
      '#......B...................#',
      '#....*.......###......B....#',
      '#..........................#',
      '#..C.....###.....C.....###.#',
      '#..........................#',
      '#......B......*.......C....#',
      '#..........................#',
      '#..###.....C......###......#',
      '#..........B..........*....#',
      '#....C..........###....E...#',
      '#..........................#',
      '############################',
    ],
    lamps: [
      { x: 6, y: 6 },
      { x: 14, y: 3 },
      { x: 22, y: 10 },
      { x: 10, y: 14 },
    ],
    guards: [
      { waypoints: [{ x: 3, y: 3 }, { x: 24, y: 3 }], pause: 1.2 },
      { waypoints: [{ x: 21, y: 5 }, { x: 21, y: 13 }], pause: 1.0 },
      { waypoints: [{ x: 6, y: 13 }, { x: 16, y: 13 }], pause: 1.5 },
    ],
  },
  {
    name: 'The Ember Vault',
    intro: 'The vault itself. Five shards, four wardens, nowhere to dawdle.',
    map: [
      '############################',
      '#..........................#',
      '#.S....C.....B......*......#',
      '#..........................#',
      '#..###.....C......###*..C..#',
      '#......B...................#',
      '#....*......###......B.....#',
      '#..........................#',
      '#..C....###......C....###..#',
      '#..........................#',
      '#.......B......*.......C...#',
      '#..........................#',
      '#..###.....C......###......#',
      '#...........B.........*....#',
      '#....C.........###.....E...#',
      '#..........................#',
      '############################',
    ],
    lamps: [
      { x: 5, y: 6 },
      { x: 13, y: 3 },
      { x: 21, y: 8 },
      { x: 9, y: 13 },
      { x: 18, y: 14 },
    ],
    guards: [
      { waypoints: [{ x: 3, y: 3 }, { x: 24, y: 3 }], pause: 1.0 },
      { waypoints: [{ x: 21, y: 5 }, { x: 21, y: 13 }], pause: 1.0 },
      { waypoints: [{ x: 4, y: 13 }, { x: 14, y: 13 }], pause: 1.3 },
      { waypoints: [{ x: 16, y: 6 }, { x: 16, y: 11 }], pause: 0.9 },
    ],
  },
];
