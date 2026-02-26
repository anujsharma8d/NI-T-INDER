export default function ChatHeader({ 
  profilePicture, 
  name, 
  onBack, 
  onMenuClick,
  onGameClick 
}) {
  return (
    <div className="chat-header-new">
      <button className="chat-back-btn" onClick={onBack}>
        ←
      </button>
      <div className="chat-header-profile">
        {profilePicture ? (
          <img src={profilePicture} alt={name} className="chat-header-avatar" />
        ) : (
          <div className="chat-header-avatar-placeholder" />
        )}
        <span className="chat-header-name">{name}</span>
      </div>
      <button className="chat-game-btn" onClick={onGameClick} title="Play a game">
        🎮
      </button>
      <button className="chat-menu-btn" onClick={onMenuClick}>
        ⋯
      </button>
    </div>
  );
}
