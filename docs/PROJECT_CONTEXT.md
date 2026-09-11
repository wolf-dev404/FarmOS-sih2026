# FarmOS — Market Linkage & Price Discovery Platform
**Smart India Hackathon 2026 | Problem Statement 26132 (Govt. of Maharashtra)**  
**Team: NEXUS**

---

## 1. Problem Statement
Small and marginal farmers often face fragmented and asymmetrical visibility into:
- Real-time market / APMC prices
- Buyer demand and procurement requirements
- Transport, logistics, and storage costs
- Buyer reliability and payment credibility

This lack of holistic intelligence leads directly to **distress selling** at local farmgates, high post-harvest losses, and weak bargaining power against intermediaries.

---

## 2. Core Idea & Value Proposition
FarmOS is designed to empower farmers to decide:
- **WHERE to sell**: Which APMC market, hub, or direct buyer yields the best margin.
- **WHEN to sell**: Optimal timing considering price trends, seasonality, and storage shelf-life.
- **TO WHOM to sell**: Verified and reliable buyers with matched demand.
- **What NET return to expect**: Calculate real profitability via **Net Realisation** rather than just advertising the highest gross market price:
  $$\text{Net Realisation} = \text{Gross Selling Value} - \text{Transport Costs} - \text{Storage Costs} - \text{Other Handling/Transaction Costs}$$

---

## 3. User Types & Roles
1. **Farmers**:
   - Register and maintain farmer profiles with farm location.
   - List agricultural produce "lots" (crop type, variety, quantity, quality grade, harvest date, location).
   - Access real-time price trends, buyer matches, and net return recommendations.
   - Receive and respond to buyer offers.
2. **Buyers (Traders, Processors, FPOs, Retailers)**:
   - Register verified buyer profiles.
   - Post crop procurement requirements (volume, target price, quality specs).
   - Browse crop lots, discover matches, and make direct purchase offers.

---

## 4. MVP Feature Roadmap (Build Order)
1. **Farmer & Buyer Profiles + Auth**: Secure onboarding, profile management, and role-based access.
2. **Crop/Lot Listing**: Farmers list crop lots with quantity, grade, harvest date, and expected price.
3. **Market Price Dashboard**: Live commodity prices integrated from data.gov.in Agmarknet API for Maharashtra and surrounding APMCs.
4. **Price Comparison & Trends**: Interactive charts showing temporal trends and cross-mandi price spreads.
5. **Farmer-Buyer Matching**: Rule-based matching engine pairing produce lots with buyer requirements by crop, quality grade, and quantity.
6. **Net Realisation Recommendation Engine**: Rule-based scoring to recommend optimal market destinations:
   - **Price**: 30% weight
   - **Buyer Match**: 25% weight
   - **Demand**: 20% weight
   - **Distance / Logistics Cost**: 15% weight
   - **Buyer Reliability**: 10% weight
7. **Offers & Transaction Tracking**: Offer negotiation, status lifecycle (Pending, Accepted, Rejected, Completed), and basic deal ledger.
8. **Admin / Analytics Dashboard**: Platform-wide metrics on trades, popular crops, price movements, and regional trade activity.

---

## 5. Technology Stack
- **Backend**: Python (Flask / FastAPI)
- **Database**: PostgreSQL (with SQLAlchemy ORM / raw SQL schemas)
- **Data Processing**: Pandas, NumPy, Requests (for external API consumption)
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
- **Data Visualization & Mapping**: Chart.js (price trends & analytics), Leaflet.js (mandi & distance mapping)
- **External APIs**: data.gov.in (Agmarknet Mandi Price API)

---

## 6. Design System & Color Palette
- **Deep Forest Green**: `#1B4332` (Primary Brand / Nav / Headers)
- **Leaf Green**: `#40916C` (Secondary Brand / Success / Accents)
- **Harvest Gold**: `#F4B942` (Highlights / Warning / Call-to-action accents)
- **Warm Off-White**: `#F7F8F3` (Background / Surface neutrals)
