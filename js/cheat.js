let isCheatEnabled = true
let cheatSpot = { xPos: 0, yPos: 0 }
const TAPS_TO_ACTIVATE_CHEAT = 1
let cheatTaps = 0

function handleCheatTap() {
  if (isCheatEnabled && isClose(touch1, cheatSpot, BALL_RADIUS * 4)) { 
    cheatTaps++ 
    if (cheatTaps == TAPS_TO_ACTIVATE_CHEAT) {
      // cheat effects
      if (showWelcome) {
        showTitle = false
        showWelcome = false
        generateLevel()
      }
      for (let i = 0; i < obstacles.length; i++) { 
        obstacles[i].isEnabled = false 
      }
      bonus.isEnabled = true
      hasGotTrophy = true
    }
  }
}