// The three jobs of a HUSHLINE night, as data. Map legend, one character a 40px tile:
//   #  wall          c  crate (solid, blocks sight, hides you behind it)
//   .  floor         :  shadow (safe cover: guards and cameras only spot you up close)
//   P  thief start   $  the loot target         X  the getaway hatch
// Guards walk their `route` (tile coordinates) in a loop; cameras sweep `sweep` radians either
// side of `angle` at `speed` radians a second; lasers run between two wall points, live for
// `on` seconds then dark for `off`; vents join two floor tiles [ax, ay, bx, by] by a crawlway.
// Each stage has two or more routes to the loot.

export const STAGES = [
  {
    id: 'annex',
    name: 'Orchid Annex',
    brief: 'A sleepy gallery wing. One night watchman, one camera on the vault door.',
    loot: { name: 'Moth Orchid Brooch', value: 1200 },
    par: 70,
    kit: { coin: 3, smoke: 1, jammer: 1 },
    map: [
      '########################',
      '#P.....#.......:::.....#',
      '#......#..cc...:::..cc.#',
      '#::....#..cc...........#',
      '#::.........#######....#',
      '#......#....#.....:....#',
      '####.###....#..$..#::..#',
      '#......#....#.....#::..#',
      '#.cc...#....###.###....#',
      '#.cc.......:::.........#',
      '#::....#...:::....cc...X',
      '#::....#..........cc...#',
      '########################',
    ],
    guards: [
      { route: [[9, 2], [9, 9], [21, 9], [21, 2]] },
    ],
    cameras: [
      { x: 15.5, y: 9.05, angle: Math.PI / 2, sweep: 0.85, speed: 0.7 },
    ],
    vents: [[5, 11, 20, 5]],
  },
  {
    id: 'bonded',
    name: 'Copperline Bonded Store',
    brief: 'Two guards on crossing beats and two cameras. The shadows by the crates are your friends.',
    loot: { name: 'Copperline Bearer Bonds', value: 2600 },
    par: 95,
    kit: { coin: 3, smoke: 1, jammer: 1 },
    map: [
      '########################',
      '#P..:::....#.........::#',
      '#...:::....#..cc..cc.::#',
      '#..........#...........#',
      '###..###...#...####.####',
      '#......#.......#.$#....#',
      '#.cc...#..cc...#..#....#',
      '#.cc...#..cc.......::..#',
      '#......####....######..#',
      '#::.........:::........#',
      '#::..cc.....:::..cc....X',
      '#....cc................#',
      '########################',
    ],
    guards: [
      { route: [[13, 3], [13, 7], [9, 7], [13, 7], [13, 3], [21, 3]] },
      { route: [[3, 9], [10, 9], [10, 11], [20, 11], [20, 7], [20, 11], [10, 11]] },
    ],
    cameras: [
      { x: 16.95, y: 7.5, angle: Math.PI, sweep: 0.7, speed: 0.55 },
      { x: 7.5, y: 8.95, angle: Math.PI / 2, sweep: 0.9, speed: 0.8 },
    ],
    lasers: [
      { from: [21, 8.5], to: [23, 8.5], on: 2.4, off: 1.8 },
    ],
    vents: [[1, 5, 21, 5]],
  },
  {
    id: 'atrium',
    name: 'The Lantern Atrium',
    brief: 'The penthouse. Three guards, three cameras, and the Lantern Opal under glass. Plan first.',
    loot: { name: 'The Lantern Opal', value: 4800 },
    par: 120,
    kit: { coin: 4, smoke: 2, jammer: 1 },
    map: [
      '########################',
      '#P.:::.......#.......::#',
      '#..:::..cc...#..cc...::#',
      '#.......cc.......cc....#',
      '#####.######..######.###',
      '#::.....#..........#...#',
      '#::.....#..######..#.$.#',
      '#.......#..#::::#..#...#',
      '#..cc.......::::.......#',
      '#..cc...#..######..#####',
      '#.......#..........::..X',
      '#::.....#....cc....::..#',
      '########################',
    ],
    guards: [
      { route: [[2, 3], [11, 3], [11, 1], [18, 1], [18, 3], [11, 3]] },
      { route: [[9, 5], [18, 5], [18, 10], [9, 10]] },
      { route: [[2, 5], [6, 5], [6, 11], [2, 11], [2, 8], [10, 8], [2, 8]] },
    ],
    cameras: [
      { x: 13.5, y: 4.05, angle: Math.PI / 2, sweep: 0.75, speed: 0.6 },
      { x: 19.95, y: 6.5, angle: Math.PI, sweep: 0.55, speed: 0.5 },
      { x: 22.95, y: 8.5, angle: Math.PI, sweep: 0.8, speed: 0.75 },
    ],
    lasers: [
      { from: [21.5, 10], to: [21.5, 12], on: 2.0, off: 1.6 },
      { from: [11.5, 10], to: [11.5, 12], on: 1.8, off: 2.2, phase: 1.0 },
    ],
    vents: [[19, 1, 14, 7]],
  },
];
