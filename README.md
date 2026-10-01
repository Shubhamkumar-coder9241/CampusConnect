# CampusSetu

A frontend-only peer-learning and opportunity prototype for Polytechnic students. Interactions use local React state and seeded data; refreshing the page resets the demo.

## Run locally

```sh
npm install
npm run dev
```

## Checks

```sh
npm run lint
npm run build
```

## Structure

- `src/pages/Pages.jsx` contains the dashboard, discovery, mentors, pod directory, resources, Campus Pulse, roadmap, and profile routes.
- `src/features/pod/` contains the interactive study room, focus timer, checklist, chat, and session summary.
- `src/components/` contains shared navigation and UI primitives.
- `src/data/` contains local seed data; `src/lib/matching.js` calculates rule-based compatibility.
- `src/index.css` loads Tailwind CSS v4 and the shared visual foundation.

## GitHub Pages

In the repository, open **Settings → Pages** and set the build source to **GitHub Actions**. The workflow builds with the `/CampusConnect/` base path and publishes `dist` on pushes to `main`. Routes use the URL hash so direct links and refreshes work on Pages.

Before deploying, add these repository secrets under **Settings → Secrets and variables → Actions**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Also add the deployed project URL to Supabase under **Authentication → URL Configuration**. For a repository named `CampusConnect`, use `https://YOUR-USERNAME.github.io/CampusConnect/` as the Site URL and allow `https://YOUR-USERNAME.github.io/CampusConnect/**` as a redirect URL. Keep `http://localhost:5173` entries for local development.