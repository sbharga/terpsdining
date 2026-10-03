# Data Sources

## 1. Dining hall hours: Google Sheet

**URL**

```
https://docs.google.com/spreadsheets/d/1vdWskGO2-aJfKLSW8-3zMaj_nx4SBJHF3OvMEy4-ZNo/gviz/tq?gid=479022338
```

- **Method:** `GET`, no auth.
- **Data:** Breakfast, lunch, and dinner hours for each UMD dining hall, for each day of the year.
- **Format:** A Google Visualization API response. This is JSONP-wrapped JSON, not plain JSON:

```
/*O_o*/
google.visualization.Query.setResponse({ ...JSON... });
```

Strip the leading `/*O_o*/\ngoogle.visualization.Query.setResponse(` (47 characters) and the trailing `);`. What remains is JSON. Cell values are in `table.rows[].c[].v`, where each cell is `{"v": <value>}` or `null`.

The rows, as a 2D grid:

| Row | Column 0 | Columns 1..N (one per date) |
| --- | --- | --- |
| 0 (header) | `venue` | dates as `M/D/YYYY`, e.g. `10/2/2026` |
| 1 | `South Campus \| Breakfast` | `7am-10:30am` |
| 2 | `South Campus \| Lunch` | `10:30am-4pm` |
| 3 | `South Campus \| Dinner` | `4pm-9pm` |
| 4–6 | `Yahentamitsi \| Breakfast/Lunch/Dinner` | … |
| 7–9 | `251 North \| Breakfast/Lunch/Dinner` | … |

- Each hall has three consecutive rows: Breakfast, Lunch, Dinner.
- Column 0 has the form `{Hall Name} | {Meal}`.
- A cell is either a free-text time range (`7am-10:30am`), `Closed`, or empty.

---

## 2. Daily menus: UMD Dining nutrition site

**URL**

```
http://nutrition.umd.edu/longmenu.aspx?locationNum={locationNum}&dtdate={M/D/YYYY}&mealName={Breakfast|Lunch|Dinner}
```

- **Method:** `GET`, no auth.

| Param | Values |
| --- | --- |
| `locationNum` | `16` = South Campus, `19` = Yahentamitsi, `51` = 251 North |
| `dtdate` | `M/D/YYYY` with no leading zeros, e.g. `10/2/2026` |
| `mealName` | `Breakfast`, `Lunch`, `Dinner` |

- **Data:** Every menu item served at one dining hall for one meal on one date. Items are grouped by station/section, and each item has allergen and dietary icons and a link to its nutrition label.
- **Format:** Server-rendered HTML (ASP.NET). The menu is a table, and each item or section header is one `<tr>`:

- **Section header row:** has a `<strong>` with the section name and no label link.
  ```html
  <td><p><strong> Breakfast Sides</strong></p></td>
  ```
- **Item row:** has an `<a>` that links to `label.aspx`. The link text is the food name.
  ```html
  <a href='label.aspx?locationNum=19&locationName=&dtdate=10%2f2%2f2026&RecNumAndPort=060063*1'>Food Name</a>
  ```
- **Allergen/dietary icons:** `<img class="nutri-icon">` elements in the item row. The `alt` text names the allergen or dietary tag.
  ```html
  <img class='nutri-icon' src=/LegendImages/icons_2016_egg.gif alt='Contains egg'>
  <img class='nutri-icon' src=/LegendImages/icons_2016_vegetarian.gif alt='vegetarian'>
  ```
  - Allergens are written `Contains {allergen}`, e.g. `Contains dairy`, `Contains egg`, `Contains pork`.
  - Dietary tags are bare words, e.g. `vegetarian`, `vegan`.

---

## 3. Nutrition labels: UMD Dining nutrition site

**URL**

```
https://nutrition.umd.edu/label.aspx?locationNum={locationNum}&locationName=&dtdate={M/D/YYYY, URL-encoded}&RecNumAndPort={recipe}*{portion}
```

- **Method:** `GET`, no auth.
- **Data:** The full nutrition facts label for one recipe: serving size, calories, macronutrients, and ingredients.
- **Format:** Server-rendered HTML page. The full URL for each item is the `href` on that item in the menu page above.
