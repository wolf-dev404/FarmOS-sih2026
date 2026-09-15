# FarmOS — Implementation Progress

Project: **FarmOS** | Team: **NEXUS** | SIH 2026 (PS 26132)

---

## Roadmap & Status

| Phase | Description | Status | Details / Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Farmer & Buyer Profiles + Auth** | 🟢 **COMPLETE** | Live Supabase auth integration, farmers/buyers database schemas with RLS & auto-provisioning triggers, split-screen branded auth pages (farmer/buyer register & login), role selector, and responsive landing page. |
| **Phase 2** | **Produce Lot Listings & Market Price Pipeline** | 🟢 **COMPLETE** | **Verified Functional**:<br>• `crops` table seeded with 15 commodities.<br>• `lots` table with RLS (farmers manage own, buyers read active).<br>• `market_prices` table with unique constraint & public read RLS.<br>• Working farmer "My Lots" view (`my-lots.html`) & standalone add lot form (`add-lot.html`) with live Supabase CRUD.<br>• Working buyer marketplace (`browse-lots.html`) with crop, grade, location filters & direct farmer contact modal.<br>• Working live APMC rates dashboard (`market-prices.html`) with Chart.js 30-day modal price trend line chart & filterable mandi rate table.<br>• `farmer-dashboard.html` & `buyer-dashboard.html` updated with live clickable cards & real-time counts.<br>• `data-pipeline/fetch_prices.py` Agmarknet API ingestion with upsert and offline seed fallback mode.<br>• `.github/workflows/fetch-prices.yml` for scheduled daily and manual ingestion. |
| **Phase 3** | **Farmer-Buyer Matching Engine** | ⚪ **NOT STARTED** | Buyer requirement posts, rule-based matching engine pairing produce lots with buyer specs (crop, quality grade, quantity filters). |
| **Phase 4** | **Net Realisation Recommendation Engine** | ⚪ **NOT STARTED** | Multi-factor recommendation algorithm (Price 30%, Buyer match 25%, Demand 20%, Distance/cost 15%, Reliability 10%) & Leaflet.js distance mapping. |
| **Phase 5** | **Offers, Transactions & Admin Dashboard** | ⚪ **NOT STARTED** | Deal negotiation lifecycle (make/accept/reject binding offers), transaction settlement tracking, and admin platform analytics. |

---

## Phase 2 Verification & Audit Log

- **Supabase Database Verified**:
  - `crops`: 15 rows present and accessible.
  - `lots`: Active RLS policies verified; verified live lot insertion and joined query (`lots` + `crops` + `farmers`).
  - `market_prices`: Created with schema `(id, commodity, state, district, market, min_price, max_price, modal_price, price_date, fetched_at)`, unique constraint `(commodity, market, price_date)`, and RLS enabled.
- **Frontend Pages Verified**:
  - `frontend/pages/my-lots.html`: Live lot inventory, status filtering, Mark as Sold, Delete, "+ Add Produce Lot" modal.
  - `frontend/pages/add-lot.html`: Standalone form page with dynamic commodity dropdown from `crops`.
  - `frontend/pages/browse-lots.html`: Buyer marketplace for active lots with commodity, grade, location filters, and farmer contact modal.
  - `frontend/pages/market-prices.html`: Live APMC mandi rates table with filters (Commodity, State, District, Mandi) and Chart.js 30-day modal price trend line chart.
  - `frontend/pages/farmer-dashboard.html`: Live active Produce Lot Management card (with live active lot count) and Live Mandi Rates card.
  - `frontend/pages/buyer-dashboard.html`: Live active Produce Lots card (with live total available count) and Live Mandi Rates card.
- **Pipeline & Automation Verified**:
  - `data-pipeline/fetch_prices.py`: Tested locally in `--seed` benchmark mode (180 records normalized and prepared, exited code 0).
  - `data-pipeline/requirements.txt` & `data-pipeline/.env.example`: Created with full environment documentation.
  - `.github/workflows/fetch-prices.yml`: Scheduled daily cron (`30 4 * * *`) and `workflow_dispatch` trigger.
