// ==========================================
// AR Game Overlay Component
// Custom tailored for Standing Cross Crunch & Bodyweight exercises
// Non-obscuring HUD & Peripheral AR Action Zones
// ==========================================

import React, { useEffect, useState } from 'react';
import type { GameState } from '../types';

interface AROverlayProps {
  gameState: GameState;
}

const CollectibleEmoji: Record<string, string> = {
  star: '⭐',
  gem: '💎',
  heart: '❤️',
};

export const AROverlay: React.FC<AROverlayProps> = ({ gameState }) => {
  const isCrossCrunch = gameState.currentExercise === 'standingCrunch';
  const targetSide = gameState.targetCrunchSide || 'left';
  const [activeSlash, setActiveSlash] = useState<{ side: 'left' | 'right'; key: number } | null>(null);

  // Trigger slash animation when a rep hits
  useEffect(() => {
    if (gameState.slashTrigger) {
      setActiveSlash({
        side: gameState.slashTrigger.side,
        key: gameState.slashTrigger.timestamp,
      });
      const timer = setTimeout(() => {
        setActiveSlash(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [gameState.slashTrigger]);

  return (
    <div className={`ar-overlay ${isCrossCrunch ? 'cross-crunch-mode' : ''}`}>
      {/* HUD - Top Bar */}
      <div className="hud">
        <div className="hud-item score">
          <span className="hud-label">คะแนน</span>
          <span className="hud-value">{gameState.score}</span>
        </div>
        <div className="hud-item timer">
          <span className="hud-label">เวลา</span>
          <span className={`hud-value ${gameState.timeRemaining <= 10 ? 'warning' : ''}`}>
            {gameState.timeRemaining}s
          </span>
        </div>
        <div className="hud-item reps">
          <span className="hud-label">จำนวนครั้ง</span>
          <span className="hud-value">{gameState.reps}</span>
        </div>
        <div className="hud-item combo">
          <span className="hud-label">Combo</span>
          <span className={`hud-value ${gameState.combo >= 3 ? 'fire' : ''}`}>
            {gameState.combo > 0 ? `x${gameState.combo}` : '-'}
          </span>
        </div>
      </div>

      {/* Cross Crunch Specialized AR Flanks & Target Lanes */}
      {isCrossCrunch && (
        <>
          {/* Target Guidance Banner (Slim & Top-docked, never covers player) */}
          <div className={`crunch-target-banner target-${targetSide}`}>
            <div className="banner-arrow left-arrow">{targetSide === 'left' ? '◀◀' : ''}</div>
            <div className="banner-content">
              <span className="banner-badge">
                {targetSide === 'left' ? '⚡ เป้าหมาย: ฝั่งซ้าย' : '⚡ เป้าหมาย: ฝั่งขวา'}
              </span>
              <span className="banner-action">
                {targetSide === 'left' ? 'ยกเข่าซ้าย ✕ ศอกขวาแตะ' : 'ยกเข่าขวา ✕ ศอกซ้ายแตะ'}
              </span>
            </div>
            <div className="banner-arrow right-arrow">{targetSide === 'right' ? '▶▶' : ''}</div>
          </div>

          {/* Left Action Wing Portal */}
          <div
            className={`ar-flank-wing flank-left ${
              targetSide === 'left' ? 'wing-active' : 'wing-standby'
            }`}
          >
            <div className="wing-header">
              <span className="wing-badge">LEFT CRUNCH</span>
              <span className="wing-hint">ศอกขวา ➔ เข่าซ้าย</span>
            </div>

            {/* Target Core Orb */}
            <div className="wing-orb-container">
              <div className="wing-orb-ring ring-outer" />
              <div className="wing-orb-ring ring-middle" />
              <div className="wing-orb-core">
                <span className="wing-orb-icon">🦵</span>
              </div>
              {targetSide === 'left' && <div className="wing-pulse-radar" />}
            </div>

            {/* Live Progress Gauges */}
            <div className="wing-gauges">
              <div className="gauge-item">
                <div className="gauge-label">
                  <span>ยกเข่าซ้าย</span>
                  <span>{targetSide === 'left' ? `${gameState.activeHipAngle || 0}°` : '-'}</span>
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${targetSide === 'left' ? Math.min(100, ((gameState.activeHipAngle || 0) / 70) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="gauge-item">
                <div className="gauge-label">
                  <span>บิดลำตัว</span>
                  <span>{targetSide === 'left' ? `${gameState.activeTorsoAngle || 0}°` : '-'}</span>
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill torso"
                    style={{
                      width: `${targetSide === 'left' ? Math.min(100, ((gameState.activeTorsoAngle || 0) / 25) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="wing-status">
              {targetSide === 'left' ? '⚡ กำลังรอฟันเป้าหมาย' : 'STANDBY'}
            </div>
          </div>

          {/* Right Action Wing Portal */}
          <div
            className={`ar-flank-wing flank-right ${
              targetSide === 'right' ? 'wing-active' : 'wing-standby'
            }`}
          >
            <div className="wing-header">
              <span className="wing-badge">RIGHT CRUNCH</span>
              <span className="wing-hint">ศอกซ้าย ➔ เข่าขวา</span>
            </div>

            {/* Target Core Orb */}
            <div className="wing-orb-container">
              <div className="wing-orb-ring ring-outer" />
              <div className="wing-orb-ring ring-middle" />
              <div className="wing-orb-core">
                <span className="wing-orb-icon">🦵</span>
              </div>
              {targetSide === 'right' && <div className="wing-pulse-radar" />}
            </div>

            {/* Live Progress Gauges */}
            <div className="wing-gauges">
              <div className="gauge-item">
                <div className="gauge-label">
                  <span>ยกเข่าขวา</span>
                  <span>{targetSide === 'right' ? `${gameState.activeHipAngle || 0}°` : '-'}</span>
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${targetSide === 'right' ? Math.min(100, ((gameState.activeHipAngle || 0) / 70) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="gauge-item">
                <div className="gauge-label">
                  <span>บิดลำตัว</span>
                  <span>{targetSide === 'right' ? `${gameState.activeTorsoAngle || 0}°` : '-'}</span>
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill torso"
                    style={{
                      width: `${targetSide === 'right' ? Math.min(100, ((gameState.activeTorsoAngle || 0) / 25) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="wing-status">
              {targetSide === 'right' ? '⚡ กำลังรอฟันเป้าหมาย' : 'STANDBY'}
            </div>
          </div>

          {/* Player Frame Guide Brackets (Leaves center 100% visible) */}
          <div className="player-frame-guide">
            <div className="corner-bracket top-left" />
            <div className="corner-bracket top-right" />
            <div className="corner-bracket bottom-left" />
            <div className="corner-bracket bottom-right" />
            <div className="holo-ground-grid" />
          </div>

          {/* AR Slash Blast Effect */}
          {activeSlash && (
            <div className={`ar-slash-burst slash-${activeSlash.side}`} key={activeSlash.key}>
              <div className="slash-laser" />
              <div className="slash-shockwave" />
              <div className="slash-text">
                {activeSlash.side === 'left' ? '⚡ LEFT SLASH!' : '⚡ RIGHT SLASH!'}
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Accuracy Bar & Live Coach Feedback (Docked at Bottom) */}
      <div className="accuracy-bar-container">
        {gameState.feedbackMessage && (
          <div className="live-coach-feedback">
            {gameState.feedbackMessage}
          </div>
        )}
        {gameState.liveAngleText && (
          <div className="live-angle-badge">
            📐 {gameState.liveAngleText}
          </div>
        )}
        <div className="accuracy-label">
          ความแม่นยำของท่าทาง: {Math.round(gameState.formAccuracy)}%
        </div>
        <div className="accuracy-bar">
          <div
            className="accuracy-fill"
            style={{
              width: `${gameState.formAccuracy}%`,
              backgroundColor:
                gameState.formAccuracy >= 80
                  ? '#00FF88'
                  : gameState.formAccuracy >= 50
                  ? '#FFB300'
                  : '#FF3366',
            }}
          />
        </div>
      </div>

      {/* Collectibles (Spawn in Peripheral Areas to not obscure player) */}
      {gameState.collectibles
        .filter((c) => !c.collected)
        .map((collectible) => (
          <div
            key={collectible.id}
            className={`collectible ${isCrossCrunch ? 'cross-crunch-collectible' : ''}`}
            style={{
              left: `${collectible.x * 100}%`,
              top: `${collectible.y * 100}%`,
            }}
          >
            <span className="collectible-emoji">
              {CollectibleEmoji[collectible.type]}
            </span>
            <span className="collectible-points">+{collectible.points}</span>
          </div>
        ))}

      {/* Floating Score Effects (Positioned at side flanks or hit points) */}
      {gameState.effects.map((effect) => (
        <div
          key={effect.id}
          className="floating-effect"
          style={{
            left: `${effect.x * 100}%`,
            top: `${effect.y * 100}%`,
            color: effect.color,
          }}
        >
          {effect.text}
        </div>
      ))}

      {/* Combo Fire Celebration */}
      {gameState.combo >= 4 && (
        <div className="combo-fire">
          🔥 COMBO x{gameState.combo}! 🔥
        </div>
      )}
    </div>
  );
};
