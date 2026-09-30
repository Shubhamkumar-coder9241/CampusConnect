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