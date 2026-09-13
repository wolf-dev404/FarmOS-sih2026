# 🌾 FarmOS — Connecting Every Harvest to Its Best Opportunity

> **Smart India Hackathon 2026** · Problem Statement **26132** · Team **NEXUS**
> *Strengthening market linkages and price discovery for farmers* — Government of Maharashtra (Maharashtra State Innovation Society)

---

## 📖 About FarmOS

FarmOS is not just a price calculator or an e-commerce marketplace — it's a decision-support platform that helps farmers figure out **where**, **when**, and **to whom** to sell their produce, and what **net return** to actually expect.

Farmers today face fragmented visibility into prices, buyer demand, transport/storage costs, and buyer reliability — often leading to **distress selling** and **weak bargaining power**. Buyers, meanwhile, struggle to consistently find the right quantity, quality, and reliable suppliers.

FarmOS bridges this gap through one simple idea:

> 💡 **The highest listed price isn't always the best opportunity.** Distance, transport cost, storage cost, and buyer reliability all affect what a farmer *actually* takes home.

**Information → Analysis → Decision → Connection → Transaction**

---

## 🚜 Who It's For

| 👨‍🌾 Farmers | 🏢 Buyers |
|---|---|
| List produce as "lots" (crop, quantity, grade, availability) | Post sourcing requirements |
| Compare real-time market prices & trends | Discover matching lots from verified farmers |
| Get a recommended **best opportunity** (not just highest price) | Make offers directly to farmers |
| Track offers & transactions | Negotiate and close deals transparently |

---

## ✨ Core Features (MVP)

- 👤 **Farmer & Buyer Profiles** — role-based signup/login
- 🌽 **Crop / Lot Listings** — farmers list what they're selling
- 📊 **Market Price Dashboard** — real-time mandi prices via the official **Agmarknet / data.gov.in** API
- 📈 **Price Comparison & Trends** — historical price charts across markets
- 🤝 **Smart Farmer–Buyer Matching** — rule-based matching on crop, quality, and quantity
- 🏆 **Best Opportunity Recommendation** — scores offers by *net realisation* (price − transport − storage − other costs), not just gross price
- 📝 **Offers & Transaction Tracking** — from first offer to closed deal
- 📉 **Admin / Analytics Dashboard** — platform-wide insights

**🔮 Planned (post-MVP):** logistics/transport info, ML-based price forecasting, FPO aggregation, grievance management

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| 🎨 Frontend | HTML, CSS, JavaScript · Chart.js · Leaflet.js |
| 🔐 Auth & Database | [Supabase](https://supabase.com) (PostgreSQL + built-in Auth, connected via MCP) |
| 🐍 Data Pipeline *(upcoming)* | Python, Pandas, GitHub Actions (scheduled Agmarknet data fetch) |
| 🧠 Recommendation Engine *(upcoming)* | Rule-based scoring → ML-enhanced forecasting (later phase) |

> Auth and CRUD are handled directly via Supabase (no custom backend needed). A lightweight Python service will be introduced later purely for the recommendation engine and government data ingestion.

---

## 🎨 Design Language

- **Style:** Soft-minimal, organic, subtly modern — built to feel *trustworthy* and *agricultural*, not like a generic SaaS dashboard
- **Palette:**

  | Color | Hex | Use |
  |---|---|---|
  | 🟢 Deep Forest Green | `#1B4332` | Primary brand / nav / buttons |
  | 🍃 Leaf Green | `#40916C` | Secondary accents |
  | 🌾 Harvest Gold | `#F4B942` | Highlights & recommendations only |
  | 🤍 Warm Off-White | `#F7F8F3` | Backgrounds |
  | 🌿 Soft Sage | `#EAF2E3` | Section backgrounds |
  | ⚫ Charcoal | `#1F2933` | Body text |

- **Tagline:** *"Connecting Every Harvest to Its Best Opportunity"*

---

## 📌 Project Status

> 🚧 **Work in progress — actively being built for SIH 2026**

- [x] ✅ **Phase 1 — Foundation**: Supabase database (`farmers`, `buyers` tables), Row Level Security, real working signup/login for both roles, landing page, role-selection screen, placeholder dashboards
- [ ] 🔄 **Phase 2 — Listings & Market Data** *(in progress)*: crop/lot listings, buyer browsing, Agmarknet price pipeline, price dashboard
- [ ] ⏳ **Phase 3 — Matching Engine**: buyer requirements + farmer–buyer matching logic
- [ ] ⏳ **Phase 4 — Offers & Transactions**: offer flow, negotiation, deal tracking
- [ ] ⏳ **Phase 5 — Analytics**: admin dashboard, trend visualizations
- [ ] ⏳ **Phase 6 — Advanced (optional)**: logistics, FPO aggregation, grievance handling

📄 See [`docs/PROGRESS.md`](./docs/PROGRESS.md) for the detailed, up-to-date build log.

---

## 📂 Project Structure

```
farmos-sih2026/
├── docs/                   📘 Project context & phase progress (for both humans & AI agents)
├── frontend/               🖥️ HTML/CSS/JS — pages, auth, dashboards
│   ├── pages/
│   ├── js/
│   └── assets/
├── database/               🗄️ Schema (Supabase/Postgres)
└── README.md               📄 You are here
```

---

## ⚙️ Getting Started (Local Setup)

1. Clone the repo
   ```bash
   git clone https://github.com/wolf-dev404/FarmOS-sih2026.git
   ```
2. Create a `.env` file inside `frontend/` (see `.env.example`) with your own Supabase project credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Open `frontend/index.html` in your browser (or serve the folder with any static server) 🚀

---

## 👥 Team NEXUS

Built with 💚 for Smart India Hackathon 2026.

---

## 📚 References

- [AGMARKNET](https://agmarknet.gov.in) — Ministry of Agriculture & Farmers Welfare
- [data.gov.in](https://data.gov.in) — Open Government Data Platform, India
- [e-NAM](https://enam.gov.in) — National Agriculture Market

---

<p align="center">🌱 <i>Every harvest deserves its best opportunity.</i> 🌱</p>
