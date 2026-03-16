# Eid Jamaat Koi? (ঈদের জামাত কই?) 🕌

"Eid Jamaat Koi?" is a crowdsourced location-based Next.js application designed to help users quickly find nearby Eid prayer times in Bangladesh. The app allows users to see prayer times on a map, add new mosques, vote on verified times, and report mistakes.

## 🚀 Features
- **Map View:** Find mosques around you with React Leaflet and OpenStreetMap.
- **Prayer Status:** Distinguish upcoming times (green) from missed times (red).
- **Crowdsourcing:** Add your local mosque and time using Firebase Phone Authentication.
- **Verification:** Upvote correct prayer times and report incorrect ones.
- **Bilingual Support:** Full interface available in both Bangla and English.
- **Mobile First:** Designed as a responsive Progressive Web App (PWA).
- **Spam Protection:** Rate-limiting and strict GPS-proximity validation for all submissions.

## 🛠 Tech Stack
- **Framework:** Next.js 14 App Router (React 18)
- **Language:** TypeScript
- **Database:** PostgreSQL hosted on Supabase
- **ORM:** Prisma
- **Authentication:** Firebase Phone Number Auth
- **Map Integration:** react-leaflet with real-time geolocation
- **State Management:** Zustand
- **Styling:** Vanilla CSS design system with CSS Variables

## 💻 Running the Project Locally

### 1. Prerequisites
- Node.js (v18+)
- Postgres database (Supabase recommended)
- Firebase Project with Phone Authentication enabled

### 2. Setup
1. Clone this repository or use the generated files.
2. Run `npm install` inside the project folder.
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in all the keys in `.env.local` using your Firebase and Supabase credentials.

### 3. Database Migration
Setup the Prisma database schema:
```bash
npx prisma generate
npx prisma db push
```

### 4. Start the Application
Run the Next.js development server:
```bash
npm run dev
```
Visit http://localhost:3000 in your browser.

## 🤝 Contributing
1. Create a Firebase project and add your phone numbers to the testing list in Authentication settings.
2. Make sure you use the development variables to avoid charging the production database.
3. Submit a Pull Request with any enhancements.
