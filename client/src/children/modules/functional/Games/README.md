# Interactive Game Components

This directory contains the interactive game features for matched users.

## Components

### TwoTruthsLie.jsx
The main game component featuring:
- **Interactive UI**: Smooth animations and transitions
- **Real-time Updates**: Auto-polling for opponent responses
- **Sound Effects**: Optional audio feedback (Web Audio API)
- **Progress Tracking**: Visual indicators for game stages
- **Tutorial System**: First-time player guidance

### Game.css
Comprehensive styling including:
- **Animations**: 15+ keyframe animations (fade, slide, bounce, shake, pulse, etc.)
- **Responsive Design**: Mobile and desktop optimized
- **Gradient Themes**: Beautiful color schemes
- **Interactive States**: Hover, active, disabled states
- **Visual Effects**: Confetti, particles, glassmorphism

### GameSounds.js
Sound effect system featuring:
- **Web Audio API**: Browser-native sound generation
- **Multiple Effects**: Click, submit, success, wrong, hover sounds
- **User Control**: Toggle on/off functionality
- **Graceful Degradation**: Works without audio support

## Game Flow

```
1. SETUP PHASE
   ├─ Load/Create game session
   ├─ Show tutorial (first time)
   └─ Display progress bar (Step 1)

2. INPUT PHASE
   ├─ User enters 3 statements
   ├─ User marks one as lie
   ├─ Character counter feedback
   ├─ Submit with animation
   └─ Sound effect (optional)

3. WAITING PHASE
   ├─ Success checkmark animation
   ├─ Progress bar (Step 2)
   ├─ Typing indicator
   ├─ Auto-poll every 3s
   └─ Show user's statements

4. GUESSING PHASE
   ├─ Display opponent's statements
   ├─ Progress bar (Step 3)
   ├─ Hover effects on options
   ├─ Click to guess
   └─ Sound feedback

5. RESULTS PHASE
   ├─ 1s suspense delay
   ├─ Confetti (correct) or Shake (wrong)
   ├─ Sound effect
   ├─ Reveal all statements
   ├─ Color-coded results
   └─ Play again option
```

## Interactive Features

### Animations
- **Fade In**: Smooth content appearance
- **Slide In**: Sequential element entrance
- **Bounce**: Error message emphasis
- **Shake**: Wrong answer feedback
- **Pulse**: Attention-grabbing elements
- **Scale**: Success/emphasis effects
- **Rotate**: Background gradient animation
- **Confetti Fall**: Celebration particles

### User Feedback
- **Visual**: Colors, animations, icons
- **Audio**: Optional sound effects
- **Haptic**: Smooth transitions (visual feedback)
- **Text**: Clear instructions and messages

### State Management
```javascript
// Game State
- gameSession: Current game data
- loading: Data fetching state
- error: Error messages

// User Input
- statements: Array of 3 strings
- lieIndex: Selected lie (0-2)
- submitted: Submission status

// Interactive State
- hoveredStatement: Hover tracking
- isSubmitting: Submit in progress
- showConfetti: Celebration display
- shakeWrong: Error animation
- typingIndicator: Waiting animation
- revealAnimation: Results animation
- soundEnabled: Audio toggle
- showHelp: Tutorial display
```

## Performance Considerations

1. **CSS Animations**: GPU-accelerated transforms
2. **Polling**: 3-second intervals (not real-time)
3. **Cleanup**: Proper interval clearing
4. **Lazy Loading**: Sound initialized on demand
5. **Optimized Renders**: Minimal re-renders

## Accessibility

- Keyboard navigation support
- Clear visual feedback
- Optional audio (not required)
- High contrast colors
- Readable font sizes
- Screen reader friendly structure

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support
- IE11: Graceful degradation (no animations)

## Customization

To add new game types:
1. Create new component in this directory
2. Follow similar structure to TwoTruthsLie
3. Use shared Game.css or create specific styles
4. Integrate with GameSounds for audio
5. Add to ChatPage component

## Testing

Manual testing checklist:
- [ ] Game creation
- [ ] Statement submission
- [ ] Waiting state with polling
- [ ] Guessing functionality
- [ ] Results display
- [ ] Play again
- [ ] Sound toggle
- [ ] Tutorial display
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Animation smoothness
- [ ] Browser compatibility

## Tips for Developers

1. **Adding Animations**: Use CSS keyframes for performance
2. **Sound Effects**: Keep them subtle and optional
3. **State Updates**: Use functional setState for reliability
4. **Polling**: Always clean up intervals
5. **Error Handling**: Provide clear user feedback
6. **Mobile First**: Test on small screens
7. **Accessibility**: Don't rely solely on color
8. **Performance**: Profile with React DevTools
