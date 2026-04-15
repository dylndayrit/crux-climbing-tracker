# Crux — Climbing Gym Tracker

A React front-end for managing climbing gyms, routes, and ratings. Built with Vite and designed with a warm, earthy aesthetic — cream parchment backgrounds, terracotta accents, and Helvetica typography.

Connects to a locally hosted REST [API](https://github.com/dylndayrit/climber-api.git) running on `http://localhost:3000`.

## Features

- View all gyms and routes across two tabbed views
- Add new gyms with name, location, day pass price, and climb types
- Add new routes to a gym with grade, type, and hold color
- Delete gyms and routes with confirmation dialogs
- Submit 1–5 star ratings for any gym or route
- Error handling with toast notifications
- Loading states, empty states, and staggered card animations

## Tech Stack

- **React 18** with hooks (`useState`, `useEffect`, `useCallback`)
- **Vite** for dev server and bundling
- **Fetch API** for all HTTP requests (no external HTTP libraries)
- **CSS-in-JS** via inline styles and a `<style>` block (no CSS frameworks)

## Getting Started

### Prerequisites

- Node.js (v18+)
- The REST API running on `http://localhost:3000`

### Installation

```bash
git clone https://github.com/dylndayrit/crux-climbing-tracker.git
cd crux-climbing-tracker
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Vite proxies API requests to `localhost:3000` so no CORS configuration is needed on the backend.

## API Endpoints

The app expects these endpoints on the backend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gyms` | List all gyms |
| GET | `/gyms/:id` | Get a single gym |
| POST | `/gyms` | Create a gym |
| PUT | `/gyms/:id` | Update a gym |
| DELETE | `/gyms/:id` | Delete a gym |
| POST | `/gyms/:id/ratings` | Add a rating to a gym |
| GET | `/routes` | List all routes |
| GET | `/routes/:id` | Get a single route |
| POST | `/gyms/:id/routes` | Create a route for a gym |
| DELETE | `/gyms/:gymId/routes/:routeId` | Delete a route |
| POST | `/routes/:id/ratings` | Add a rating to a route |
| GET | `/memberships` | List all memberships |
| GET | `/gyms/:id/memberships` | List memberships for a gym |
| GET | `/gyms/:gymId/memberships/:membershipId` | Get a single membership |

## Data Models

**Gym**: `_id`, `name`, `city`, `state`, `dayPassPrice`, `climbTypes` (string[]), `ratings` (number[])

**Route**: `_id`, `gymID`, `name`, `grade`, `color`, `type`, `ratings` (number[])

**Membership**: `_id`, `gymID`, `title`, `pricePerMonth`, `perks` (string[])

## AI Use Disclosure

This project was built with assistance from Claude (Anthropic). Claude was used for:

- Generating wireframe mockups and iterating on the visual design direction
- Writing the React component code and CSS styling
- Project scaffolding (Vite config, package.json, file structure)
- Conducting a security review before publishing
- Writing this README

All AI-generated code was reviewed, tested, and modified by the developer. The design direction, feature requirements, and architectural decisions were made by the developer through an iterative feedback process with Claude.
