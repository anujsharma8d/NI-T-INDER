# NITinder

NITinder enables students to connect, match, and interact through an intuitive interface with gamified features.

## 🎯 Features

- **User Profiles**: Create and manage detailed dating profiles with photos and preferences
- **Smart Swiping**: Browse and swipe through profiles with real-time matching
- **Intelligent Matching**: AI-powered match suggestions based on preferences and compatibility
- **Live Chat**: Real-time messaging with matched users
- **Interactive Games**: Break the ice with fun games like "Two Truths and a Lie"
- **Date Suggestions**: AI-generated date ideas and conversation starters
- **Location-Based Features**: Find matches based on geographic proximity
- **Gender Preferences**: Customizable gender and preference settings
- **Secure Authentication**: OTP-based verification system

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI framework with React Router for navigation
- **Vite** - Modern build tool and dev server
- **CSS** - Responsive styling

### Backend
- **Node.js/Express** - RESTful API server
- **MongoDB** - NoSQL database
- **OpenAI/LangChain** - AI-powered features (date suggestions, recommendations)
- **Brevo** - Email service provider
- **Argon2** - Password hashing
- **JWT** - Authentication tokens

### Testing
- **Jest** - Unit testing framework
- **Supertest** - HTTP assertions for API testing

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance (local or Atlas)
- API keys for external services:
- OpenAI API (for AI features)
- Groq API (alternative AI provider)
- Brevo API (for email notifications)
- Google API (for OAuth if needed)

## 🚀 Getting Started

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file in the server directory with the following variables:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   FRONTEND_URL=http://localhost:5173
   OPENAI_API_KEY=your_openai_key
   GROQ_API_KEY=your_groq_key
   BREVO_API_KEY=your_brevo_key
   JWT_SECRET=your_jwt_secret
   ```

3. Initialize the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## 📚 Available Scripts

### Server

- `npm start` - Start the server with hot reload (using nodemon)
- `npm run db:push` - Initialize database schema
- `npm run db:seed` - Populate database with sample data
- `npm test` - Run test suite once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Client

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build locally

## 📁 Project Structure

```
NITinder/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── App.jsx      # Root component
│   │   └── main.jsx     # Entry point
│   └── public/          # Static assets
├── server/              # Node.js/Express backend
│   ├── controllers/     # Route handlers
│   ├── db/              # Database setup and seed
│   ├── middleware.js    # Authentication middleware
│   ├── server.js        # Express app setup
│   └── tests/           # Test files
├── docs/                # Documentation
│   ├── GAME_FEATURE.md
│   ├── OTP_SYSTEM.md
│   ├── LOCATION_FEATURE_FIX.md
│   └── ...
└── LICENSE              # MIT License
```

## 🔑 Key Features Documentation

- **[Game Integration Guide](docs/GAME_CHAT_INTEGRATION.md)** - How games work with chat
- **[Game Quick Start](docs/GAME_QUICK_START.md)** - Getting started with game features
- **[OTP System](docs/OTP_SYSTEM.md)** - Email-based OTP verification
- **[Gender Preferences](docs/GENDER_PREFERENCE_FEATURE.md)** - Setting up gender matching
- **[Location Features](docs/LOCATION_FEATURE_FIX.md)** - Location-based matching

## 🧪 Testing

### Running Tests

```bash
cd server
npm test              # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Test Files

- `test.controller.auth.js` - Authentication endpoints
- `test.controller.profile.js` - Profile management
- `test.controller.swipe.js` - Swiping mechanics
- `test.controller.match.js` - Matching system
- `test.controller.message.js` - Messaging features
- `test.controller.game.js` - Game features
- `test.controller.date-suggestions.js` - AI date suggestions

## 🔐 Authentication Flow

1. User registers or logs in with email
2. OTP is sent via email (Brevo)
3. User enters OTP for verification
4. JWT token is issued for subsequent requests
5. Passwords are hashed using Argon2

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/verify-otp` - Verify OTP

### Profiles
- `GET /profiles` - Get user profiles
- `GET /profiles/:id` - Get specific profile
- `PUT /profiles` - Update user profile

### Matches & Swiping
- `POST /swipes` - Record a swipe
- `GET /matches` - Get user's matches
- `GET /conversations` - Get message conversations

### Messaging
- `POST /messages` - Send a message
- `GET /messages/:conversationId` - Get conversation messages

### Games
- `POST /games/start` - Start a game session
- `POST /games/:id/answer` - Submit game answer

### AI Features
- `GET /date-suggestions/:matchId` - Get AI date suggestions

## 📝 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/nitinder

# API Keys
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
BREVO_API_KEY=xkeysib-...
JWT_SECRET=your-secret-key

# Database
DB_NAME=nitinder
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For issues and feature requests, please open an issue on GitHub.

---
