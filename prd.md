1. Overview
Product Name:
Good Game Ligaen Pickems / Fantasy Page

Description:
A Next.js-based platform where users can predict the outcome of Good Game Ligaen matches each round. Participants earn points for correct predictions and can share their picks on social media. The system integrates with Good Game Ligaen’s official API for match data. Supabase manages user authentication and stores user picks. TailwindCSS and shadcn components ensure a clean, modern UI.

Goals & Objectives:

Increase viewer engagement and community interaction around Good Game Ligaen.
Gamify the league experience with a fun, competitive prediction element.
Promote social sharing to boost visibility and attract new fans.
Provide a stable, secure, and easy-to-use platform leveraging Next.js, Supabase, and the official Good Game Ligaen API.
2. Tech Stack & Integration
Next.js (App Router)

Reasoning: Server-side rendering (SSR) for improved performance and SEO, plus built-in API routes where we can securely fetch Good Game Ligaen data (using server-side environment variables to store the personal API token).
Key Features: Data fetching with React Server Components, dynamic routes for user profiles, matches, leaderboards, etc.
Supabase

Auth: Manages user registration, login, and session handling.
Database: Stores user picks, points, and any custom metadata not directly provided by the Good Game Ligaen API.
Real-time Features (Optional): Could be used for real-time leaderboard updates if desired.
TailwindCSS

Styling: Rapidly build a responsive and consistent UI.
Theming: Easy to customize color schemes and utility classes for brand consistency.
shadcn/UI Components

Pre-built, Accessible Components: Speeds up UI development for modals, tables, forms, etc.
Good Game Ligaen API

Authentication: “Authorization: Bearer <token>” header. All requests made from the server side to keep the token secure.
Endpoints (most relevant for the Pickems project):
Competition:
Info: GET https://www.gamer.no/api/paradise/v2/competition/9539
Divisions: GET https://www.gamer.no/api/paradise/v2/competition/9539/divisions
Division:
Matches: GET https://www.gamer.no/api/paradise/v2/division/{division_id}/matchups?round_number={int}&include_maps={0|1}&include_streams={0|1}
Match (Matchup):
Info: GET https://www.gamer.no/api/paradise/v2/matchup/{match_id}
Stats: GET https://www.gamer.no/api/paradise/v2/matchup/{match_id}/stats?filter=map_number
Additional endpoints (Teams, Users, Heats) as needed for deeper stats or display.
Usage:
Scheduled or on-demand calls to fetch upcoming matches for user predictions.
Calls to fetch final results to calculate user points.
Constraints: Must not expose the personal token on the client side. All calls done from Next.js server routes or server components.
3. Key Features & Functionality
Match Predictions

Display Upcoming Matches: Pulled from the Good Game Ligaen API.
Pickems Form: Users select a winner before the match’s deadline.
Submission & Locking: Picks are stored in Supabase, locked at match start time.
Scoring System

Correct Prediction: +X points (configurable).
Bonus Conditions (if applicable): Extra points for correct margin, perfect round, etc.
Automatic Calculation: Once a match final result is updated (via the Good Game Ligaen API), the system updates user points in Supabase.
Leaderboard

Aggregated Points: Sorted in descending order.
Filters: Overall, weekly, monthly, or by user’s friend group (optional).
User’s Rank: Display the user’s position relative to others.
Social Sharing

Share Picks: Generate a shareable snapshot or link (e.g., a dynamic OG image).
Result Sharing: Share the user’s weekly or overall rank after matches conclude.
Platform Integration: Facebook, Twitter (X), Discord, etc.
User Profile & History

Auth-Guarded Pages: Display the user’s historical picks, total points, correct picks.
Profile Customization (optional future enhancement): Avatars, custom display name, etc.
Admin / Moderator Panel (Minimal)

Match Sync: Trigger manual re-sync with Good Game Ligaen API in case of discrepancies.
Points Override: Fix anomalies (e.g., if a match is canceled or rescheduled).
Basic Stats: Show number of active players, total picks, etc.
4. User Stories & Use Cases
User Story: Make a Pick

As a user, I want to see a list of upcoming Good Game Ligaen matches so that I can choose who will win and earn points for correct predictions.
Acceptance Criteria:
User can view match details (teams, time) fetched from the league API.
User can select a winner and confirm the pick.
User’s pick is saved in Supabase and cannot be changed after the match starts.
User Story: See My Points & Rank

As a user, I want to see how many points I’ve accumulated and my current position on the leaderboard.
Acceptance Criteria:
System updates user points immediately or soon after results are available.
Leaderboard is recalculated to reflect new totals.
User Story: Share to Social Media

As a user, I want to share my picks or my rank on social media, so I can compare with friends or invite them to join.
Acceptance Criteria:
“Share” button that generates a URL or an image preview.
Basic meta tags or OG image for improved social sharing.
Admin Use Case: Match Result Synchronization

As an admin or system process, I need to pull finished match results from the Good Game Ligaen API and update scores.
Acceptance Criteria:
A server-side function (cron job or manual trigger) that fetches all relevant matches from the API.
System updates user picks status (win/loss) and recalculates points.
5. Functional Requirements
5.1 Data Flows & Integration with Good Game Ligaen API
Server-Side Fetching

Securely store the Bearer <token> in environment variables (e.g., .env.local or a secure secret store).
Use Next.js server-side code (e.g., Route Handlers, server components) to call the league’s endpoints.
Scheduled Updates

Optionally implement a Next.js API route with Cron or serverless scheduler (e.g., Vercel Cron) to periodically update match results and user scores.
Match Data

Schema (in Supabase) could include:
matches table: match_id (API ID), teams, start_time, status, winner, etc.
picks table: user_id, match_id, predicted_team, actual_result, points_earned.
Supabase Database Schema (High-Level)

users
id (uuid, PK)
email
username
(Other standard auth fields)
picks
id (uuid, PK)
user_id (FK to users)
match_id (FK to matches)
predicted_winner_id (team id or string)
points_awarded (integer)
is_correct (boolean)
matches
id (uuid, PK) — or store the exact match ID from the API
gg_ligaen_api_id (integer or string)
team1_id, team2_id
start_time (timestamp)
result (string or enumerated type)
winner_id (integer or string referencing a team)
Points Calculation

A background job or function listens for final results from Good Game Ligaen API.
For each match in finished status:
Retrieve winner_id from the API.
Compare winner_id to user’s predicted_winner_id.
If correct, set is_correct to true, add X points to points_awarded.
Aggregate points for leaderboards.
5.2 Leaderboards & Rankings
Real-Time or On-Demand:

Could recalculate for each user whenever a match finishes or on a scheduled basis.
Store aggregated points in profiles or a specialized rankings table for quick retrieval.
Filtering:

By season, round, or total points.
Potential for private groups in future enhancements.
5.3 Social Sharing
Implementation:
Use Next.js Dynamic OG images or a standard meta tag approach to generate shareable content.
Provide a “Share” button with pre-filled text, hashtags, or link back to the site.
5.4 Security & Privacy
API Token:
Never exposed to the client. All requests are made through Next.js server-side logic.
Supabase:
Use Row-Level Security (RLS) to ensure only the owner can read/write their picks.
Environment Variables:
Store the Good Game Ligaen token as GOOD_GAME_LIGAEN_TOKEN in a secure place.
6. Non-Functional Requirements
Performance

Page loads under 2 seconds.
Efficient data fetching with Next.js server components & caching (e.g., revalidate on set intervals).
Scalability

Vercel or similar hosting for Next.js, with automatic scaling for traffic spikes.
Supabase for horizontally scalable database solutions.
Reliability

99%+ uptime.
Redundant caching or fallback in case the Good Game Ligaen API is temporarily unavailable.
Accessibility & UI/UX

TailwindCSS & shadcn for consistent design patterns.
WCAG 2.1 guidelines to make the platform accessible to all users.
Maintainability

Clear separation of concerns: UI in Next.js pages/components, API integration in server routes, data in Supabase.
Document code architecture and any custom logic thoroughly.
7. High-Level User Flows
7.1 User Registration & Login
User navigates to the site.
User signs up or logs in via Supabase Auth (email/password, social providers if configured).
Supabase session is established, user is redirected to the Home/Pickems page.
7.2 Viewing & Making Predictions
System fetches upcoming matches from Good Game Ligaen API (server-side).
Renders a list of matches on the Next.js page.
Authenticated user selects a winner for each match.
Picks are stored in Supabase (picks table).
7.3 Leaderboard & Rankings
User clicks on “Leaderboard.”
Next.js server fetches aggregated scores from Supabase.
Returns a list of top users and the viewer’s own rank.
7.4 Match Result & Points Update (Admin Flow or Automated)
Background function calls Good Game Ligaen API to get completed matches.
Updates the matches table in Supabase, sets winner_id.
A scoring function awards points to users with correct picks.
Leaderboard is recalculated.
7.5 Social Sharing
On the predictions or results page, user clicks “Share.”
System generates a shareable link or dynamic OG image with user’s picks/points.
User shares via Twitter, Facebook, Discord, etc.

9. Potential Risks & Mitigation
API Rate Limits: If Good Game Ligaen imposes strict rate limits, caching or careful scheduling might be required.

Mitigation: Use revalidation in Next.js (ISR) or serverless Cron to limit direct calls.
Token Security: Exposing the token is a major risk.

Mitigation: Store it only in server environment variables. Do not use it in client-side code.
Data Accuracy: Inconsistent or delayed data from Good Game Ligaen API.

Mitigation: Implement retries or fallback states. Communicate partial data on the frontend gracefully.
Scalability & Traffic Spikes: High user volume around match times.

Mitigation: Host on a scalable platform (Vercel), optimize queries, and enable caching.
User Friction: Complexity in the user flow if they must sign up just to view or share picks.

Mitigation: Allow limited “guest” predictions or viewing before requiring sign-up to store picks.
10. KPIs & Success Metrics
Number of Active Participants: Unique users making picks each round.
Engagement Rate: Average number of matches picked per user.
Leaderboard Views: Frequency of visits to the leaderboard page.
Social Shares: Count of posts or link shares from the platform.
Retention: Percentage of users returning for subsequent rounds.
11. Future Enhancements
Private Leagues/Friend Groups: Let users create or join mini-leagues.
Mobile App / Notifications: Send push notifications before match deadlines.
In-depth Stats & Analysis: Integrate advanced stats from the Good Game Ligaen API (e.g., team performance, head-to-head).
Rewards / Prizes: Partner with sponsors for awarding top participants.
Additional Games / Competitions: Expand the pickems system to other leagues or tournaments.