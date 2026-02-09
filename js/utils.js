function panCamera(isUp = true, durationMs = 500) {
  let distance = isUp ? -(canvas.height - GOAL_HEIGHT * 2) : canvas.height - GOAL_HEIGHT * 2
  const startY = camera.yPos
  const targetY = startY + distance
  const startTime = performance.now()
  //
  function step(now) {
    const t = Math.min((now - startTime) / durationMs, 1)
    // ease in/out (optional but recommended)
    const eased = t * (2 - t)
    //
    camera.yPos = startY + (targetY - startY) * eased
    //
    if (t < 1) requestAnimationFrame(step)
  }
  //
  requestAnimationFrame(step)
}

function isClose(objectA, objectB, threshold = BALL_RADIUS * 2) {
  return(
    Math.abs(objectA.xPos - objectB.xPos) < threshold && 
    Math.abs(objectA.yPos - objectB.yPos) < threshold
  )
}

function getMSPerFrame() {
  return 1000 / FPS
}

function initializeLetterPositions() {
  let baseX = playButton.xPos
  let baseY = playButton.yPos
  let letterSpacing = LETTER_SQUARE_SIZE // No spacing between squares
  let startX = baseX - (letterSpacing * 1.5) // Center the 4 letters
  letterP.xPos = startX
  letterP.yPos = baseY
  letterP.originalX = startX
  letterP.originalY = baseY
  letterY.xPos = startX + letterSpacing
  letterY.yPos = baseY
  letterY.originalX = startX + letterSpacing
  letterY.originalY = baseY
  letterA.xPos = startX + letterSpacing * 2
  letterA.yPos = baseY
  letterA.originalX = startX + letterSpacing * 2
  letterA.originalY = baseY
  letterL.xPos = startX + letterSpacing * 3
  letterL.yPos = baseY
  letterL.originalX = startX + letterSpacing * 3
  letterL.originalY = baseY
}

function isTouchingPlayRectangle(touch) {
  let sortedLetters = [...swappableLetters].sort((a, b) => a.xPos - b.xPos)
  let leftX = sortedLetters[0].xPos - LETTER_SQUARE_SIZE / 2
  let rightX = sortedLetters[3].xPos + LETTER_SQUARE_SIZE / 2
  let topY = sortedLetters[0].yPos - LETTER_SQUARE_SIZE / 2
  let bottomY = sortedLetters[0].yPos + LETTER_SQUARE_SIZE / 2
  return(
    touch.xPos >= leftX &&
    touch.xPos <= rightX &&
    touch.yPos >= topY &&
    touch.yPos <= bottomY
  )
}

function isPlaySpelledCorrectly() {
  let sortedLetters = [...swappableLetters].sort((a, b) => a.xPos - b.xPos) // Sort letters by xPos to get left-to-right order
  return( // Check if they spell "play" from left to right
    sortedLetters[0].char === 'p' &&
    sortedLetters[1].char === 'l' &&
    sortedLetters[2].char === 'a' &&
    sortedLetters[3].char === 'y'
  )
}

function getTappedObstacle(touch) {
  for (let obstacle of swappableObstacles) {
    if (isClose(touch, obstacle, BALL_RADIUS)) {
      return obstacle
    }
  }
  return null
}

function getCannonHandle() { 
  return {
    xPos: cannon.xPos - Math.sin(cannon.angle) * BALL_RADIUS * 1.5,
    yPos: cannon.yPos + Math.cos(cannon.angle) * BALL_RADIUS * 1.5
  }
}

function getWallEnds() {
  return {
    a: { 
      xPos: wallendA.xPos, 
      yPos: wallendA.yPos 
    },
    b: { 
      xPos: wallendB.xPos, 
      yPos: wallendB.yPos 
    }
  }
}

function getTappedLetter(touch) {
  for (let letter of swappableLetters) {
    // Check if touch is within the circle bounds
    let radius = LETTER_SQUARE_SIZE / 2
    let dx = touch.xPos - letter.xPos
    let dy = touch.yPos - letter.yPos
    let distance = Math.hypot(dx, dy)
    if (distance <= radius) {
      return letter
    }
  }
  return null
}


function cooldownWormhole() {
  wormholeA.isEnabled = false
  wormholeB.isEnabled = false
  setTimeout(() => wormholeA.isEnabled = true, COOLDOWN_DURATION)
  setTimeout(() => wormholeB.isEnabled = true, COOLDOWN_DURATION)
}

function getAlertText(bonusText) {
  return(
`
Goal!

${bonusText}
`
  )
}

