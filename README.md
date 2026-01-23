
# Murty Governance Cockpit v1.10

## Executive Overview
The **Murty Governance Cockpit** is a specialized management platform designed for Portfolio Management Offices (PMO) and Executive Leadership. Unlike standard project management tools (like Jira or Asana) that track *tasks* and *tickets*, this application tracks **Governance, Compliance, and Cognitive Workload**.

It answers three critical questions for leadership:
1.  **Are we burning out our people?** (Workload Intelligence)
2.  **Are our projects healthy and compliant?** (Governance Health)
3.  **Where are our structural risks?** (Portfolio & RAID Analysis)

---

## 📘 Deep Dive: The Logic & Explainer

### 1. The Workload Intelligence Engine
Most tools calculate capacity using "Hours per week." This is often inaccurate for knowledge workers because an hour spent managing a crisis requires more mental energy than an hour spent on routine paperwork.

The Cockpit uses a **Points-Based System** called the "Workload Score."

#### How We Calculate "Load" (The Numerator)
We don't just count projects. We weigh them based on four dimensions:
1.  **Lifecycle Phase:** A project in *Delivery* (100% intensity) is heavier than a project in *Discussion* (30% intensity).
2.  **Role Weight:** Being a *Director* (Oversight/Accountability) carries a different mental load than being a *Team Member* (Execution).
3.  **Complexity:** A standard project is 1.0x. A highly complex, political, or technical project acts as a multiplier (e.g., 1.3x), increasing the load score even if the hours are the same.
4.  **Allocation:** The percentage of time dedicated to the role.

> **The Formula:**
> `Project Score = (Lifecycle Factor × Role Weight × Complexity Factor) × Allocation %`

#### The "Hidden" Penalties
The engine adds extra points for invisible work:
*   **The Management Tax:** For every person reporting to a manager, we add workload points. Managing people takes time and emotional energy.
*   **The Context Switching Penalty:** This is crucial. If a person is assigned to 10 small projects, they are less efficient than if they were on 2 large ones. The system detects when a user exceeds their "Max Current Projects" threshold and adds penalty points to reflect the cognitive cost of multitasking.

#### Determining "Capacity" (The Denominator)
Not everyone has the same capacity.
*   **Grade Baseline:** A *Senior Partner* generally has a higher capacity for simultaneous oversight than a *Graduate Intern*. The system assigns a baseline "Weekly Points Capacity" to every HR Grade.
*   **The Capacity Modifier (1-10):** Life happens. A user might be part-time, on partial leave, or transitioning roles. The "Capacity Modifier" slider allows us to temporarily reduce a person's effective capacity (e.g., set to 5/10 for someone working 3 days a week) without changing their permanent grade.

---

### 2. The "Fairness" Algorithm
It is easy to see if someone is busy. It is harder to see if they are **unfairly** busy compared to their peers.

The system performs a **Real-time Peer Analysis**:
1.  It calculates the utilization % of the target person.
2.  It looks for everyone else in the *same Grade* and *same Business Unit*.
3.  It calculates the average utilization of that peer group.

> **Visual Indicator:**
> If a Senior Associate is at 110% capacity, but the average for all Senior Associates is 115%, the system marks them as **"Balanced"** (everyone is busy).
>
> If they are at 110% but the peer average is 60%, the system flags them as **"Overloaded (+50% vs Peers)"**, highlighting a resource imbalance.

---

### 3. Governance Health (RAG Status)
In many organizations, Project Status (Red/Amber/Green) is subjective—it's whatever the Project Manager feels like reporting.

The Cockpit calculates an **Objective RAG Status** based on data freshness and risk exposure:

*   **Automation:**
    *   **Red:** If a High Impact Risk is overdue OR if a Status Report hasn't been filed in the required window (e.g., 7 days for active projects).
    *   **Amber:** If there are too many open risks or the report is slightly stale.
    *   **Green:** Only if reports are fresh, risks are managed, and key roles (like Project Director) are staffed.

---

## 🚀 Application Flow & Architecture

### The Data Hierarchy
The application is built around three core entities:

1.  **People:** The workforce. They belong to **Units** (Departments) and have **Grades**.
2.  **Work Items:** The projects. They have a **Lifecycle** (Pipeline vs. Active), a **Type**, and **Staffing**.
3.  **Packs:** The governance data attached to a Work Item. A "Pack" contains:
    *   **RAID Log:** Risks, Actions, Issues, Decisions.
    *   **RACI Matrix:** Who is Responsible/Accountable for key decisions.
    *   **Reports:** Weekly status updates (Executive Summary, Achievements, Next Steps).
    *   **Comments:** Discussion threads.

### User Journey

1.  **Dashboard (The "Morning Coffee" View):**
    *   Start here. See your personal portfolio health, upcoming deadlines, and a scatter plot identifying who in the organization is burning out.
    *   *Key Feature:* The "Forecast" chart shows capacity utilization 6 months into the future based on project start/end dates.

2.  **Portfolio Explorer:**
    *   A searchable grid of all work. Use filters to slice data by Unit, Phase, or Health.
    *   Clicking a project takes you to the **Project Cockpit**.

3.  **Project Cockpit (The "Engine Room"):**
    *   This is where work happens.
    *   **Overview:** Edit scope, dates, and assign staff.
    *   **RAID:** Log risks. If a risk is "High Impact" and "Overdue," the project turns Red automatically.
    *   **Reports:** Write weekly updates.
    *   **RACI:** Define accountability.

4.  **People & Organization:**
    *   **Org Chart:** A drag-and-drop interactive visual of reporting lines.
    *   **Profile:** Deep dive into a specific person. Adjust their "Capacity Modifier" slider here to reflect real-life availability.

5.  **Settings (The "Brain"):**
    *   This is where the math lives. You can tune the "Workload Engine" here.
    *   *Example:* If you feel Directors are being scored too low, go to `Settings > Workload` and increase the `Role Weight` for "Engagement Director" from 2.0 to 2.5. The entire application recalculates instantly.

---

## 🛠 Technical Details

*   **Offline-First:** The app uses `localStorage` to persist data. You can refresh the page, and your data remains.
*   **No Database:** It is a pure frontend application (SPA).
*   **Export/Import:** You can backup the entire database to a JSON file via `Settings > Data` and restore it later.
*   **Tech Stack:** React 18, TailwindCSS, Recharts (Visualization), Lucide React (Icons).

### Key Files
*   `services/compute.ts`: **The Brain.** Contains all the math for Workload Scores, Health RAG logic, and Fairness calculations.
*   `constants.ts`: **The Seed.** Contains the default configuration (Taxonomy, Grade definitions) used when the app first loads or resets.
*   `context/AppContext.tsx`: **The State.** Manages the global data store and handles updates (Reducers).

---

## Usage Guide

### Getting Started
1.  **Login:** Use the default demo credentials (Name: `Abdul Oladapo`, Password: `MP`).
2.  **Dashboard:** Check the "Attention Section" for red flags.
3.  **Portfolio:** Click "Portfolio" to browse projects.
4.  **Edit Project:** Open a project, click "Edit" to adjust dates or staffing.

### Maintenance
Use the **Diagnostics** tool in `Settings > Data` to find:
*   Staffing records pointing to deleted users.
*   Projects assigned to deleted units.
*   Circular reporting lines in the Org Chart.
