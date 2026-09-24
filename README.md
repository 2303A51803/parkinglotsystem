# ParkPilot — Smart Parking Optimization & Management System

An intelligent parking platform that goes beyond simple slot booking by
**recommending the most suitable parking slot** based on vehicle
compatibility, distance, price, and availability — while improving overall
utilization through dynamic pricing, automatic reservation expiry,
real-time occupancy tracking, and demand prediction.

The system doesn't just ask *"which slot do you want?"* — it answers
*"based on your vehicle and requirements, here's the best slot for you,
and here's why."*

---

## 1. Problem Statement

Traditional parking systems present a flat list of available slots and
leave the user to guess which one is actually worth taking. That's fine
when a lot has ten spaces; it breaks down at real scale, where distance,
price, vehicle fit, and EV charger availability all matter simultaneously,
and where prices and availability shift by the hour.

## 2. Solution

ParkPilot scores every compatible, available slot on four transparent
factors and returns a ranked shortlist with plain-language reasons, prices
that respond to real-time demand, and a booking flow that's safe against
double-booking, no-shows, and frontend/backend disagreement about
availability.

## 3. Features

- JWT authentication with bcrypt-hashed passwords, USER / ADMIN roles
- Vehicle management (BIKE / CAR / SUV / EV)
- Parking slot management with zones, floors, EV chargers
- **Smart Slot Recommendation** (see below) — the core unique feature
- Dynamic, demand-based pricing (configurable tiers)
- Booking lifecycle: book → entry → occupied → exit → fee → completed
- Atomic double-booking prevention (DB-level row locking)
- Automatic reservation expiry after a configurable grace period
- Real-time occupancy tracking + historical-average occupancy prediction
- Admin analytics: revenue, peak hours, most-used slots, vehicle mix, EV usage
- Visual, clickable parking map with live status colors
- Simulated payments (no real gateway — see section 10)

## 4. Unique Feature: Smart Slot Recommendation

Given a vehicle type + preferences (zone, floor, EV requirement), the
engine (`backend/services/recommendationService.js`):

1. Filters to AVAILABLE slots compatible with the vehicle type (and EV
   charger, if requested).
2. Scores each candidate on four factors, normalized against the current
   candidate pool:
   - **Distance score** (40%) — closer to the entrance scores higher
   - **Price score** (20%) — cheaper scores higher
   - **Vehicle compatibility score** (25%) — rewards slots purpose-built
     for the vehicle type and, if needed, with a working EV charger
   - **Availability score** (15%) — rewards zones with more overall
     headroom, penalizing zones that are nearly full
3. Combines them into a `finalScore` (0–100) using configurable weights
   from `backend/config/constants.js`.
4. Returns the top 5 matches with human-readable reasons such as
   *"Closest to entrance"*, *"EV charger available"*, *"Lowest parking
   cost among matches"*.

This is intentionally a transparent, rules-based scorer rather than a
black box — every number in the response can be explained to the user.

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, JavaScript, HTML5, CSS3, React Router, Axios |
| Backend | Node.js, Express.js, REST APIs |
| Database | **MySQL** via Sequelize ORM |
| Auth | JWT, bcrypt |
| Dev tools | Git, GitHub, VS Code, Postman |
| Deployment | Frontend → Vercel, Backend → Render, Database → any managed MySQL (PlanetScale, RDS, Railway, etc.) |

> Note: the original spec targeted MongoDB Atlas; this build uses **MySQL**
> per a later requirement change. All models, the double-booking-safe
> booking flow, and the analytics aggregations were re-architected for a
> relational schema (see section 8).

No other backend framework, ORM, or UI kit was introduced beyond what's
listed above.

## 6. Architecture

```
┌─────────────┐      HTTPS/JSON       ┌──────────────┐      SQL       ┌───────────┐
│   React     │  ───────────────────▶ │   Express    │ ─────────────▶ │   MySQL   │
│  (Vercel)   │  ◀─────────────────── │  (Render)    │ ◀───────────── │           │
└─────────────┘        Axios          └──────────────┘   Sequelize    └───────────┘
                                              │
                                              ├─ controllers/  (HTTP layer, thin)
                                              ├─ services/     (business logic)
                                              │   ├─ recommendationService.js
                                              │   ├─ pricingService.js
                                              │   ├─ bookingService.js  (transactions + row locks)
                                              │   ├─ feeCalculator.js
                                              │   └─ predictionService.js
                                              ├─ middleware/   (auth, admin, validation, errors)
                                              └─ utils/scheduler.js (cron: expiry + occupancy snapshot)
```

Controller → Service → Model layering is enforced throughout: controllers
only translate HTTP ↔ service calls; all business rules (scoring, pricing,
fee math, transaction safety) live in `services/`.

## 7. Database Design (MySQL / Sequelize)

| Table | Key columns |
|---|---|
| `users` | name, email (unique), password (hashed), role |
| `vehicles` | userId (FK), vehicleNumber (unique), vehicleType, fuelType |
| `parking_slots` | slotNumber (unique), floor, zone, vehicleTypes (JSON array), status, pricePerHour, distanceFromEntrance, hasCharger, chargerStatus, coordinateRow/Col |
| `bookings` | userId/vehicleId/parkingSlotId (FKs), bookingDate, startTime, expectedEndTime, actualEntryTime, actualExitTime, status, basePrice, dynamicPrice, totalAmount |
| `parking_history` | parkingSlotId (FK, nullable for lot-wide snapshots), date, dayOfWeek, hour, occupiedCount, availableCount, totalSlots, occupancyPercentage |
| `payments` | bookingId/userId (FKs), amount, paymentStatus, paymentMethod, transactionId (unique) |

Relationships: `User 1—N Vehicle`, `User 1—N Booking`, `Vehicle 1—N Booking`,
`ParkingSlot 1—N Booking`, `ParkingSlot 1—N ParkingHistory`,
`Booking 1—1 Payment`. All defined in `backend/models/index.js`.

`vehicleTypes` on `parking_slots` is a JSON array (a slot can serve
multiple types, e.g. an EV bay that also fits regular cars) and is
filtered at the database level with MySQL's `JSON_CONTAINS`.

### Double-booking prevention

Two users booking the same slot at the same instant is prevented with a
**row-level lock inside a transaction**:

```js
await sequelize.transaction(async (t) => {
  const slot = await ParkingSlot.findOne({ where: { id }, transaction: t, lock: t.LOCK.UPDATE });
  if (!slot || slot.status !== 'AVAILABLE') throw new AppError('Parking slot is no longer available', 409);
  slot.status = 'BOOKED';
  await slot.save({ transaction: t });
  // ...create the booking row in the same transaction
});
```

`SELECT ... FOR UPDATE` blocks a second concurrent transaction from
reading that row until the first commits or rolls back, so only one
request can ever win the race.

## 8. API Documentation

All responses follow:

```json
// success
{ "success": true, "message": "...", "data": { } }
// error
{ "success": false, "message": "..." }
```

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register a new USER |
| POST | `/login` | — | Login, returns JWT |
| GET | `/profile` | User | Current user's profile |

### Vehicles (`/api/vehicles`) — all require auth, scoped to owner
| Method | Path |
|---|---|
| POST | `/` |
| GET | `/` |
| GET | `/:id` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Parking (`/api/parking`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/slots` | User | All slots (filterable) |
| GET | `/slots/available` | User | Available slots only |
| POST | `/recommendations` | User | **Smart recommendation engine** |
| GET | `/slots/:id` | User | Slot detail |
| POST | `/slots` | Admin | Create slot |
| PUT | `/slots/:id` | Admin | Update slot / status |
| DELETE | `/slots/:id` | Admin | Delete slot |

### Bookings (`/api/bookings`) — all require auth
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create booking (atomic slot reservation) |
| GET | `/my` | Current user's bookings |
| GET | `/:id` | Booking detail |
| PUT | `/:id/cancel` | Cancel a BOOKED reservation |
| PUT | `/:id/entry` | Record vehicle entry |
| PUT | `/:id/exit` | Record exit, calculate fee, simulate payment |

### Admin (`/api/admin`) — Admin only
| Method | Path |
|---|---|
| GET | `/users` |
| GET | `/users/:id` |
| DELETE | `/users/:id` |
| GET | `/vehicles` |
| GET | `/bookings?status=` |

### Analytics (`/api/analytics`) — Admin only
| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Full dashboard payload (slots, revenue, peak hours, prediction, etc.) |
| GET | `/prediction?targetDate=` | Historical-average occupancy prediction |

## 9. Installation

### Prerequisites
- Node.js 18+
- A running MySQL server (local install, Docker, or a managed instance)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your real DB_* values, JWT_SECRET, etc.
npm run seed   # creates an admin user + demo parking slots
npm run dev    # starts on http://localhost:5000
```

Default seeded admin:
`nithinbodas752@gmail.com` / `9908328583`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:5000/api
npm run dev    # starts on http://localhost:5173
```

## 10. Environment Variables

**backend/.env**
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_parking
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
BOOKING_GRACE_PERIOD_MINUTES=15
FEE_ROUNDING_MODE=rounded
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

> `.env` is git-ignored in both projects. Never commit real credentials —
> `.env.example` ships with blank/placeholder values for anyone else
> setting the project up.

## 11. Deployment

- **Frontend → Vercel**: point it at `frontend/`, set `VITE_API_BASE_URL`
  to your deployed backend URL in Vercel's environment variables.
- **Backend → Render**: point it at `backend/`, set all variables from
  section 10 in Render's environment settings, build command `npm install`,
  start command `npm start`.
- **Database**: any managed MySQL instance reachable from Render (PlanetScale,
  Railway, AWS RDS, etc.) — set `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`
  accordingly. Run `npm run seed` once against the production database to
  create the initial admin account.

## 12. Payments

Payments are **simulated** (`paymentMethod: SIMULATED_UPI`, etc.) — no
real payment gateway is integrated in this version, per the original scope.
Swapping in a real gateway (Razorpay, Stripe) would mean replacing the
`Payment.create(...)` call in `bookingService.recordExit` with a real
charge/capture call, without changing anything else in the booking flow.

## 13. Future Enhancements

- Replace historical-average prediction with a trained ML model (the
  service is already structured behind a single `predictOccupancy()`
  interface for this)
- Real payment gateway integration
- WebSocket-based live occupancy push instead of polling
- Multi-lot / multi-location support
- SMS/email notifications for booking confirmation and expiry warnings

## 14. Development Notes

This project was built in phases (setup → auth → parking → vehicles →
booking → smart features → admin → UI polish), consistent with the
original build plan. Every backend module was verified by requiring the
full server wiring graph against stub dependencies (in the absence of
live network access during initial development) to catch require-time
and wiring errors before hand-off; a real `npm install` + `npm run dev`
against a live MySQL instance is still the actual integration test and
should be run before deploying.
