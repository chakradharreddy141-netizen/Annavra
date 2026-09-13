# Annavra

**Annavra** is an advanced, AI-powered health, fitness, and sports-nutrition tracking ecosystem. Built with a strict Zero-Trust architecture, it ensures data integrity through server-side mathematical calculations and PostgreSQL atomic transactions. 

Whether you are logging your daily meals via AI-vision scanning or tracking your weightlifting volume on an interactive anatomy map, Annavra is designed to be the ultimate single source of truth for your physiological data.

![Annavra Architecture](https://img.shields.io/badge/Architecture-Zero--Trust-emerald?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)

## 🚀 Core Features

### 🍎 AI-Powered Nutrition Scanning
Upload a picture of your plate, and Annavra's integration with **Google Gemini Vision** automatically analyzes the image, identifies the food, and returns precise macro-nutrients (Calories, Protein, Carbs, Fat, Fiber).
- **Edge Compression:** Images are compressed and resized on the edge using `sharp` to minimize bandwidth and latency.
- **Strict Data Validation:** All AI responses are forced into a strict, validated JSON schema before hitting the database.

### 🏋️‍♂️ Interactive Muscle Anatomy & Workouts
Track your strength training with a built-in SVG Muscle Map that lights up dynamically based on the exercises you log.
- **Custom Exercises:** Don't see your lift? Create a custom exercise and tag the *Primary* and *Secondary* muscles it targets to see it reflected on your body map.
- **Volume Tracking:** Log reps, weight, and track Personal Records (PRs) over time.

### 🔒 Zero-Trust Architecture & Data Integrity
The client browser is never trusted to perform mathematical operations.
- **Server-Authoritative Math:** All macronutrient calculations, TDEE/BMR derivation, and daily summary aggregations happen strictly on the server.
- **Atomic PostgreSQL RPCs:** Logging meals or workouts triggers secure Supabase RPC functions (`log_meal_transaction`, `log_workout_transaction`), guaranteeing that your daily summaries perfectly match your individual logs with zero race conditions.
- **Timezone-Aware:** A central `getUserLocalDate` utility guarantees that late-night meals don't accidentally bleed into the next day due to UTC drift.

### 🎯 Dynamic Physiological Versioning
As your weight and activity levels change, your targets change with you.
- Uses the **Mifflin-St Jeor Equation** to calculate precise Base Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).
- Manages historical versioning of your goals, so you can see what your targets were 6 months ago vs. today.

---

## 🛠️ Technology Stack

* **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, Tailwind CSS, Lucide React (Icons)
* **Backend:** [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage, RPCs)
* **AI:** Google Gemini API
* **Image Processing:** `sharp`

---

## 💻 Local Development

### 1. Clone & Install
```bash
git clone https://github.com/chakradharreddy141-netizen/Annavra.git
cd Annavra
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 🛡️ Security Hardening (P0 Spec)
Annavra recently underwent a massive **P0 Security & Architecture Hardening** review, resulting in:
- Fully stripped client-provided `user_id`s in favor of strictly reading from the secure Supabase Session.
- Implementation of an in-memory API rate limiting table for the AI scanner (max 20 scans/hr).
- Full database `CHECK` constraints to ensure macros and quantities can never drop below zero.
- Transition from client-side UI math to strict server-side aggregation.

---

## 🤝 Contributions
Feel free to open an issue or submit a Pull Request if you'd like to contribute to Annavra's growth!
