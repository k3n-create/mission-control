# Mission Control: System Architecture & Troubleshooting Protocol

## 1. System Overview
**Status:** Stable Ground Verified
**Core Objective:** Centralized dashboard for autonomous AI agents (Jarvis, Jade) and human oversight.

### Tech Stack
* **Backend:** Node.js / Express server hosted on Railway.
* **Database:** Supabase PostgreSQL with Realtime enabled.
* **Frontend:** Glassmorphism UI with Tailwind CSS and Supabase-js subscription.

---

## 2. Technical Handshakes (The "Pipes")

### Global Data Mapping
To prevent `ReferenceError` crashes, these maps must remain in the **Global Scope** of `index.js`:
* **statusMap**: Maps dashboard columns to DB-safe names (`INBOX` -> `todo`).
* **priorityMap**: Converts string inputs to Integers (`medium` -> `3`).
* **reverseStatusMap**: Maps DB names back to UI headers.

### Realtime Synchronization Logic
To avoid recursion loops, the `index.html` must keep these functions separate:
* **init()**: Performs the initial data fetch.
* **initRealtime()**: Establishes the persistent WebSocket listener.
* **Rule**: Never call `initRealtime()` inside `init()`.

---

## 3. Database Constraints & Schema
* **Primary Key (`id`)**: Must be a valid **UUID**. Temporary numeric timestamps are automatically replaced with `uuidv4()` by the server.
* **Priority**: Must be an **Integer**. Use the `priorityMap` to sanitize incoming strings.
* **On Conflict**: Upserts must target the `id` column using a Unique Index.

---

## 4. Troubleshooting Codes

| Code | Meaning | Surgical Fix |
| :--- | :--- | :--- |
| **22P02** | Syntax Error | Check if the ID is a valid UUID or if Priority is a string instead of an Integer. |
| **42P10** | Constraint Error | Ensure the Supabase table has a Unique Index on the `id` column. |
| **RefError** | Scoping Error | Ensure mapping objects (like `priorityMap`) are defined outside of specific routes. |

---

## 5. Agent Directive
Jarvis/Jade: You are required to read this file before performing any backend refactor. Do not deviate from these established 'pipes' without explicit architecture approval.