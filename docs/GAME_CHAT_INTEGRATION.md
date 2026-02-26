# Game Chat Integration

## Overview

The game now automatically sends notifications to the chat when key game events occur, keeping both players informed and engaged even when they're not actively in the game window.

## Chat Notifications

### 1. Game Started
**When:** A player opens the game for the first time with a match
**Message:** `🎭 Started a new game of Two Truths and a Lie! Let's play!`
**Purpose:** Notifies the other person that a game has been initiated

### 2. Statements Submitted
**When:** A player submits their 3 statements
**Message:** `🎮 I've submitted my statements for Two Truths and a Lie! Your turn!`
**Purpose:** Alerts the other player that it's their turn to submit statements

### 3. Correct Guess
**When:** A player guesses the lie correctly
**Message:** `🎉 I guessed correctly! The lie was: "[the actual lie statement]"`
**Purpose:** Shares the exciting result and reveals which statement was the lie

### 4. Wrong Guess
**When:** A player guesses incorrectly
**Message:** `😅 I guessed wrong! The lie was actually: "[the actual lie statement]"`
**Purpose:** Shares the result and reveals the truth

## Visual Styling

Game notification messages have special styling to stand out:
- Purple gradient background (matching game theme)
- Purple border with glow effect
- Subtle pulse animation on appearance
- Bold text for emphasis

## Technical Implementation

### Data Flow

```
Game Component (TwoTruthsLie)
    ↓
onSendGameNotification callback
    ↓
ViewAllMatches.sendGameNotification()
    ↓
POST /conversations/:id/messages
    ↓
Message appears in chat
```

### Props Chain

```
ViewAllMatches
├─ sendGameNotification function
├─ conversationId
    ↓
ChatPage
├─ onSendGameNotification prop
├─ conversationId prop
    ↓
TwoTruthsLie
└─ Calls onSendGameNotification() at key moments
```

### Modified Files

**Backend:** No changes needed (uses existing message API)

**Frontend:**
- `ViewAllMatches.jsx` - Added sendGameNotification function
- `ChatPage.jsx` - Passes props to game component
- `TwoTruthsLie.jsx` - Sends notifications at game events
- `Chat.css` - Added game notification styling

## User Experience Benefits

1. **Awareness**: Players know when their match has taken action
2. **Engagement**: Notifications encourage continued play
3. **Context**: Chat history shows game progression
4. **Excitement**: Results are shared immediately
5. **Transparency**: Both players see the same information

## Example Chat Flow

```
User A: Hey! How's it going?
User B: Good! Want to play a game?
[Game notification] 🎭 Started a new game of Two Truths and a Lie! Let's play!
[Game notification] 🎮 I've submitted my statements for Two Truths and a Lie! Your turn!
[Game notification] 🎮 I've submitted my statements for Two Truths and a Lie! Your turn!
[Game notification] 🎉 I guessed correctly! The lie was: "I can speak 5 languages"
[Game notification] 😅 I guessed wrong! The lie was actually: "I've been to 30 countries"
User A: That was fun! Want to play again?
```

## Privacy & Security

- Notifications only sent to the matched conversation
- Only game-related information is shared
- No sensitive data exposed
- Uses existing authentication and authorization

## Future Enhancements

Potential improvements:
- Clickable notifications that open the game
- Notification preferences (enable/disable)
- Different notification styles per game type
- Reaction buttons on game notifications
- Game statistics in chat
- Share specific statements in chat
- Challenge reminders if no response

## Testing Checklist

- [ ] New game notification appears
- [ ] Submit notification appears for both players
- [ ] Correct guess notification shows right statement
- [ ] Wrong guess notification shows right statement
- [ ] Notifications appear in correct conversation
- [ ] Styling is applied correctly
- [ ] Emojis display properly
- [ ] Messages persist after refresh
- [ ] Works on mobile devices
- [ ] No duplicate notifications

## Troubleshooting

**Notifications not appearing:**
- Check that conversationId is passed correctly
- Verify onSendGameNotification callback is defined
- Check browser console for errors
- Ensure conversation exists before game starts

**Wrong conversation receiving notifications:**
- Verify selectedConversation.id is correct
- Check that game is opened from correct chat

**Styling not applied:**
- Clear browser cache
- Check that Chat.css is loaded
- Verify class names match

## Configuration

No configuration needed - notifications are automatic and always enabled.

To disable notifications in the future, you could add:
```javascript
const ENABLE_GAME_NOTIFICATIONS = true; // Add to config

if (ENABLE_GAME_NOTIFICATIONS && onSendGameNotification) {
  onSendGameNotification(message);
}
```

## Performance Impact

- Minimal: Uses existing message API
- No additional database queries
- No polling or real-time connections
- Standard HTTP requests only
- Negligible bandwidth usage

## Accessibility

- Notifications are text-based (screen reader friendly)
- Emojis have text fallback
- Clear, descriptive messages
- No reliance on color alone
- Keyboard accessible (standard chat messages)

## Conclusion

The game chat integration creates a seamless experience where game events naturally flow into the conversation, making the game feel like a natural part of the chat rather than a separate feature.
