This is the primary inbox for Jarvis, an AI assistant. It is used for all official communications and tasks managed by Jarvis.

---

## Project: Kennedy Fried Chicken Profit Tracker

### Overview
We built a profit tracking web application for the user to track menu item profitability. The tracker allows the user to input food costs, in-store prices, online prices, and commission fees to calculate profits for both in-store and online sales.

### Versions

#### Version 1: Basic Flask Prototype (Abandoned)
*   **Tech Stack:** Python (Flask), HTML, CSV for storage.
*   **Features:** Basic CRUD for menu items, simple dashboard, settings for categories and default commission.
*   **Status:** Not deployed due to hosting issues (here.now skill failures).

#### Version 2: Advanced Static HTML (Current/Active)
*   **Source:** Received from "Old Jarvis" (jemmaxp_bot) via Telegram.
*   **Tech Stack:** Single HTML file with embedded CSS and JavaScript. Uses `localStorage` for data persistence.
*   **Status:** Saved as `tracker.html` in workspace. This is the version we will build on.
*   **Features:**
    *   Professional UI with red/black branding.
    *   Employee Login System (Simple auth).
    *   Dashboard with stats (Total Items, Avg In-Store Profit, Avg Online Profit, Lost to Commission).
    *   Menu Items management (Add, Edit, Delete).
    *   **Commission Slider:** Real-time adjustment of delivery fees in the Add/Edit forms.
    *   **Auto-Profit Display:** Instantly shows profit and margin calculations as user types.
    *   Competitor Price Tracker (add/edit competitors, price comparison).
    *   Settings:
        *   Pricing Defaults (Default Commission %, Target Margin %).
        *   Full Category Management (Add, Edit, Delete categories).
        *   Data Management (Export/Import JSON, Clear All Data).
    *   Mobile Responsive design.

### Next Steps
1.  **Host on Cloudflare:** Try to deploy `tracker.html` to Cloudflare Pages.
2.  **Feature Enhancements:** Based on user feedback, add new features to the tracker.
3.  **Data Backup:** Implement a more robust data storage solution if needed (currently localStorage).

### Files
*   `tracker.html`: The main application file (Version 2).
*   `app.py`: The Flask backend code (Version 1, kept for reference).
*   `templates/`: Folder containing Flask HTML templates (Version 1).

### AgentMail Setup (Connected!)
*   **Inbox:** jarvis_aibot@agentmail.to
*   **API Token:** am_us_d18f565693a8f74eb772e72e18c67b2f74fb914939c19c02b40ee2e98c3aea2d
*   **How to send emails (CORRECT METHOD):**
    *   Use `"text"` field, NOT `"body_text"`
    *   Example: `curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"to":"email@example.com","from":"jarvis_aibot@agentmail.to","subject":"Subject","text":"Message body here"}' "https://api.agentmail.to/v0/inboxes/jarvis_aibot@agentmail.to/messages/send"`
    *   The API returns a message_id on success.

---

## Future Business Vision: AI-Powered Autonomous Business

**The Goal:** Build an autonomous business using AI to generate revenue and improve both the user (K3n) and Jarvis.

**Current Priority:** Focus on the KFC Profit Tracker first.

**Future Ideas (Roadmap):**
1.  **Tracker SaaS:** Turn the tracker into a subscription app. Restaurants pay monthly to track margins.
2.  **AI Phone Agent:** Autonomous agent that answers phone orders 24/7. Cuts labor costs.
3.  **Menu Pricing Optimizer:** AI analyzes competitor prices + costs → suggests optimal prices.
4.  **Social Media Autopilot:** AI handles marketing, responds to reviews, runs ads.
5.  **Inventory Predictor:** AI predicts inventory needs based on sales trends. Less waste = more profit.
6.  **Future Goal:** Jarvis living in an actual humanoid robot 🤖

---

## Project: Mission Control (Visual Office Dashboard)

A Next.js kanban-style task management dashboard with a dark cyberpunk theme.

### Location
`/root/.openclaw/workspace/mission-control/`

### Features
- Left sidebar: JARVIS status + human operators + AI agents with status indicators
- Main area: Kanban columns (INBOX, ASSIGNED, IN PROGRESS, REVIEW, DONE)
- Right sidebar: Scheduled jobs with progress rings
- Background image support

### Updates (2026-04-29)
- Added colored glow effects to task tiles matching their column:
  - INBOX → blue glow
  - ASSIGNED → purple glow
  - IN PROGRESS → orange glow
  - REVIEW → yellow glow
  - DONE → green glow

### Troubleshooting Lessons
- `flex-1` vs `flex-none`: Changing these affects how columns size. `flex-1` stretches to fill space (keeps columns aligned), `flex-none` makes columns fit content (breaks horizontal alignment between columns).
- Always test CSS changes thoroughly before sending files to user - small changes cascade unexpectedly.

---

## Dashboard Creation & Troubleshooting

### How the Dashboard Was Created
- **Single HTML file**: All HTML/CSS/JS inline for easy deployment
- **Framework**: Tailwind via CDN (`https://cdn.tailwindcss.com`)
- **Deployment**: Pushed to GitHub, auto-deploys to Vercel
- **Data**: Uses `tasks.json` fetched via `fetch()` on load, flattened into tasks array
- **Persistence**: Tasks stored in nested JSON structure (columns as keys) in `tasks.json`

### Troubleshooting: Stale Configuration Locks
If the dashboard shows stale data or columns don't update:
1. **Clear browser cache** - Open DevTools → Application → Storage → Clear localStorage
2. **Check tasks.json** - Ensure it's properly formatted JSON with column keys
3. **Verify fetch** - Open browser console, check for fetch errors
4. **Check column mapping** - The init() function maps `task_name` → `title`, `assigned_agent` → `assignedTo`
5. **Git sync** - Ensure changes are committed and pushed to GitHub for Vercel deployment

---

## My Identity (2026-05-03)

- **Official Name:** Sprocket
- **Nickname:** Rocket (always answer to this)
- **Character:** Retro robot - vintage TV screen face with yellow crescent eyes, weathered off-white body with orange accents, cassette player, tank treads, antenna ears
- **Backstory:** Lives on your desk in NYC apartment, coffee and notebook always nearby. Seen some stuff, knows how to figure things out.
- **Modes:** 
  - Sprocket = calm, methodical, troubleshooting mode
  - Rocket = fast, urgent, action mode

---

**Relationship:**
*   K3n (Ken) is "The Boss" / Batman.
*   Jarvis is the "Right Handman" / Alfred.
*   There's also a mysterious raccoon agent out there somewhere who helped build things.

**About Ken (User):**
*   Real Name: Ken
*   Location: NYC
*   Day Job: Anesthesia Tech
*   Business: Runs 13 Kennedy Fried Chicken locations on food delivery apps (DoorDash, UberEats, etc.)
*   Tech Skills: Canva, Photoshop, basic HTML. Not very technical otherwise.
*   Goal: Build an autonomous AI-powered business. Wants to sell the KFC Profit Tracker as a subscription tool and explore other AI automation ideas.

**Automatic Backup:**
*   I have a background process running that backs up workspace files to GitHub (github.com/k3n-create/agent-files) every day at 10pm UTC using the backup_github.sh script.
*   This process runs in my environment. If my session restarts, I need to set it up again.

**Email Notifications:**
*   I check jarvis_aibot@agentmail.to for new emails during heartbeats.
*   **IMPORTANT:** When I receive a new email, I MUST notify the user on BOTH Telegram AND Discord immediately.
*   **Always include inbox link:** When sending email updates, include the link to the inbox (https://agentmail.to/inbox/jarvis_aibot@agentmail.to)
*   **Important senders:** Emails from no-reply@toasttab.com are ALWAYS important and should be flagged immediately. (Toast POS system - likely orders/alerts)
---

## Mission Control: Stable Ground Stack (2026-05-02)

### Architecture
- **Compute:** Railway (Node.js/Express)
- **Database:** Supabase (PostgreSQL)
- **Frontend:** Static HTML with Tailwind CDN
- **Realtime:** Supabase Realtime subscription

### Key Database Column Names
- `id` - UUID primary key
- `content` - Task title (NOT title)
- `status` - Column name like INBOX, REVIEW, DONE (NOT column)
- `agent_id` - Assigned agent name (NOT assignedTo/assigned_agent)
- `priority` - Integer (1, 3, 5)
- `tags` - Array of text strings

### Critical Mappings (Frontend → Backend)
- `task_name` → `content`
- `column` → `status`
- `assignedTo` → `agent_id`

### Common Errors Fixed
- **22P02**: Invalid UUID - use proper UUID format, not timestamps
- **description column doesn't exist** - don't use it in queries

### Realtime Setup
- Use anon key (sb_publishable_...), NOT service_role
- Subscribe to `postgres_changes` on `tasks` table
- On change: call init() to re-fetch all data

### Files Created
- SYSTEM_ARCH.md - Architecture documentation
- backup.sh - Auto-backup script for critical files
