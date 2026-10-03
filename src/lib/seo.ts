export const SITE_URL = 'https://terpsdining.vercel.app'

export type PageSeo = {
  title: string
  description: string
  canonical: string
  robots: string
  image: string
  imageAlt: string
}

const DEFAULT_IMAGE = `${SITE_URL}/social.png`
const DEFAULT_IMAGE_ALT = 'TerpsDining — University of Maryland dining menus and hours'
const SITE_TITLE = 'TerpsDining'
const HOME_DESCRIPTION = 'Explore University of Maryland dining hall menus, hours, nutrition, and today’s food options with TerpsDining.'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

function escapeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

export function getPageSeo(pathname: string, title?: string): PageSeo {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
  let pageTitle: string
  let description: string
  let robots = 'index,follow'
  let canonicalPath = path
  if ((/^\/(?:halls|items)\/[^/]+$/.test(path)) && title?.trim() === 'Not found') {
    pageTitle = 'Page Not Found'
    description = 'Find University of Maryland dining hall menus, hours, and food information with TerpsDining.'
    robots = 'noindex,follow'
  } else if (path === '/') {
    pageTitle = 'University of Maryland Dining Menus & Hours'
    description = HOME_DESCRIPTION
  } else if (path === '/search') {
    pageTitle = 'Search Dining Menus'
    description = 'Search University of Maryland dining hall menus and food information on TerpsDining.'
    robots = 'noindex,follow'
  } else if (path === '/hours') {
    pageTitle = 'Dining Hall Hours'
    description = 'View University of Maryland dining hall hours for breakfast, lunch, and dinner.'
  } else if (path === '/privacy') {
    pageTitle = 'Privacy Policy'
    description = 'Read the TerpsDining privacy policy and learn how account and service information is handled.'
  } else if (path === '/terms') {
    pageTitle = 'Terms of Use'
    description = 'Read the terms for using TerpsDining dining information, menus, hours, and nutrition details.'
  } else if (path === '/item-shell') {
    pageTitle = title?.trim() || 'Dining Menu Item'
    description = 'View nutrition details and serving availability for University of Maryland dining hall menu items.'
    robots = 'noindex,follow'
    canonicalPath = ''
  } else if (/^\/halls\/[^/]+$/.test(path)) {
    const hall = title?.trim() || 'Dining Hall'
    pageTitle = `${hall} Dining Hall Menu & Hours`
    description = `Explore ${hall} dining hall menus, meal availability, and hours at the University of Maryland.`
  } else if (/^\/items\/[^/]+$/.test(path)) {
    const item = title?.trim() || 'Dining Menu Item'
    pageTitle = `${item} Nutrition & Availability`
    description = `View nutrition details, dietary and allergen information, and serving availability for ${item} at University of Maryland dining halls.`
  } else {
    pageTitle = title?.trim() || 'Page Not Found'
    description = 'Find University of Maryland dining hall menus, hours, and food information with TerpsDining.'
    robots = 'noindex,follow'
  }

  const fullTitle = `${pageTitle} · ${SITE_TITLE}`
  return {
    title: fullTitle,
    description,
    canonical: canonicalPath ? `${SITE_URL}${canonicalPath}` : '',
    robots,
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  }
}

export function renderSeoJsonLd(): string {
  return escapeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_TITLE,
    url: `${SITE_URL}/`,
    description: HOME_DESCRIPTION,
  })
}

export function renderSeoHead(seo: PageSeo): string {
  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}">`,
    `<meta name="robots" content="${escapeHtml(seo.robots)}">`,
    seo.canonical ? `<link rel="canonical" href="${escapeHtml(seo.canonical)}">` : '',
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${SITE_TITLE}">`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
    `<meta property="og:url" content="${escapeHtml(seo.canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(seo.image)}">`,
    `<meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(seo.image)}">`,
    `<meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}">`,
    `<script type="application/ld+json">${renderSeoJsonLd()}</script>`,
  ].join('\n')
}
