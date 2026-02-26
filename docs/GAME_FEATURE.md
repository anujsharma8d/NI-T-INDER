# Game Feature - Two Truths and a Lie (Interactive Edition)

A highly interactive and engaging icebreaker game for matched users with animations, sound effects, and real-time feedback.

## How It Works

1. When two users match, they can start a game from the chat interface by clicking the 🎮 icon
2. Each player submits 3 statements about themselves (2 truths and 1 lie)
3. Once both players submit, they try to guess which statement is the other person's lie
4. Results are revealed with celebratory animations showing if they guessed correctly
5. Players can play again as many times as they want

## Interactive Features

### Visual Feedback
- **Smooth Animations**: Fade-in, slide-in, and scale effects throughout the game
- **Progress Indicators**: Visual progress bar showing game stages (Submit → Wait → Guess)
- **Confetti Celebration**: Animated confetti when guessing correctly
- **Shake Animation**: Visual feedback for wrong guesses or errors
- **Hover Effects**: Interactive button states with smooth transitions
- **Color-Coded Results**: Green for truths, red for lies, gold for your guess

### Sound Effects (Optional)
- **Toggle Control**: 🔊/🔇 button to enable/disable sounds
- **Click Sounds**: Subtle feedback for button interactions
- **Submit Sound**: Musical chime when submitting statements
- **Success Sound**: Triumphant melody for correct guesses
- **Wrong Sound**: Gentle buzz for incorrect guesses
- **Hover Sounds**: Soft tones when hovering over options

### Real-Time Updates
- **Auto-Polling**: Automatically checks if opponent has submitted (every 3 seconds)
- **Typing Indicator**: Animated dots showing when waiting for opponent
- **Live Status**: Real-time game state synchronization

### User Experience
- **First-Time Tutorial**: Helpful tooltip explaining game rules for new players
- **Character Counter**: Shows remaining characters for each statement (200 max)
- **Loading States**: Smooth spinner animations during data fetching
- **Error Handling**: Clear, animated error messages with visual feedback
- **Responsive Design**: Works beautifully on all screen sizes

### Visual Design
- **Gradient Backgrounds**: Beautiful purple-to-pink gradient theme
- **Glassmorphism**: Frosted glass effects for modern look
- **Animated Background**: Subtle rotating gradient overlay
- **Floating Particles**: Decorative sparkle effects
- **Shadow Effects**: Depth and dimension with dynamic shadows

## Technical Implementation

### Backend (Server)

**Database Tables:**
- `game_sessions` - Stores game instances with status tracking
- `game_responses` - Stores player submissions (statements and lie index)

**API Endpoints:**
- `POST /games` - Create new game session
- `GET /games/:matchId` - Get all games for a match
- `GET /games/session/:sessionId` - Get specific game with responses
- `POST /games/session/:sessionId/response` - Submit player response
- `PUT /games/session/:sessionId/complete` - Mark game as completed

**Files Modified/Created:**
- `server/db/setup.js` - Added game tables and indexes
- `server/controllers/game.js` - Game controller with all endpoints
- `server/server.js` - Registered game routes

### Frontend (Client)

**Components:**
- `TwoTruthsLie.jsx` - Main game component with full interactive flow
- `Game.css` - Comprehensive styling with animations and effects
- `GameSounds.js` - Web Audio API sound effects system

**Key Features:**
- State management for all interactive elements
- Polling mechanism for real-time updates
- Animation orchestration with timed sequences
- Sound effect integration with user control
- Progress tracking and visual indicators

**Files Modified/Created:**
- `client/src/children/modules/functional/Games/TwoTruthsLie.jsx`
- `client/src/children/modules/functional/Games/Game.css`
- `client/src/children/modules/functional/Games/GameSounds.js`
- `client/src/children/modules/functional/Matches/ChatHeader.jsx`
- `client/src/children/modules/functional/Matches/ChatPage.jsx`
- `client/src/children/modules/functional/Matches/ViewAllMatches.jsx`
- `client/src/children/modules/functional/Matches/Chat.css`

## Usage

1. Navigate to the chat with a matched user
2. Click the game controller icon (🎮) in the chat header
3. (Optional) Enable sound effects with the 🔊 button
4. Read the tutorial if it's your first time
5. Fill in your three statements and mark which one is the lie
6. Submit and watch the smooth animation
7. Wait for your match (with live typing indicator)
8. Guess which of their statements is the lie
9. Enjoy the celebration or commiseration animation
10. Play again with one click!

## Animation Timeline

**Submit Phase:**
- Statements slide in sequentially (0.1s delay each)
- Submit button has ripple effect on hover
- Success checkmark scales in on submission

**Waiting Phase:**
- Progress bar animates to show current stage
- Typing dots pulse while waiting
- Statement previews slide in with color coding

**Guessing Phase:**
- Opponent's statements slide in with stagger
- Hover effects with shimmer animation
- Click triggers immediate visual feedback

**Results Phase:**
- 1s delay for suspense
- Confetti explosion for correct guess (3s duration)
- Shake animation for wrong guess (0.5s)
- Results reveal with scale animation
- Final statements slide in with badges

## Browser Compatibility

- Modern browsers with CSS animations support
- Web Audio API for sound effects (graceful degradation)
- LocalStorage for tutorial preference
- Responsive design for mobile and desktop

## Performance Optimizations

- CSS animations (GPU-accelerated)
- Debounced polling (3s intervals)
- Cleanup of intervals on unmount
- Optimized re-renders with proper state management
- Lazy sound initialization (only when enabled)

## Future Enhancements

Potential additions to expand the game feature:
- More game types (Would You Rather, 20 Questions, Never Have I Ever)
- Leaderboards and statistics tracking
- Time limits for responses with countdown timer
- Hints system for difficult guesses
- Share game results in chat as message
- Game achievements/badges system
- Multiplayer tournaments
- Custom game themes and skins
- Voice recording for statements
- Photo/GIF support in statements
