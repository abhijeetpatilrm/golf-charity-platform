# Golf Charity Subscription Platform

A full-stack web application that combines golf engagement with social impact.

The platform is designed to let users subscribe to golf-related plans, contribute to charity initiatives, and earn rewards through continued participation and milestone-based activity.

## Overview

The Golf Charity Subscription Platform brings together three core ideas:

- Golf-driven user engagement and community participation
- Charity contribution workflows integrated into the product journey
- Subscription and rewards logic to encourage retention and long-term value

The goal is to deliver a product experience that is both commercially sustainable and mission-driven.

## Tech Stack

- Frontend: Next.js (React, App Router)
- Backend: Express.js (Node.js REST API)
- Database/Auth: Supabase

## Project Structure

```text
golf-charity-platform/
  client/   # Next.js frontend application
  server/   # Express.js backend API
```

## Setup Instructions

Basic local setup placeholder:

1. Clone the repository.
2. Install dependencies for each app.
3. Configure environment variables.
4. Run client and server in development mode.

Example commands:

```bash
# Client
cd client
npm install
npm run dev

# Server
cd ../server
npm install
npm run dev
```

Environment placeholders:

```env
# client/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# server/.env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Status

- Current phase: Initial architecture and core setup
- Frontend: Base Next.js project initialized
- Backend: Express server scaffolded with CORS, JSON parsing, and health route
- Next milestone: Implement authentication, subscription flows, and rewards/charity business logic

## Notes for Reviewers

This repository is organized to demonstrate clean full-stack separation, practical API setup, and a clear foundation for scaling subscription and rewards features in a production-oriented workflow.
