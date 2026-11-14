# Antigravity Build Prompt — "Flame in Freefall"

> Paste everything below the line into Antigravity. The folder you're pointing it at already contains the source resources (see the "Resources" section).

---

You are building an entry for the **2026 NASA Space Apps Challenge**. Build a production-quality, web-based, **Super-Intelligence (SI) powered dashboard** for the challenge titled:

**"Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data"**

## What we're building

NASA has spent decades studying how flames and fire behave in microgravity (on the ISS and in drop-tower / parabolic-flight campaigns), and is now publishing that experimental data publicly through the **Physical Science Informatics (PSI) database**. The problem: the volume of results is hard to find, hard to compare, and hard to interpret.

Your job is to build an interactive dashboard that **summarizes, ranks, and interprets** those combustion-science investigations and turns them into clear, actionable **fire-safety insights for human space exploration** (crewed spacecraft, space stations, lunar/Mars bases, pressurized rovers, spacesuits) — and, where relevant, for fire safety on Earth.

### Core user capabilities (the dashboard must let a user…)
1. **Identify** the investigations most relevant to fire-safety needs of habitable crew environments.
2. **Extract** data that supports **predictive modeling** of flammability and fire scenarios in space.
3. **Highlight** research that informs next-generation fire-safety controls and equipment.
4. **Ask questions in natural language** and get cited, data-grounded answers (this is the "SI" layer).

### Attributes to summarize & display per investigation
- Experimental objectives
- Fuels (including shape/size of samples or burners)
- Test conditions (oxygen concentration, airflow speed, pressure, gravity level)
- Variables (how tests within the same investigation differed and what stayed the same)
- Sensors / types of measurements
- Similarities & differences **across** investigations

### Key investigations & hardware to model (from the challenge brief)
- **BASS / BASS-II**, **Saffire-I/II/III** — solid-material flammability (fabrics, plastics)
- **SAME / SAME-R** — smoke & aerosol detection
- **FLEX / FLEX-2 / CFI** — suppression (dilution with CO₂ and He); burning liquid-fuel droplets
- **ACME** project (6 experiments, incl. **BRE**, **CFI-G** with up to 85% O₂ inside-out flames, **E-FIELD** flames)
- **SPICE / SLICE / DAFT / DAFT-2** — solid + gaseous fuels, dust/aerosol detection
- Hardware groupings: **Combustion Integrated Rack (CIR)**, **Multi-user Droplet Combustion Apparatus (MDCA)**, **Microgravity Science Glovebox (MSG)** with the SPICE fan-driven flow duct
- Note: rocket/propellant fire safety is **out of scope** (combustion there is effectively gravity-independent).

### Domain facts to bake into the model / copy
- In microgravity, absence of buoyancy turns a flickering teardrop flame into a **ghostly blue, diffusion-reliant sphere**.
- Fire-safety work is organized around **prevention, detection, suppression**.
- Spacesuits run on **100% O₂ at ~4.3 psi** (Earth sea level = 14.7 psi).
- The planned **Moon Base / pressurized rovers** will sit between a spacesuit and Earth's atmosphere: **~30%+ O₂ at ≤10.2 psi** → >40% increase in oxygen concentration → materials become **much more flammable**.
- **No partial-gravity combustion data is in PSI yet** (expected from **LUCI** and **FM2**); microgravity + normal-gravity results can bound intermediate gravity.
- Real-world motivation: Artemis II smoke alarm, Apollo 13 O₂-tank explosion, Mir fire (O₂-generator failure), Apollo 1 pre-launch fire (1967).
- Earth spinoffs: ISS fine-water-mist extinguishers, improved smoke detection, firefighter gear (protective clothing, air tanks).

## Target audience
Professors, graduate & undergraduate students, aerospace researchers, and aerospace engineers. Design the UX to be clear and credible for these people (not a toy demo).

## Tech stack (build exactly this)
- **Backend:** **Python + FastAPI**. Serve a JSON API for investigations, comparison, ranking, and an LLM "SI" endpoint.
- **Frontend:** a modern web frontend (React + Vite + Tailwind is fine) that talks to the FastAPI backend. Include charts/visualizations for comparing investigations.
- **Data layer:** a clean, structured dataset of the investigations (JSON/SQLite) that the API serves. Seed it from the resources below.
- **SI / LLM layer:** a "Super Intelligence" assistant endpoint that answers natural-language questions **grounded in the investigation data** (RAG-style: retrieve relevant investigations, then synthesize a cited answer). Make the provider/key configurable via environment variables (e.g. `ANTHROPIC_API_KEY`); if no key is present, degrade gracefully to a well-structured retrieval-only answer so the app still works offline.
- **Containerization:** provide a working **`Dockerfile`** for the backend and a **`docker-compose.yml`** that brings up the backend + frontend (and any DB) so the whole thing runs with `docker compose up`. Include a `.env.example`.

## Resources (your source material)
The project folder contains a `resources/` directory. **Read and use these files** as your authoritative source material for the dataset and copy:

- `resources/A_Researchers_Guide_to_ISS_Combustion_Science.pdf` — the primary technical reference on ISS combustion facilities, the acceleration environment, and past/current microgravity fire-safety investigations. Extract investigation names, hardware, objectives, fuels, and conditions from it.
- `resources/psi_repo.html` — the NASA **Physical Science Informatics (PSI)** data landing page (the public data source the dashboard is about).
- `resources/researchers_guide_landing.html` — landing page for the researcher's guide.
- `resources/mir_fire.html` + `mir_fire_summary.txt` — the Mir space-station fire (O₂-generator failure).
- `resources/apollo_1.html` + `apollo_1_summary.txt` — Apollo 1 pre-launch fire.
- `resources/apollo_13.html` + `apollo_13_summary.txt` — Apollo 13 O₂-tank explosion.
- `resources/fire_attire.html` / `fire_safety_suit.html` + `fire_attire_summary.txt` — firefighter protective clothing (Earth spinoff).
- `resources/lightweight_breathing_apparatus.html` — lightweight breathing apparatus / air tanks (Earth spinoff).
- `resources/challenge_page.html` — the official challenge page (the brief above is distilled from it).

Use the `.txt` summaries as fast context and the `.html`/`.pdf` files for deeper detail. Cross-reference them so the dataset is accurate and the "why this matters" narrative is grounded in real events.

## Scope & delivery (MVP first, then extend)
Work in this order and make each stage usable on its own:

1. **MVP (must be solid):**
   - Structured dataset of the key investigations with the attributes above.
   - FastAPI endpoints to list, filter, and compare investigations.
   - Frontend dashboard: browse investigations, view their attributes, and **compare** a few side by side with charts.
   - A **ranking** view that surfaces the investigations most relevant to crew fire safety (with a transparent, explainable relevance score).
   - Docker + docker-compose so it all runs with one command.
2. **Then extend toward the full vision:**
   - The **SI / LLM assistant** (natural-language Q&A grounded in the data, with citations).
   - **Predictive-modeling** support: expose the extracted flammability variables in a form that supports modeling fire/flammability scenarios (e.g. a simple model or a clear data export for one).
   - A "next-gen fire-safety controls & equipment" highlight view.
   - An **Earth-applications** section tying PSI findings to terrestrial fire-safety spinoffs.

## Quality bar
- Clean, modular code; sensible folder structure; a `README.md` that explains what it is, how to run it (`docker compose up`), and how to point it at a real LLM key.
- No hardcoded secrets; all config via env vars.
- The UI should look credible to aerospace engineers — clear typography, good data visualization, and honest labeling of what is data vs. interpretation.
- Handle the "no LLM key" case gracefully (retrieval-only answers).
- Make the relevance-ranking logic transparent (show *why* an investigation ranks high).

## Definition of done
`docker compose up` starts the backend and frontend; a user can browse and compare the microgravity combustion investigations, see an explainable relevance ranking, and ask the SI assistant a natural-language question about fire safety in space and get a cited, data-grounded answer.

Start by reading the resources in `resources/`, then build the MVP, then extend.
