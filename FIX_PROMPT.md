# Antigravity FIX Prompt — "Flame in Freefall" (live site broken)

> Paste everything below the line into Antigravity. The project already exists in this folder; this is a **bug-fix** pass, not a rebuild.

---

The deployed dashboard at `https://sanju.ugsidharth.in/` is **not loading any data** — it sits on the "Loading NASA PSI Flight Data & Synthesis Models…" spinner (or renders an empty dashboard) and none of the six tabs (Investigations, Cross-Analysis, Crew Safety Ranking, Predictive Modeler, SI Assistant, Earth & History) populate. Fix the following.

## ROOT CAUSE (confirmed by auditing the built bundle)

The frontend hardcodes an absolute `localhost` API base. In `frontend/src/App.jsx`:

```js
const API_BASE = "http://localhost:3003";   // ← BUG
```

Every `fetch()` is built as `` `${API_BASE}/api/...` ``. When a **visitor** opens `https://sanju.ugsidharth.in/`, their browser literally tries to call `http://localhost:3003/api/...` on **their own machine** — which fails. So all data requests die and the UI never leaves the loading state.

I also inspected the **already-built** bundle (`frontend/dist/assets/index-*.js`) and it contains `http://localhost:8000` baked in — meaning the deployed `dist/` was built from an **older** version of the source. Two problems in one: the base URL is wrong, **and** the deployed artifact is stale.

## THE FIX (do all of these)

1. **Make the API base same-origin (relative).** In `frontend/src/App.jsx`, change the base so requests go to the same host the page is served from, letting the existing nginx `/api` reverse-proxy forward them to the backend:

   ```js
   // Use the current origin so it works on localhost dev AND the live domain.
   const API_BASE = window.location.origin;   // e.g. https://sanju.ugsidharth.in
   ```

   (A plain empty string `""` also works since all calls are relative `/api/...` paths — pick one and be consistent. Do **not** hardcode `localhost` or any port.)

2. **Rebuild the frontend.** After the source change you MUST regenerate the bundle, otherwise the old `localhost` base stays baked in:
   ```bash
   cd frontend && npm run build
   ```
   Confirm the new `dist/assets/index-*.js` **no longer** contains the string `localhost` (e.g. `grep -c localhost dist/assets/*.js` should be `0`).

3. **Rebuild + redeploy the Docker images** so the live site serves the new bundle:
   ```bash
   docker compose up -d --build
   ```

4. **Surface a real error state instead of a silent empty dashboard.** In `App.jsx` the initial `loadData()` `catch` only calls `console.error`. If the backend is unreachable the app currently renders an empty UI with no explanation. Add a visible `error` state: on fetch failure, set an error message and render a clear banner (e.g. "Could not reach the data service — check the backend container") with a **Retry** button that re-runs `loadData()`.

5. **Fix the stale/incorrect error copy.** The SI chat error message says *"Ensure FastAPI backend is running on port 8000."* The backend runs on **3003** (and in production it's same-origin via nginx, no port needed). Update this message to be accurate and not reference a hardcoded port.

6. **Verify the nginx proxy is intact** (it already looks correct — keep it): `frontend/nginx.conf` must proxy `location /api` → `http://backend:3003`. Do not remove it; the relative `API_BASE` depends on it.

## Keep working (do not regress)
- The backend (`backend/main.py`) and data (`backend/data/investigations.json`, 10 investigations) are correct — leave them as-is.
- The `docker-compose.yml` port mapping (`3003:3003`) and `depends_on` are fine.
- All six tabs, the recharts comparisons, the flammability modeler, and the grounded-SI assistant logic are functional once data actually loads.

## Definition of done (verify each on the LIVE domain)
1. `curl https://sanju.ugsidharth.in/api/investigations` returns the JSON array (10 items).
2. `curl https://sanju.ugsidharth.in/api/rankings` and `/api/domain` return data.
3. `curl -X POST https://sanju.ugsidharth.in/api/si/query -H 'Content-Type: application/json' -d '{"query":"cool flames"}'` returns `{answer, mode, citations}`.
4. Opening `https://sanju.ugsidharth.in/` in a browser: the loading spinner disappears and **all six tabs render populated data** (investigation list, comparison charts, ranking list, modeler output, SI assistant answers, spinoffs/history).
5. The deployed JS bundle contains **no** `localhost` string.

Make the source fix, rebuild, redeploy, then confirm the live site loads data in every tab.
