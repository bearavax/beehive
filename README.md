<<<<<<< HEAD
# 🐝 Beehive Wellington - Community Engagement Platform

A mobile-first community engagement platform that strengthens Wellington by gamifying civic participation through daily voting, event attendance, and local business discovery.

## 📱 Features

### Core Functionality
- **Daily Voting System**: Tournament-style voting on rotating categories (cafes, community initiatives, cycling routes, etc.)
- **Elo Rating Algorithm**: Comprehensive ranking system across all categories
- **Points & Rewards**: Earn points through voting, referrals, and event attendance
- **Get Involved Tab**: Community events discovery with QR check-in system
- **Results & Impact Tracking**: City-wide rankings and personal impact visualization
- **Privacy-First Social**: Friend connections, streak leaderboards, vote history sharing

### Technical Stack
- **Frontend**: React Native with Expo (iOS/Android)
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT-based auth system

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Git

### Backend Setup

1. **Clone and navigate to backend**
   ```bash
   cd beehive-wellington/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb beehive_wellington
   
   # Run schema
   psql beehive_wellington < src/database/schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Mobile App Setup

1. **Navigate to mobile app**
   ```bash
   cd beehive-wellington/BeehiveApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update API endpoint**
   - Edit `src/services/api.ts`
   - Update `API_BASE_URL` to your backend URL

4. **Start Expo development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Install Expo Go app on your phone
   - Scan QR code from terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📊 Database Schema

### Key Tables
- **users**: User accounts, points, voting streaks
- **categories**: Voting categories (cafes, initiatives, etc.)
- **vote_options**: Items to vote on with Elo ratings
- **daily_votes**: User voting records
- **events**: Community events with QR check-ins
- **partners**: Local businesses offering rewards
- **rewards**: Point-based reward system
- **reward_redemptions**: Redemption tracking

## 🏗️ Architecture

### Backend Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/         # API routes
│   ├── middleware/     # Auth & validation
│   ├── database/       # DB connection & schema
│   ├── utils/          # Elo rating algorithm
│   └── app.ts          # Express app setup
```

### Mobile App Structure
```
BeehiveApp/
├── src/
│   ├── screens/        # App screens
│   ├── navigation/     # Navigation setup
│   ├── services/       # API services
│   ├── components/     # Reusable components
│   └── types/          # TypeScript types
```

## 🎯 Key Features Implementation

### Daily Voting System
- Rotates categories daily using modulo arithmetic
- Tournament-style interface with 5 random options
- Prevents multiple votes per day per user
- Updates Elo ratings for all category options

### Elo Rating Algorithm
- Each vote treated as matches between selected vs non-selected options
- Dynamic K-factor for rating sensitivity
- Minimum rating floor to prevent extreme drops
- Category-specific rankings

### Points & Rewards System
- 1 point per daily vote + streak bonuses
- 5 points per successful referral
- 5-10 points per event QR check-in
- Partner-managed rewards with custom point values
- Secure redemption codes

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Voting
- `GET /api/votes/daily` - Get today's vote
- `POST /api/votes/submit` - Submit vote (authenticated)
- `GET /api/votes/results/:categoryId` - Get category results
- `GET /api/votes/trending` - Get trending options

### Partners & Rewards
- `GET /api/partners/rewards` - Get available rewards
- `POST /api/partners/redeem` - Redeem reward (authenticated)
- `GET /api/partners/redemptions` - Get user redemptions (authenticated)

### Events (Coming Soon)
- `GET /api/events` - Get community events
- `POST /api/events/checkin` - QR code check-in

## 🚦 Development Status

### ✅ Completed
- Project structure setup
- Database schema design
- Authentication system
- Daily voting with Elo ratings
- Points and rewards system
- Basic mobile app structure

### 🚧 In Progress
- Event management system
- QR code check-in functionality
- Results visualization
- Partner self-service portal

### 📋 Planned
- Push notifications
- Social features (friends, leaderboards)
- Advanced analytics
- Partner dashboard
- Admin panel

## 🤝 Partner Integration

Partners can:
1. Create account through partner registration
2. Upload rewards with custom point values
3. Generate QR codes for events
4. Validate redemption codes
5. Track engagement metrics

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- Rate limiting (planned)
- Secure redemption code generation

## 📱 Mobile App Features

- Clean, engaging UI optimizing for mobile-first experience
- Offline-capable voting (planned)
- Push notifications for daily votes (planned)
- QR code scanning for events
- Real-time vote tallies and trending indicators

## 🎨 Design Principles

- **Mobile-First**: Optimized for smartphone usage
- **Gamification**: Points, streaks, and friendly competition
- **Privacy-First**: No location tracking, optional data sharing
- **Community-Focused**: Strengthen local connections
- **Accessibility**: Clear UI, easy navigation

## 📈 Future Enhancements

- Machine learning for personalized recommendations
- Integration with Wellington City Council data
- Seasonal voting campaigns
- Business partnership expansion
- Community impact reporting
- Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♀️ Support

For support, email hello@beehivewellington.nz or open an issue on GitHub.

---

**Built with ❤️ for Wellington by the community, for the community.**
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 63ebfddc9b114e76e2e5cfba853bd62ffd05232b
