export type MapArea = {
  id: string
  lines: string[]
  match: RegExp
  shape: string
  hit?: string
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  size?: number
}
export type HallMapPlan = { viewBox: string; widthClass: string; size: number; areas: MapArea[] }

export const hallMaps: Record<string, HallMapPlan> = {
  '251-north': {
    viewBox: '0 0 1311 1225', widthClass: 'min-w-[400px] max-w-[640px]', size: 44,
    areas: [
      { id: 'chefs-table', lines: ['Chef’s Table'], match: /chef['’]s table/i, shape: 'M10 214H630V410H10Z', x: 320, y: 330, anchor: 'middle' },
      { id: 'ciao', lines: ['Ciao'], match: /^ciao/i, shape: 'M630 270H909V718H630Z', x: 798, y: 590, anchor: 'middle' },
      { id: 'harvest', lines: ['Harvest Greens'], match: /^(harvest|soups)/i, shape: 'M10 722H909V915H10Z', x: 174, y: 785, anchor: 'start' },
      { id: 'smash', lines: ['Smash'], match: /^smash/i, shape: 'M958 10H1127V209H958Z', x: 1042, y: 132, anchor: 'middle' },
      { id: 'purple-zone', lines: ['Purple', 'Zone'], match: /^purple zone/i, shape: 'M1127 10H1297V209H1127Z', x: 1212, y: 110, anchor: 'middle' },
      { id: 'chillz', lines: ['251 Chillz'], match: /chillz/i, shape: 'M757 962H1097V1175H757Z', x: 905, y: 1090, anchor: 'middle' },
    ],
  },
  'south-campus': {
    viewBox: '0 0 1810 1555', widthClass: 'min-w-[560px] max-w-[720px]', size: 40,
    areas: [
      { id: 'purple-zone', lines: ['Purple', 'Zone'], match: /^purple zone/i, shape: 'M655 200H900V330H655Z', x: 875, y: 249, anchor: 'end' },
      { id: 'pizza', lines: ['Pizza'], match: /^pizza/i, shape: 'M655 330H900V475H655Z', x: 875, y: 417, anchor: 'end' },
      { id: 'pasta', lines: ['Pasta'], match: /^pasta/i, shape: 'M655 475H900V615H655Z', x: 875, y: 564, anchor: 'end' },
      { id: 'broiler-works', lines: ['Broiler', 'Works'], match: /^broiler ?works/i, shape: 'M655 615H900V723H655Z', x: 875, y: 660, anchor: 'end' },
      { id: 'grill-works', lines: ['Grill', 'Works'], match: /^grill works/i, shape: 'M655 723H900V852H655Z', x: 875, y: 783, anchor: 'end' },
      { id: 'chefs-table', lines: ['Chef’s', 'Table'], match: /^chef['’]s table/i, shape: 'M655 852H900V988H655Z', x: 875, y: 912, anchor: 'end' },
      { id: 'roaster', lines: ['Roaster'], match: /^roaster/i, shape: 'M655 988H900V1100H655Z', x: 875, y: 1053, anchor: 'end' },
      { id: 'treats', lines: ['Treats'], match: /^treats/i, shape: 'M275 595H530V735H275Z', x: 290, y: 662, anchor: 'start' },
      { id: 'deli-plus', lines: ['Deli+'], match: /^deli\+/i, shape: 'M275 735H530V865H275Z', x: 290, y: 803, anchor: 'start' },
      { id: 'deli', lines: ['Deli'], match: /^deli\b/i, shape: 'M275 865H530V978H275Z', x: 290, y: 931, anchor: 'start' },
      { id: 'waffles', lines: ['Waffles'], match: /^(waffle|doughnut|bagel bar)/i, shape: 'M419 405H545V478H419Z', x: 482, y: 452, anchor: 'middle', size: 28 },
      { id: 'salad-bar', lines: ['Salad', 'Bar'], match: /^(salad bar|soup)/i, shape: 'M535 845H653V1220H535Z', x: 594, y: 1043, anchor: 'middle', size: 32 },
      { id: 'desserts', lines: ['Desserts'], match: /desserts/i, shape: 'M790 1200H920V1330H790Z', x: 862, y: 1272, anchor: 'middle', size: 26 },
      { id: 'mongolian-grill', lines: ['Mongolian', 'Grill'], match: /^mongolian/i, shape: 'M1026 11H1272V311H1026Z', x: 1065, y: 134, anchor: 'start', size: 34 },
      { id: 'roma', lines: ['Roma Salads', '& Paninis'], match: /^roma/i, shape: 'M1026 311H1286V587H1026Z', x: 1063, y: 432, anchor: 'start', size: 34 },
    ],
  },
  yahentamitsi: {
    viewBox: '262 247 1452 915', widthClass: 'min-w-[720px]', size: 26,
    areas: [
      { id: 'center-station', lines: ['Center', 'Station'], match: /^(terp comfort|al forno)/i, shape: 'M481 492H627V517L703 590V682H601V593H481Z', x: 554, y: 540, anchor: 'middle' },
      { id: 'sprouts', lines: ['Sprouts'], match: /^sprouts/i, shape: 'M368 667H388V585H462V598L455 616V726H368Z', x: 376, y: 700, anchor: 'start' },
      { id: 'gluten-free', lines: ['Gluten', 'Free'], match: /^good food/i, shape: 'M368 726H455V818H405V824H368Z', x: 376, y: 760, anchor: 'start', size: 24 },
      { id: 'chefs-corner', lines: ['Chef’s', 'Corner'], match: /^(chef['’]s corner|terp latin)/i, shape: 'M742 586H853V672H800L742 626Z', hit: 'M720 586H853V706H720Z', x: 845, y: 620, anchor: 'end' },
      { id: 'mezza', lines: ['Mezza'], match: /^mezza/i, shape: 'M574 766H727V919H574Z', x: 651, y: 852, anchor: 'middle' },
      { id: 'salad-bar', lines: ['Salad Bar'], match: /^salad bar/i, shape: 'M936 815H1191V875H1112V880H1023V875H936Z', hit: 'M930 815H1200V945H930Z', x: 1068, y: 857, anchor: 'middle' },
      { id: 'md-bakery', lines: ['MD Bakery'], match: /^maryland bakery/i, shape: 'M833 999H1005V1057H833Z', hit: 'M825 985H1015V1057H825Z', x: 919, y: 1036, anchor: 'middle' },
      { id: 'joes-grill', lines: ['Joe’s Grill'], match: /^joe['’]s grill/i, shape: 'M1414 259H1596V311H1584V386L1573 397H1426L1415 386V311H1414Z', hit: 'M1400 259H1610V419H1400Z', x: 1500, y: 345, anchor: 'middle' },
      { id: 'woks', lines: ['Woks'], match: /^woks/i, shape: 'M1344 443H1428V650L1413 665H1344Z', hit: 'M1344 443H1464V665H1344Z', x: 1386, y: 560, anchor: 'middle' },
      { id: 'breakfast-grill', lines: ['Breakfast', 'Grill'], match: /^breakfast/i, shape: 'M1421 859H1483V874H1506V859H1553V874H1559V956L1544 972H1433L1417 956V874H1421Z', x: 1488, y: 920, anchor: 'middle' },
    ],
  },
}

export function mapTargets(slug: string, stations: string[]): { areas: Map<string, number>; others: number[] } {
  const areas = new Map<string, number>()
  const others: number[] = []
  const plan = hallMaps[slug]
  stations.forEach((station, index) => {
    const area = plan?.areas.find(area => area.match.test(station))
    if (!area) others.push(index)
    else if (!areas.has(area.id)) areas.set(area.id, index)
  })
  return { areas, others }
}
