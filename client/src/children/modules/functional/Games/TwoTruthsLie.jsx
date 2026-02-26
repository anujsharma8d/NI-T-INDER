import { useState, useEffect, useRef } from "react";
import { authFetch } from "../../../../api";
import { gameSounds } from "./GameSounds";
import "./Game.css";

/**
 * TwoTruthsLie - A fun icebreaker game for matched users
 * Players submit 3 statements (2 truths, 1 lie) and guess each other's lie
 */
function TwoTruthsLie({ matchId, otherUserName, currentUserId, conversationId, onSendGameNotification, onClose }) {
  const [gameSession, setGameSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Game state
  const [statements, setStatements] = useState(["", "", ""]);
  const [lieIndex, setLieIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [guess, setGuess] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  
  // Interactive state
  const [hoveredStatement, setHoveredStatement] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [revealAnimation, setRevealAnimation] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const pollInterval = useRef(null);

  // Initialize sound on first user interaction
  const enableSound = () => {
    if (!soundEnabled) {
      gameSounds.enable();
      setSoundEnabled(true);
    }
  };

  // Check if first time playing
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('hasPlayedTwoTruthsLie');
    if (!hasPlayedBefore && !submitted) {
      setShowHelp(true);
      localStorage.setItem('hasPlayedTwoTruthsLie', 'true');
    }
  }, []);

  useEffect(() => {
    loadOrCreateGame();
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [matchId]);

  // Poll for other player's response when waiting
  useEffect(() => {
    if (submitted && !gameSession?.responses?.find(r => r.user_id !== currentUserId)) {
      setTypingIndicator(true);
      pollInterval.current = setInterval(() => {
        loadOrCreateGame();
      }, 3000);
    } else {
      setTypingIndicator(false);
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    }
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [submitted, gameSession, currentUserId]);

  const loadOrCreateGame = async () => {
    try {
      setLoading(true);
      
      // Check for existing game sessions
      const sessionsResp = await authFetch(`/games/${matchId}`);
      const sessions = await sessionsResp.json();
      
      // Find active or pending two_truths_lie game
      const activeGame = sessions.find(
        s => s.game_type === "two_truths_lie" && s.status !== "completed"
      );

      if (activeGame) {
        // Load existing game
        const gameResp = await authFetch(`/games/session/${activeGame.id}`);
        const gameData = await gameResp.json();
        setGameSession(gameData);
        
        // Check if current user already submitted
        const myResponse = gameData.responses.find(
          r => r.user_id === currentUserId
        );
        
        if (myResponse) {
          setSubmitted(true);
          setStatements(myResponse.response_data.statements);
          setLieIndex(myResponse.response_data.lie_index);
        }
      } else {
        // Create new game
        const createResp = await authFetch("/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            match_id: matchId,
            game_type: "two_truths_lie",
          }),
        });
        
        const newGame = await createResp.json();
        setGameSession({ ...newGame, responses: [] });
        
        // Send notification about new game
        if (onSendGameNotification && !loading) {
          onSendGameNotification("🎭 Started a new game of Two Truths and a Lie! Let's play!");
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading game:", err);
      setError("Failed to load game");
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    enableSound();
    
    if (statements.some(s => !s.trim())) {
      setError("Please fill in all three statements");
      setShakeWrong(true);
      gameSounds.wrong();
      setTimeout(() => setShakeWrong(false), 500);
      return;
    }
    
    if (lieIndex === null) {
      setError("Please select which statement is the lie");
      setShakeWrong(true);
      gameSounds.wrong();
      setTimeout(() => setShakeWrong(false), 500);
      return;
    }

    setIsSubmitting(true);
    gameSounds.submit();
    
    try {
      await authFetch(`/games/session/${gameSession.id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_data: {
            statements,
            lie_index: lieIndex,
          },
        }),
      });
      
      // Animate submission
      setTimeout(async () => {
        setSubmitted(true);
        setIsSubmitting(false);
        await loadOrCreateGame();
        
        // Send notification to chat
        if (onSendGameNotification) {
          onSendGameNotification("🎮 I've submitted my statements for Two Truths and a Lie! Your turn!");
        }
      }, 800);
    } catch (err) {
      console.error("Error submitting:", err);
      setError("Failed to submit your statements");
      setIsSubmitting(false);
      setShakeWrong(true);
      gameSounds.wrong();
      setTimeout(() => setShakeWrong(false), 500);
    }
  };

  const handleGuess = async (guessedIndex) => {
    enableSound();
    gameSounds.click();
    
    setGuess(guessedIndex);
    setRevealAnimation(true);
    
    const otherPlayerResponse = gameSession?.responses?.find(
      r => r.user_id !== currentUserId
    );
    
    const isCorrect = guessedIndex === otherPlayerResponse?.response_data.lie_index;
    
    // Show result animation
    setTimeout(() => {
      if (isCorrect) {
        setShowConfetti(true);
        gameSounds.success();
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setShakeWrong(true);
        gameSounds.wrong();
        setTimeout(() => setShakeWrong(false), 500);
      }
    }, 1000);
    
    // Complete game
    setTimeout(async () => {
      try {
        await authFetch(`/games/session/${gameSession.id}/complete`, {
          method: "PUT",
        });
        setGameComplete(true);
        
        // Send result notification to chat
        if (onSendGameNotification) {
          if (isCorrect) {
            onSendGameNotification(`🎉 I guessed correctly! The lie was: "${otherPlayerResponse.response_data.statements[otherPlayerResponse.response_data.lie_index]}"`);
          } else {
            onSendGameNotification(`😅 I guessed wrong! The lie was actually: "${otherPlayerResponse.response_data.statements[otherPlayerResponse.response_data.lie_index]}"`);
          }
        }
      } catch (err) {
        console.error("Error completing game:", err);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="game-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (error && !gameSession) {
    return (
      <div className="game-container">
        <div className="error-message">{error}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  const otherPlayerResponse = gameSession?.responses?.find(
    r => r.user_id !== currentUserId
  );

  return (
    <div className={`game-container ${shakeWrong ? 'shake' : ''}`}>
      {showConfetti && <Confetti />}
      
      <div className="game-header">
        <h2>🎭 Two Truths and a Lie</h2>
        <div className="header-controls">
          <button 
            className="sound-toggle-btn" 
            onClick={() => {
              const newState = gameSounds.toggle();
              setSoundEnabled(newState);
              if (newState) gameSounds.click();
            }}
            title={soundEnabled ? "Sound On" : "Sound Off"}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {!submitted ? (
        <div className="game-content fade-in">
          {showHelp && (
            <div className="help-tooltip slide-in">
              <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
              <h4>🎮 How to Play</h4>
              <ol>
                <li>Write 3 statements about yourself</li>
                <li>Mark ONE as your lie (the other two must be true!)</li>
                <li>Submit and wait for your match</li>
                <li>Guess which of their statements is the lie</li>
              </ol>
              <p className="help-tip">💡 Make it challenging but fun!</p>
            </div>
          )}
          
          <p className="game-instructions pulse">
            ✨ Write three statements about yourself - two truths and one lie.
            <strong> {otherUserName}</strong> will try to guess which one is the lie!
          </p>
          
          <div className="progress-bar">
            <div className="progress-step completed">1</div>
            <div className="progress-line"></div>
            <div className="progress-step">2</div>
            <div className="progress-line"></div>
            <div className="progress-step">3</div>
          </div>
          
          {statements.map((statement, index) => (
            <div 
              key={index} 
              className={`statement-input slide-in ${lieIndex === index ? 'is-lie' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <label className="lie-selector">
                <input
                  type="radio"
                  name="lie"
                  checked={lieIndex === index}
                  onChange={() => {
                    setLieIndex(index);
                    setError(null);
                  }}
                />
                <span className="lie-label">
                  {lieIndex === index ? '🤥 This is the lie' : '⭐ Mark as lie'}
                </span>
              </label>
              <textarea
                value={statement}
                onChange={(e) => {
                  const newStatements = [...statements];
                  newStatements[index] = e.target.value;
                  setStatements(newStatements);
                  setError(null);
                }}
                placeholder={`Statement ${index + 1} - Tell us something about you...`}
                rows={2}
                className="statement-textarea"
              />
              <div className="char-count">{statement.length}/200</div>
            </div>
          ))}
          
          {error && <div className="error-message bounce">{error}</div>}
          
          <button 
            className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-small"></span> Submitting...
              </>
            ) : (
              <>🚀 Submit Statements</>
            )}
          </button>
        </div>
      ) : !otherPlayerResponse ? (
        <div className="game-content waiting fade-in">
          <div className="success-checkmark">✓</div>
          <p className="success-text">Your statements have been submitted!</p>
          
          <div className="progress-bar">
            <div className="progress-step completed">1</div>
            <div className="progress-line completed"></div>
            <div className="progress-step active">2</div>
            <div className="progress-line"></div>
            <div className="progress-step">3</div>
          </div>
          
          <p className="waiting-text">
            Waiting for <strong>{otherUserName}</strong> to submit their statements
            {typingIndicator && <span className="typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>}
          </p>
          <div className="your-statements">
            <h3>📝 Your Statements:</h3>
            {statements.map((s, i) => (
              <div key={i} className={`statement-preview slide-in ${i === lieIndex ? 'preview-lie' : 'preview-truth'}`}
                   style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="statement-number">{i + 1}</span>
                <span className="statement-text">{s}</span>
                {i === lieIndex && <span className="lie-badge">🤥 Your Lie</span>}
              </div>
            ))}
          </div>
        </div>
      ) : !guess ? (
        <div className="game-content guessing fade-in">
          <p className="game-instructions pulse">
            🤔 <strong>{otherUserName}</strong> says... Which one is the lie?
          </p>
          
          <div className="progress-bar">
            <div className="progress-step completed">1</div>
            <div className="progress-line completed"></div>
            <div className="progress-step completed">2</div>
            <div className="progress-line completed"></div>
            <div className="progress-step active">3</div>
          </div>
          
          <div className="statements-to-guess">
            {otherPlayerResponse.response_data.statements.map((statement, index) => (
              <button
                key={index}
                className={`statement-guess-btn slide-in ${hoveredStatement === index ? 'hovered' : ''}`}
                style={{ animationDelay: `${index * 0.15}s` }}
                onClick={() => handleGuess(index)}
                onMouseEnter={() => {
                  setHoveredStatement(index);
                  if (soundEnabled) gameSounds.hover();
                }}
                onMouseLeave={() => setHoveredStatement(null)}
              >
                <span className="guess-number">{index + 1}</span>
                <span className="guess-text">{statement}</span>
                <span className="guess-hint">Click to guess</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={`game-content results fade-in ${revealAnimation ? 'reveal' : ''}`}>
          <h3>🎊 Results!</h3>
          
          {guess === otherPlayerResponse.response_data.lie_index ? (
            <div className="result-correct bounce">
              <div className="result-icon">🎉</div>
              <p>Amazing! You guessed correctly!</p>
            </div>
          ) : (
            <div className="result-wrong shake">
              <div className="result-icon">😅</div>
              <p>Oops! The lie was statement #{otherPlayerResponse.response_data.lie_index + 1}</p>
            </div>
          )}
          
          <div className="final-statements">
            <h4>🔍 {otherUserName}'s statements revealed:</h4>
            {otherPlayerResponse.response_data.statements.map((s, i) => (
              <div 
                key={i} 
                className={`final-statement slide-in ${i === otherPlayerResponse.response_data.lie_index ? 'lie' : 'truth'} ${i === guess ? 'your-guess' : ''}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="final-number">{i + 1}</span>
                <span className="final-text">{s}</span>
                <span className="final-badge">
                  {i === otherPlayerResponse.response_data.lie_index ? '❌ Lie' : '✅ Truth'}
                </span>
                {i === guess && <span className="guess-indicator">👆 Your guess</span>}
              </div>
            ))}
          </div>
          
          {gameComplete && (
            <button className="play-again-btn pulse" onClick={() => {
              setGameSession(null);
              setStatements(["", "", ""]);
              setLieIndex(null);
              setSubmitted(false);
              setGuess(null);
              setGameComplete(false);
              setShowConfetti(false);
              setRevealAnimation(false);
              loadOrCreateGame();
            }}>
              🔄 Play Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Confetti component for celebration
function Confetti() {
  return (
    <div className="confetti-container">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][Math.floor(Math.random() * 5)],
          }}
        />
      ))}
    </div>
  );
}

export default TwoTruthsLie;
