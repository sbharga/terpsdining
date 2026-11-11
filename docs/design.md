# Design system

The rules for every screen in TerpsDining. Build UI from the primitives in `src/components/UI.tsx` and the recipes in `src/lib/theme.ts`. `bun run lint` (`scripts/check-design.ts`) enforces part of it: no raw palette classes and no arbitrary color values outside `src/lib/theme.ts` and `src/lib/database.types.ts`, and no off-scale radii.

## Principles

- **Mobile first.** Design at 360px wide; body text never drops below 320px. Nothing scrolls horizontally.
- **Warm and colorful, with a system.** The canvas is warm and neutral; color adds personality through one shared palette (`tones` in `src/lib/theme.ts`), plus status colors. Every color has a defined place, and none is picked ad hoc.
- **One way to do each thing.** Use the shared primitives. Do not hand-write button, card, or heading classes.
- **Accessible by default.** WCAG AA contrast, 44px touch targets, visible focus, semantic controls.

## Color

Tokens are defined in `src/index.css` and exposed to Tailwind as `bg-canvas`, `text-ink`, `bg-brand`, and so on.

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `canvas` | `#fffaf3` | `#14100e` | Page background |
| `surface` | `#ffffff` | `#1f1a17` | Cards, menus, inputs |
| `surface-2` | `#f6efe6` | `#2a2420` | Tiles, hover fills, meal switcher track |
| `ink` | `#1c1917` | `#f5efe8` | Primary text |
| `muted` | `#6b625a` | `#a8a29e` | Secondary text, icons |
| `line` | `#ece3d8` | `#3a322c` | Card rings, dividers, outline borders |
| `brand` | `#d63a1a` | `#ff7a5c` | Primary actions, links, single-select selection |
| `brand-ink` | `#ffffff` | `#1a1412` | Text on `brand` |
| `brand-soft` | 10% brand over surface | 10% brand over surface | Pressed toggle chips, active filter fills |
| `success` | `#007a55` | `#5ee9b5` | Open, served today, "now" |
| `success-soft` | 10% success over surface | 10% success over surface | Open-row fill, high rating pill |
| `warning` | `#973c00` | `#ffd230` | Rating 3 to under 4 |
| `warning-soft` | 10% warning over surface | 10% warning over surface | Mid rating pill |
| `danger` | `#c10007` | `#ffa2a2` | Errors, destructive actions, avoided allergens, rating under 3 |
| `danger-soft` | 10% danger over surface | 10% danger over surface | Error panels, avoided chips, low rating pill |
| `star` | `#fe9a00` | `#ffb900` | Filled rating stars |

Soft tokens are declared once in `:root` as `color-mix(in oklab, var(--x) 10%, var(--surface))`, so they follow the dark overrides automatically.

Usage rules:

- **Brand** is for primary actions, links, and single-select state: the selected day, the current page, and the selected recipe on an item page. A pressed toggle chip with no tone uses `bg-brand-soft` with `border-brand`.
- **Tones** are the shared accent palette in `theme.ts`: `tomato`, `citrus`, `lime`, `mint`, `sky`, `grape`, `berry`. Each has `solid` (white text), `soft` (tinted fill with text), `text`, `dot`, and `border` classes. Take them from `tones`, `hallTone()`, `mealTones`, `dietTone()`, or `nameTone()`. Never write a tone by hand.
- **Hall identity** comes from `hallTone(slug)`: `solid` for the hero and board bands, `soft` for hall chips, `dot` for history rows, `text` for the hall hours heading icon. Current hall tones: South Campus `citrus` (`amber-700`), Yahentamitsi `lime` (`lime-700`), 251 North `berry` (`fuchsia-700`), fallback `sky`.
- **Meals** use `mealTones`: Breakfast `citrus`, Lunch `sky`, Dinner `grape`. `MealIcon` takes its color from them, and the selected meal tab is that meal's `solid` with white text.
- **Diet** badges and diet filter chips use `dietTone(tag)`: vegan `lime`, vegetarian `mint`, halal `sky`.
- **Section icons** pick a tone by meaning: favorites `berry` (the favorite heart is also `berry`), ratings and top rated `citrus`, nutrition `lime`, history `grape`, calories `tomato`, protein `berry`, carbs `sky`, fat `citrus`, delete `tomato`.
- **Stations and food swatches.** Station heading dots, `FoodSwatch`, and `Avatar` use `nameTone(name)`, a stable hash of the name, so the same name always gets the same color.
- **Status** uses `success` (open, served today, now; also the green dot on the recipe switcher for the recipe served today), `warning` (rating 3 to under 4), and `danger` (errors, destructive actions, avoided allergens, rating under 3). `StatusPill` colors come from `statusStyle`.
- **Star** is reserved for rating glyphs.
- **Icons** are `text-muted` unless they take a tone from the rules above.
- Raw Tailwind palette classes (for example `bg-emerald-500`) are banned outside `src/lib/theme.ts`. `bun run lint` fails on them, as it does on arbitrary color values such as `bg-[#abc]`. Add a tone or token in `theme.ts` or `src/index.css` instead.
- **Contrast.** Text is at least 4.5:1 against its background. Large text (18.66px bold or 24px and up) and UI component boundaries are at least 3:1. Every `solid` tone is at least 4.5:1 with white text; `citrus` uses `amber-700` (5.05:1), not `amber-600` (3.19:1). Verified pairs: `success` on `success-soft` 4.68:1, `warning` on `warning-soft` 6.09:1, `danger` on `danger-soft` 5.53:1; all soft pairs exceed 7:1 in dark mode. `brand` on `canvas` is 4.51:1 in light and 7.38:1 in dark. `muted` is 5.74:1 in light and 7.5:1 in dark.

## Typography

- **Bricolage** (`font-display`) is used for h1, h2, hall names, and stat values. **Inter** (`font-sans`) is used everywhere else.
- h1: `titleClass` (`font-display text-3xl font-extrabold tracking-tight sm:text-4xl`), rendered by `PageHeader`.
- h2: `SectionHeading` (`font-display text-xl font-bold`).
- List titles: `font-semibold leading-snug`.
- Body: `text-base`. Secondary text: `text-sm text-muted`.
- Overline labels: `overlineClass` (`text-xs font-semibold uppercase tracking-wider text-muted`).
- Minimum size is `text-xs`, used for overlines, stat labels, badges, pills, counts, and short inline status text.
- Numbers (times, nutrition, counts) use `tabular-nums`.
- Copy is sentence case. Ranges use an en dash (`9–11 a.m.`). Separators are `·`. Truncation is `…`, not `...`.

## Layout and spacing

- Page container: `max-w-5xl px-safe`. Prose pages: `max-w-3xl`.
- Page header: `PageHeader` with `mb-8` below.
- Heading to content: `mt-4`.
- Between cards and after control rows: `mt-6`, `gap-6`, or `space-y-6`.
- Between page sections: `mt-10`.
- Card padding: `p-5 sm:p-6`. Dense panels: `p-4`. Pickers: `p-3`.
- Grids: dish lists go 1 column, then `lg:2`. Hall boards go 1 column, then `lg:3`. The item page uses `lg:3`.
- Sticky header height is `h-14`. Sticky sub-bars sit at `top-14`. Station anchors use `scroll-mt-36`.
- Safe areas: use `px-safe` on horizontal containers and `pb-safe` on bottom-pinned bars. Never hard-code the inset.

## Shape and elevation

- `rounded-full`: controls, pills, chips, avatars, icon buttons.
- `rounded-3xl`: cards, lists, heroes, the picker card.
- `rounded-2xl`: media, tiles, popovers, alerts.
- `rounded-xl`: only inside a `rounded-2xl` popover (menu items).
- Other radii (`rounded`, `rounded-sm`, `rounded-md`, `rounded-lg`) are not used.
- Cards are flat: `cardClass` is `rounded-3xl bg-surface ring-1 ring-line`.
- Shadows are used only on floating UI (menus), the selected meal tab and `StatusPill` (`shadow-sm`), and `FoodSwatch` letters (`drop-shadow-sm`). Do not add shadows to cards.

## Touch and interaction

- Every interactive target is at least 44×44px. Use `h-11` or `w-11`, or a smaller visual with the `hit` utility (`h-9 w-9` plus `hit`) to extend the hit area. Do not combine `hit` with `after:` utilities.
- Inline links inside running text are exempt from the size rule.
- Inputs use `text-base` (16px) below `sm`, so iOS does not zoom.
- Focus is shown by the global `:focus-visible` outline. Never remove it.
- Toggle chips use `aria-pressed`. Disclosures use `aria-expanded` with `aria-controls`, or native `<details>`.
- Icon-only controls require `aria-label`. Decorative icons are `aria-hidden="true"`.
- Motion uses `transition` only. Use `motion-safe:` for any animation beyond color or opacity changes.

## Components

Import primitives from `src/components/UI.tsx` and recipes from `src/lib/theme.ts`.

| Component | Use when |
| --- | --- |
| `Button` | Any button. `variant`: `primary` (main action, one per view), `secondary` (default), `ghost` (toolbar and icon navigation), `danger` (confirm destructive action). `size`: `md` (h-11), `sm` (h-9 with `hit`), `icon` (h-11 w-11), `icon-sm` (h-9 w-9 with `hit`). |
| `buttonClass(variant, size)` | A link that must look like a button, such as `<Link className={buttonClass('primary')}>`. |
| `Chip` | A filter toggle. `pressed` drives `aria-pressed`. Pass `tone` (a `Tone`, such as `dietTone(tag)`) to tint it, or `tone="danger"` for avoided allergens. |
| `PageHeader` | The top of every page. Takes `eyebrow`, `title`, `lead` (hidden below `sm`), and `children` (always visible). |
| `SectionHeading` | An h2 inside a page or card. Takes optional `id` (anchors), `icon` with `tone`, `dot` (a tone `dot` class), and `count` (announced as "items"). |
| `Panel` | A titled card section with an icon and its `tone`, used on the item and account pages. |
| `ItemList` / `ItemRow` | A dish list. Each row has a favorite heart (`berry`) and a rating star (`star`). |
| `StatGrid` | Label, value, and `Tone` tiles for nutrition figures. Two columns on mobile, four from `sm`. |
| `Disclosure` | Progressive reveal (ingredients, full nutrition facts, older history). Summary is at least 44px tall. |
| `Avatar` | Initial circle for the signed-in user, colored by `nameTone`. `size`: `sm` (header) or `lg` (account page). |
| `Badges` | Dietary badges (`dietTone` colors) and allergen badges (neutral). |
| `RatingPill` | Average or personal rating. Thresholds: 4 and up success, 3 and up warning, below 3 danger. |
| `StatusPill` | Hall open state on the hall page band. A white pill with state-colored text and dot (`statusStyle`), because it sits on a solid color. |
| `StatusDot` | Hall open state on the schedule cards: a dot in the top right of the hall band, no text. Green open now, amber opening later, gray closed (`statusStyle`). The label is its `aria-label` and tooltip. |
| `DatePager` | Previous and next day, with a Today button. |
| `EmptyState` | A list or search with no results. Optional clear-filter action uses `linkClass` with `hit`. |
| `ErrorNote` | A failed request. Includes a Retry `Button size="sm"`. |
| `Loading` | A page or list that is fetching. Use the skeleton list for a whole section and inline text for a single value. |
| `MealIcon` | Meal glyph, colored by `mealTones`. Pass `className` to override (for example white on the selected tab). |
| `PageTitle` | Every page. Sets the document title, description, robots, and canonical tags from `src/lib/seo.ts`. |
| `StarRating` | The 1–5 star rating control on the item page. Tapping the current value clears it; disabled uses `opacity-50`. |
| `FoodSwatch` | Placeholder for a dish with no image: its initial on a `nameTone` fill. |
| `DietIcon` | Diet glyph inside `Badges` and diet chips: vegan sprout, halal check, otherwise leaf. |

Text recipes: `overlineClass` for overlines; `linkClass` for standalone text actions (add `hit` when the link stands alone). Inside a sentence, use a plain `<a>` with `linkClass`, and do not add `hit`.

## States

- **Loading.** Use `Loading`: the skeleton list for a whole section, inline muted text for a single value.
- **Empty.** Use `EmptyState`.
- **Error.** Use `ErrorNote` with a Retry `Button`. Error text is `text-danger`.
- **Disabled.** Use `disabled:opacity-60`; the plate stepper uses `disabled:opacity-40` and star ratings use `disabled:opacity-50`.

## UI checklist

Check every UI change before review:

- Uses `Button`, `Chip`, `PageHeader`, `SectionHeading`, `Panel`, `StatGrid`, or `Disclosure` where one fits. No hand-written copies of button or card classes.
- No raw palette classes and no arbitrary color values. `bun run lint` passes.
- Radii are on the scale above. No shadows on cards.
- Layout checked at 360px and 390px: no horizontal scroll, no clipped text.
- Checked in light and dark mode. Dark mode follows the OS `prefers-color-scheme` setting (`src/index.css`); there is no in-app toggle.
- Every interactive target is at least 44×44px, or uses `hit`.
- Reachable and operable by keyboard; focus visible; icon-only controls labeled.
- Copy follows the typography rules above.
