# TerpsDining

Dining hall hours, daily menus, and community food ratings for University of Maryland students.

## Features

- **Live hours & status** &mdash; see which dining halls are open right now, with live Open / Closing Soon / Closed badges
- **Daily menus** &mdash; browse today's menu across South Campus, Yahentamitsi, and 251 North, organized by meal period
- **Food search** &mdash; search by name and filter by allergen (gluten, dairy, eggs, nuts, and more)
- **Food detail pages** &mdash; community rating breakdown (overall, taste, health) and a weekly chart of how often a dish is served
- **Ratings** &mdash; sign in to rate any food item; update your rating at any time
- **Ratings history** &mdash; view and delete all your past ratings from your profile page
- **Admin panel** &mdash; authorized admins can attach image URLs to food items

## Tech Stack

- [React 19](https://react.dev) + [React Router 7](https://reactrouter.com)
- [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) (auth, Postgres database, storage)
- Python sync script &mdash; scrapes `nutrition.umd.edu` daily and upserts into Supabase
