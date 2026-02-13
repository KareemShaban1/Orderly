## Gamified Experiences for QR Order

This document describes an idea to add **games and gamification** to the QR Order system to:

- **Entertain customers** while they browse / wait
- **Support marketing** (promos, brand awareness, seasonal campaigns)
- **Reward loyalty** with gifts, discounts, and points

The focus is on games that are:
- **Lightweight** (mobile-friendly, quick rounds)
- **Contextual** to restaurants / cafés
- **Safe** (no gambling, no offensive content)
- **Engaging** (skill-based, challenging, fun)

### ✅ Implemented: Games Module in Super Admin

- **Super Admin → Games** (`/admin/super-admin/games`): Manage games and assign them to organizations.
- **9 games only** (old restaurant-themed games removed). Each game has **3 levels** (Easy / Medium / Hard).
- **Backend**: `games` table, `game_tenant` pivot, API under `/api/super-admin/games`. Run `php artisan db:seed --class=GameSeeder --force` to reset and seed the 9 games.
- **Frontend**: `GamePlayer` + `LevelSelect`; each game shows level choice then runs with level-specific config.

**Games (all with Level 1 / 2 / 3):**
- **Reaction Time** – Tap when green. Levels: 3 / 5 / 8 rounds.
- **2048 Merge** – Merge tiles. Levels: target 512 / 1024 / 2048.
- **Snake** – Eat dots, avoid walls. Levels: slow / medium / fast + grid size.
- **Flappy Dodge** – Tap to fly. Levels: pipe speed slow / medium / fast.
- **Aim Trainer** – Click targets. Levels: 5 in 25s / 10 in 30s / 15 in 28s.
- **Simon Says** – Repeat sequence. Levels: 5 / 8 / 12 max rounds.
- **Word Scramble** – Unscramble words. Levels: 3 words 20s / 5 words 15s / 7 words 12s.
- **Quick Math** – Solve math. Levels: 8 rounds 8s / 12 rounds 5s / 18 rounds 4s.
- **Whack-a-Mole** – Tap moles. Levels: 25s slow / 20s / 15s fast.

---

## 1. Core Gamification Concept

- **When**: Customers play while:
  - Waiting for food after ordering
  - Browsing the menu
  - After paying / viewing receipt
- **Where**:
  - In the **Guest app** (port 5173) after scanning the QR
  - Optionally in the **Landing app** (port 5176) for marketing campaigns
- **What**:
  - Engaging, skill-based games (30 seconds - 5 minutes)
  - Tied to **rewards**: points, coupons, free items, or badges

---

## 2. Game Types - Comprehensive Collection (27+ Engaging Games)

### 🎯 Skill-Based Games (More Engaging)

#### 1. **Chef's Memory Match**
- **Type**: Memory card game
- **Mechanics**: Flip cards to match pairs of menu items (burger + fries, pizza + soda, etc.)
- **Difficulty**: 3 levels (6 pairs → 12 pairs → 18 pairs)
- **Time Limit**: 60-90 seconds per level
- **Reward**: Score-based (perfect match = higher reward chance)
- **Why Interesting**: Tests memory, gets harder, restaurant-themed visuals

#### 2. **Ingredient Collector**
- **Type**: Arcade-style falling objects game
- **Mechanics**: Tap/swipe to catch correct ingredients falling from top
- **Challenge**: Avoid wrong ingredients, collect combos for bonus points
- **Speed**: Increases over time
- **Reward**: Points-based tier system (100 pts = small discount, 500 pts = free item)
- **Why Interesting**: Fast-paced, skill-based, addictive gameplay

#### 3. **Recipe Builder Challenge**
- **Type**: Strategy puzzle game
- **Mechanics**: Given ingredients, build the best recipe within time limit
- **Scoring**: Correct combinations = points, rare combos = bonus
- **Difficulty**: 3-5 rounds, each harder
- **Reward**: Score determines reward tier
- **Why Interesting**: Strategic thinking, educational (learns menu items)

#### 4. **Tap Timing Master**
- **Type**: Rhythm/timing game
- **Mechanics**: Tap at perfect timing to "cook" dishes
- **Patterns**: Follow visual/audio cues (like Guitar Hero but simpler)
- **Combo System**: Perfect taps build combos for multipliers
- **Reward**: Accuracy-based (90%+ accuracy = guaranteed reward)
- **Why Interesting**: Tests reflexes, satisfying rhythm gameplay

#### 5. **Swipe Chef**
- **Type**: Swipe-based action game
- **Mechanics**: Swipe ingredients into correct cooking stations
- **Challenge**: Multiple ingredients, wrong station = lose points
- **Speed**: Gets faster, more ingredients per round
- **Reward**: Survival-based (survive 30 seconds = reward)
- **Why Interesting**: Fast reflexes, visual feedback, engaging

#### 6. **Food Word Search / Crossword**
- **Type**: Word puzzle game
- **Mechanics**: Find menu items hidden in grid OR solve crossword clues
- **Difficulty**: Easy (5 words) → Hard (15+ words)
- **Time Bonus**: Faster completion = bonus points
- **Reward**: Completion-based with time bonus
- **Why Interesting**: Brain teaser, educational, relaxing

#### 7. **Kitchen Rush Simulator**
- **Type**: Multi-stage challenge game
- **Mechanics**: Complete 3 mini-games in sequence:
  1. **Prep**: Match ingredients to dishes (memory)
  2. **Cook**: Tap timing to cook perfectly (rhythm)
  3. **Serve**: Swipe dishes to correct tables (speed)
- **Reward**: Complete all 3 stages = guaranteed reward
- **Why Interesting**: Multi-skill challenge, feels like achievement

#### 8. **Flavor Match Puzzle**
- **Type**: Pattern recognition game
- **Mechanics**: Match flavor profiles (sweet, spicy, sour, etc.)
- **Challenge**: Increasingly complex patterns (3 → 5 → 7 items)
- **Time Pressure**: Limited time per pattern
- **Reward**: Perfect matches unlock better rewards
- **Why Interesting**: Tests pattern recognition, visually appealing

#### 9. **Order Master Speed Challenge**
- **Type**: Speed/accuracy game
- **Mechanics**: Customers order items, player must tap correct items quickly
- **Challenge**: Multiple orders, increasing speed
- **Accuracy**: Wrong taps = penalty, correct = points
- **Reward**: Score-based tier system
- **Why Interesting**: Tests speed + accuracy, restaurant-themed

#### 10. **Meal Combo Strategist**
- **Type**: Strategic planning game
- **Mechanics**: Given budget, build best meal combo
- **Scoring**: Balance nutrition, price, customer satisfaction
- **Challenge**: Multiple rounds with different constraints
- **Reward**: High score = discount on next order
- **Why Interesting**: Strategic thinking, educational about menu

### 🎲 Luck + Skill Hybrid Games

#### 11. **Spin & Win Wheel** (Enhanced)
- **Type**: Luck-based with skill modifier
- **Mechanics**: Spin wheel, but player can "aim" by timing the spin
- **Skill Element**: Better timing = better segment probability
- **Reward**: Segments vary (5% discount → 50% discount, free items)
- **Why Interesting**: Adds skill element to luck game

#### 12. **Scratch Card** (Enhanced)
- **Type**: Reveal game with mini-challenge
- **Mechanics**: Scratch card, but must complete mini-game to reveal prize
- **Mini-Game**: Quick tap sequence or pattern match
- **Reward**: Always wins something, but challenge determines quality
- **Why Interesting**: Combines luck with skill challenge

### 🧩 Puzzle & Brain Games

#### 13. **Menu Item Jigsaw Puzzle**
- **Type**: Jigsaw puzzle game
- **Mechanics**: Assemble puzzle of menu items
- **Difficulty**: 9 pieces → 16 pieces → 25 pieces
- **Time Bonus**: Faster completion = bonus
- **Reward**: Completion-based
- **Why Interesting**: Relaxing, visual, promotes menu awareness

#### 14. **Chef's Math Challenge**
- **Type**: Math puzzle game
- **Mechanics**: Calculate order totals, ingredient quantities, etc.
- **Difficulty**: Simple addition → percentages → complex calculations
- **Time Limit**: 30-60 seconds per round
- **Reward**: Accuracy-based
- **Why Interesting**: Educational, practical math skills

#### 15. **Food Chain Builder**
- **Type**: Logic puzzle game
- **Mechanics**: Arrange dishes in correct order (appetizer → main → dessert)
- **Challenge**: Multiple constraints (dietary, price, time)
- **Reward**: Perfect arrangement = guaranteed reward
- **Why Interesting**: Logical thinking, menu knowledge

### 🎮 Arcade-Style Games

#### 16. **Table Service Simulator**
- **Type**: Mini management game
- **Mechanics**: Manage multiple tables, serve orders, keep customers happy
- **Challenge**: Balance speed vs. accuracy, avoid mistakes
- **Scoring**: Customer satisfaction + speed = points
- **Reward**: High score = discount tier
- **Why Interesting**: Engaging simulation, tests multi-tasking

#### 17. **Ingredient Stacker**
- **Type**: Stacking game (like Tetris but simpler)
- **Mechanics**: Stack ingredients to build tallest tower
- **Challenge**: Balance prevents collapse, wrong ingredients = penalty
- **Reward**: Height-based (reach 10 levels = reward)
- **Why Interesting**: Classic arcade feel, addictive

#### 18. **Flavor Mix Master**
- **Type**: Mixing/combination game
- **Mechanics**: Combine ingredients to create target flavor profile
- **Challenge**: Limited ingredients, must find correct combination
- **Hints**: Can use hints (costs points)
- **Reward**: Perfect match = best reward
- **Why Interesting**: Creative, experimental gameplay

### 🏆 Progressive & Multi-Stage Games

#### 19. **Chef's Journey RPG-Lite**
- **Type**: Progressive adventure game
- **Mechanics**: Complete challenges to "level up" chef character
- **Stages**: 
  - Level 1: Learn basics (tutorial games)
  - Level 2: Master skills (harder challenges)
  - Level 3: Become expert (expert-level games)
- **Reward**: Level completion unlocks better rewards
- **Why Interesting**: Long-term engagement, sense of progression

#### 20. **Daily Challenge Series**
- **Type**: Rotating daily challenges
- **Mechanics**: Different game each day, complete to unlock reward
- **Variety**: Monday = Memory, Tuesday = Speed, Wednesday = Puzzle, etc.
- **Streak Bonus**: Complete 7 days = bonus reward
- **Reward**: Daily reward + streak bonus
- **Why Interesting**: Keeps users coming back, variety

### 🎯 Competitive & Social Games

#### 21. **Table vs Table Challenge**
- **Type**: Competitive multiplayer (same restaurant)
- **Mechanics**: Tables compete in same game, highest score wins
- **Reward**: Winner gets shared reward (free appetizer for table)
- **Why Interesting**: Social element, encourages group play

#### 22. **Restaurant Leaderboard**
- **Type**: Competitive ranking
- **Mechanics**: Players compete for high scores, weekly leaderboard
- **Rewards**: Top 3 players get special rewards
- **Why Interesting**: Competitive drive, repeat engagement

### 🎨 Creative & Unique Games

#### 23. **Menu Item Guessing Game**
- **Type**: Trivia + guessing game
- **Mechanics**: Show blurred/partial image, guess menu item
- **Difficulty**: Easy (clear image) → Hard (very blurred)
- **Hints**: Can use hints (costs points)
- **Reward**: Correct guesses = points, perfect round = reward
- **Why Interesting**: Promotes menu exploration, fun discovery

#### 24. **Flavor Profile Matcher**
- **Type**: Sensory matching game
- **Mechanics**: Match dishes to flavor descriptions (sweet, spicy, etc.)
- **Challenge**: Increasingly subtle differences
- **Reward**: Accuracy-based
- **Why Interesting**: Educational, helps customers understand menu

#### 25. **Chef's Recipe Roulette**
- **Type**: Creative challenge game
- **Mechanics**: Given random ingredients, create best recipe
- **Scoring**: Creativity + feasibility + customer appeal
- **Reward**: Top recipes get featured (optional) + reward
- **Why Interesting**: Creative outlet, user-generated content potential

#### 26. **Trivia Quiz Master** (Enhanced)
- **Type**: Multi-round trivia game
- **Mechanics**: 10 questions about food, cooking, restaurant culture
- **Difficulty**: Progressive (easy → hard)
- **Lifelines**: 2 hints per game
- **Reward**: Score-based (8+ correct = guaranteed reward)
- **Why Interesting**: Educational, tests knowledge

#### 27. **Food Emoji Puzzle**
- **Type**: Emoji-based guessing game
- **Mechanics**: Guess menu items from emoji combinations
- **Challenge**: Increasingly complex emoji sequences
- **Time Limit**: 30 seconds per item
- **Reward**: Correct guesses unlock rewards
- **Why Interesting**: Fun, modern, shareable

---

### 📊 Game Difficulty & Duration Summary

| Game Type | Difficulty | Duration | Skill Level | Engagement Level |
|-----------|-----------|----------|-------------|------------------|
| Memory Match | Medium | 60-90s | Beginner-Friendly | ⭐⭐⭐⭐ |
| Ingredient Collector | Hard | 30-60s | Fast Reflexes | ⭐⭐⭐⭐⭐ |
| Recipe Builder | Medium-Hard | 90-120s | Strategic | ⭐⭐⭐⭐ |
| Tap Timing | Hard | 45-60s | Rhythm Skills | ⭐⭐⭐⭐⭐ |
| Swipe Chef | Medium | 30-45s | Quick Reactions | ⭐⭐⭐⭐ |
| Word Search | Easy-Medium | 60-120s | Relaxing | ⭐⭐⭐ |
| Kitchen Rush | Hard | 120-180s | Multi-Skill | ⭐⭐⭐⭐⭐ |
| Flavor Match | Medium | 45-60s | Pattern Recognition | ⭐⭐⭐⭐ |
| Order Master | Hard | 30-45s | Speed + Accuracy | ⭐⭐⭐⭐⭐ |
| Meal Combo | Medium | 60-90s | Strategic | ⭐⭐⭐⭐ |
| Table Service | Hard | 90-120s | Multi-Tasking | ⭐⭐⭐⭐⭐ |
| Chef's Journey | Progressive | 5-10 min | Long-term | ⭐⭐⭐⭐⭐ |
| Jigsaw Puzzle | Easy-Medium | 90-180s | Relaxing | ⭐⭐⭐ |
| Math Challenge | Medium-Hard | 30-60s | Mental Math | ⭐⭐⭐⭐ |
| Food Chain | Medium | 60-90s | Logic | ⭐⭐⭐⭐ |
| Ingredient Stacker | Medium | 45-60s | Arcade | ⭐⭐⭐⭐ |
| Flavor Mix | Hard | 60-90s | Creative | ⭐⭐⭐⭐ |
| Daily Challenge | Varies | 60-120s | Varies | ⭐⭐⭐⭐⭐ |
| Table vs Table | Medium-Hard | 60-90s | Competitive | ⭐⭐⭐⭐⭐ |
| Menu Guessing | Medium | 45-60s | Visual | ⭐⭐⭐⭐ |
| Recipe Roulette | Hard | 90-120s | Creative | ⭐⭐⭐⭐ |

---

### 🎯 Quick Games (30-45 seconds)
- Spin & Win Wheel (Enhanced)
- Scratch Card (Enhanced)
- Tap Timing (quick round)
- Swipe Chef (short round)
- Order Master (speed round)

### 🎮 Medium Games (60-90 seconds)
- Memory Match
- Recipe Builder
- Word Search
- Flavor Match
- Meal Combo Strategist
- Food Chain Builder

### 🏆 Long Games (2-5 minutes)
- Kitchen Rush Simulator
- Chef's Journey (multi-stage)
- Table Service Simulator
- Daily Challenge Series
- Chef's Recipe Roulette

---

## 3. Where to Integrate in Current Flows

- **Guest App (Customers)**
  - After scanning QR and placing an order:
    - Show a "Play & Win" button on **order confirmation** page.
  - On **order status** page while waiting:
    - Show a non-intrusive banner: "Play a quick game while you wait".
  - On **receipt** page:
    - Offer a "Thank you" game to win voucher for next visit.

- **Admin Dashboard**
  - New section: **Gamification & Campaigns**
    - Configure game types per branch
    - Define rewards and probability
    - See engagement analytics (plays, wins, conversions)

- **Landing Page**
  - Optional: global or restaurant-specific public campaigns
    - Seasonal events: Ramadan, Christmas, local events
    - "Play to discover restaurants" quiz / wheel

---

## 4. Technical Implementation Plan (High-Level)

### 4.1 Data Model (Backend)

- **Tables / Models** (examples):
  - `games`
    - `id`, `name`, `type` (memory_match, ingredient_collector, recipe_builder, etc.)
    - `tenant_id`, `branch_id`
    - `config` (JSON: difficulty levels, time limits, scoring rules)
    - `is_active`, `start_at`, `end_at`
  - `game_rewards`
    - `id`, `game_id`, `label`, `reward_type` (discount, item, points, none)
    - `value` (e.g. 10% or "free drink" SKU)
    - `probability` (0–1) OR `score_threshold` (for skill-based)
    - `max_daily_per_tenant`, `max_daily_per_user`
  - `game_sessions`
    - `id`, `game_id`, `tenant_id`, `branch_id`, `order_id` (nullable)
    - `user_identifier` (e.g. hashed device, anonymous id)
    - `score`, `result` (won / lost), `reward_id` (nullable)
    - `created_at`, `completed_at`
  - `vouchers` / `reward_redemptions`
    - Track actual redemption to avoid abuse.

### 4.2 API Endpoints

- `POST /api/games/start`
  - Input: `order_id` or `table_id` + game type
  - Checks:
    - Is game enabled for tenant/branch?
    - Has user already played for this order/session (anti-abuse)?
  - Returns: game config and a `game_session_id`.

- `POST /api/games/complete`
  - Input: `game_session_id`, `client_result` (score, moves, time, etc.)
  - Server:
    - Validates correctness (avoid client cheating).
    - Determines final reward using probability rules OR score thresholds.
    - Creates `reward` / `voucher` if any.
  - Returns:
    - `won`: true/false
    - `score`: final score
    - `reward`: type, value, voucher code, expiry, conditions.

- `GET /api/games/active` - List available games per tenant/branch
- `GET /api/games/leaderboard` - Get leaderboard for competitive games

### 4.3 Frontend (Guest App)

- **Components / Pages**:
  - `GamesEntry` component:
    - Shown on **Order Confirmation**, **Order Status**, **Receipt** pages.
  - Individual game components:
    - `GameMemoryMatch`, `GameIngredientCollector`, `GameRecipeBuilder`, etc.
  - `RewardsModal`:
    - Displays win/lose message, reward details, QR/Code for future use.

- **Flow**:
  1. User finishes order → sees "Play & Win" button.
  2. Click → call `POST /api/games/start`.
  3. Render chosen game using config.
  4. On finish → call `POST /api/games/complete` with score/results.
  5. Show result + update UI (badge, voucher, etc.).

### 4.4 Admin UI

- New menu in Admin Dashboard: **Marketing → Gamification**
  - Configure:
    - Which **games** are active per branch
    - Reward types + probabilities OR score thresholds
    - Conditions: minimum bill, time of day, specific weekdays
  - Analytics:
    - `plays_count`, `win_rate`, `redemption_rate`, `average_score`
    - Impact on average order size / frequency (later enhancement).

---

## 5. Step-by-Step Implementation Roadmap

### Phase 1 – MVP (2-3 engaging games)

1. **Backend**
   - Add basic tables: `games`, `game_sessions`, `game_rewards`.
   - Implement 2-3 games: Memory Match, Ingredient Collector, Tap Timing
   - Implement `/api/games/start` and `/api/games/complete`.
2. **Guest Frontend**
   - Add "Play & Win" entry on **Order Confirmation** page.
   - Implement game components with proper scoring.
   - Show reward banner / modal on win.
3. **Admin**
   - Minimal UI:
     - On/Off toggle for games per branch.
     - Score threshold configuration for rewards.

### Phase 2 – Rewards & Vouchers

4. Add **voucher** / **coupon** model:
   - Code, discount type, expiration, conditions.
5. Integrate voucher usage in the **Guest App** & **POS/Admin**:
   - Apply voucher code at payment or order confirmation.
6. Add basic **limits**:
   - Max plays per order / per device / per day.

### Phase 3 – More Game Types & Personalization

7. Implement additional games:
   - Kitchen Rush Simulator, Recipe Builder, Table Service
8. Track simple **player profile** (anonymous):
   - Device fingerprint / browser storage ID.
   - Basic stats: games played, wins, high scores, achievements.
9. Add **A/B testing** possibility:
   - Different game types per branch or time.

### Phase 4 – Deep Analytics & Marketing

10. Admin reports:
    - Games played vs. orders.
    - Reward redemptions vs. revenue.
    - Impact on repeat visits (via anonymous device), if possible.
11. Marketing tools:
    - Schedule games for campaigns (dates, hours).
    - Create seasonal themes (Ramadan, holidays).
12. Competitive features:
    - Leaderboards, Table vs Table challenges.

---

## 6. Suggestions to Enhance / Grow the Idea

- **Loyalty Points System**
  - Each game win can grant points instead of (or in addition to) direct discounts.
  - Points → Redeem for items, discounts, or exclusive experiences.

- **Social Sharing (Careful, Optional)**
  - After winning, optionally show "Share your win" (WhatsApp, Instagram).
  - Use **deep links** or shareable images with restaurant branding.

- **Gamified Feedback**
  - Tie games to **feedback**:
    - Example: "Rate your experience and play to win a gift."
  - Helps collect more reviews while giving something back.

- **Team / Table Challenges**
  - Group games: e.g. if an entire table participates, they get a shared reward.
  - Could be as simple as a "team spin" with a better prize pool.

- **Story-based Campaigns**
  - Multi-step missions:
    - Visit 3 times this month
    - Try 2 new menu items
    - Give 1 feedback
    - Complete 5 games
  - Completing the mission unlocks a bigger reward.

- **Theming per Tenant**
  - Let each restaurant upload:
    - Custom icons for games
    - Colors and branding
    - Custom prize texts
    - Menu item images for games

- **Cross-Promotion**
  - Use games to promote:
    - New branches
    - New menu items
    - Partner brands (coffee brands, dessert suppliers).

- **Progressive Unlocks**
  - Unlock harder games by completing easier ones
  - Unlock better rewards by achieving high scores
  - Create a sense of progression and achievement

- **Seasonal Game Modes**
  - Special games during holidays (Ramadan, Christmas, etc.)
  - Limited-time challenges with exclusive rewards

---

## 7. Risks & Considerations

- **Regulation & Ethics**
  - Avoid anything that looks like gambling for money.
  - Keep odds transparent and rewards small but fun.
  - Ensure games are skill-based, not pure chance.

- **Abuse / Fraud**
  - Limit number of plays per order / device / day.
  - Validate outcome on the **server**, not only on client.
  - Use score thresholds and server-side validation for skill games.

- **Performance**
  - Keep games very lightweight:
    - No huge libraries.
    - Work well on mid/low-end phones and 3G/4G.
    - Optimize animations and graphics.

- **UX**
  - Games must be **optional**, never block the ordering flow.
  - Avoid noisy popups; use small prompts/banners.
  - Provide clear instructions and tutorials for complex games.

- **Addiction Concerns**
  - Don't make games too addictive or time-consuming.
  - Set reasonable time limits.
  - Focus on fun, not exploitation.

---

## 8. Quick Start for Implementation (Developer Checklist)

- **Backend**
  - [ ] Design and create `games`, `game_rewards`, `game_sessions` tables.
  - [ ] Implement `/api/games/start` and `/api/games/complete`.
  - [ ] Add game logic for Memory Match and Ingredient Collector.
  - [ ] Add simple seeder for demo games per demo tenant.

- **Guest Frontend**
  - [ ] Add "Play & Win" entry on order confirmation / status page.
  - [ ] Implement UI for Memory Match game.
  - [ ] Implement UI for Ingredient Collector game.
  - [ ] Integrate with APIs and show reward modal.

- **Admin Frontend**
  - [ ] Add "Gamification" section in Admin Dashboard.
  - [ ] Form to configure games and score thresholds.
  - [ ] Basic analytics dashboard.

- **QA**
  - [ ] Test multiple devices and browsers.
  - [ ] Test abuse scenarios (refresh spam, multiple plays, score manipulation).
  - [ ] Confirm rewards are correctly granted and redeemable.
  - [ ] Test game performance on low-end devices.

---

This document provides a comprehensive guide to implementing engaging, skill-based games in the QR Order system, moving beyond simple luck-based games to create a more interactive and rewarding customer experience.
