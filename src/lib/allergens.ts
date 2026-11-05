export type IngredientPart = { text: string; allergen: boolean }

const ALLERGEN_WORDS = [
  // milk
  'milk', 'buttermilk', 'butter', 'cream', 'cheese', 'cheeses', 'whey', 'casein', 'caseinate', 'yogurt', 'yoghurt', 'lactose', 'ghee', 'dairy',
  // egg
  'egg', 'eggs',
  // fish
  'fish', 'anchovy', 'anchovies', 'salmon', 'tuna', 'cod', 'tilapia', 'pollock', 'catfish',
  // shellfish
  'shellfish', 'shrimp', 'crab', 'lobster', 'clam', 'clams', 'mussel', 'mussels', 'oyster', 'oysters', 'scallop', 'scallops', 'prawn', 'prawns', 'crawfish',
  // peanut
  'peanut', 'peanuts',
  // tree nuts
  'nut', 'nuts', 'almond', 'almonds', 'cashew', 'cashews', 'pecan', 'pecans', 'walnut', 'walnuts', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'macadamia',
  // gluten cereals
  'wheat', 'gluten', 'barley', 'rye', 'oat', 'oats', 'spelt', 'semolina', 'durum',
  // soy
  'soy', 'soya', 'soybean', 'soybeans', 'tofu', 'edamame', 'tamari', 'miso',
  // sesame
  'sesame', 'tahini',
]

const NOT_ALLERGEN_PHRASES = ['coconut milk', 'coconut cream', 'cocoa butter']

const PATTERN = new RegExp(
  `\\b(${NOT_ALLERGEN_PHRASES.map(p => p.replace(' ', '\\s+')).join('|')})\\b|\\b(?:${ALLERGEN_WORDS.join('|')})\\b(?![\\s-]*free\\b)`,
  'gi',
)

/** Splits ingredient text into plain and allergen parts; joining all `text` values recreates the input. */
export function markAllergens(text: string): IngredientPart[] {
  const parts: IngredientPart[] = []
  let last = 0
  for (const match of text.matchAll(PATTERN)) {
    if (match[1]) continue
    if (match.index > last) parts.push({ text: text.slice(last, match.index), allergen: false })
    parts.push({ text: match[0], allergen: true })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), allergen: false })
  return parts
}
