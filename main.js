// npx --yes live-server --host=0.0.0.0 --port=8080
let isCheatEnabled = true
const TAPS_TO_ACTIVATE_CHEAT = 5
let cheatTaps = 0
// http://10.0.0.145:8080

const FPS = 60
const BALL_RADIUS = window.innerWidth / 16
const BALL_SPEED_DIVISOR = 5
const BALL_RESTITUTION = .85
const BALL_MIN_SPEED = 15
const BALL_MAX_SPEED = 30 // not currently used
const BALL_FRICTION = 1
const GOAL_HEIGHT = BALL_RADIUS * 1.5
const GOAL_WIDTH = BALL_RADIUS * 4
const WALL_LENGTH = BALL_RADIUS * 5
const KEY_SIZE = BALL_RADIUS * 0.75
const TROPHY_SIZE = BALL_RADIUS * 0.6
const MAX_SPAWN_ATTEMPTS = 10000
const MIN_SPACE_FOR_SPAWN = WALL_LENGTH + BALL_RADIUS
const COOLDOWN_DURATION = 3000
const SWAP_DURATION = 20

let canvas;
let ctx;
let ball = {}
let goal = {}
let cannon = {}
let puddle = {}
let wall = {}
let wormholeA = {}
let wormholeB = {}
let key = {}
let bonus = {}
let obstacles = [cannon, puddle, wall, wormholeA, wormholeB, key, bonus]
let swappableObstacles = [cannon, puddle, wall, wormholeA, wormholeB]
let touch1 = { xPos: 0, yPos: 0 }
let spawnedObstacles = []
let rotatingObstacle = {}
let selectedObstacle = {}
const LETTER_SQUARE_SIZE = 50
let letterP = { char: 'p', xPos: 0, yPos: 0, originalX: 0, originalY: 0 }
let letterY = { char: 'y', xPos: 0, yPos: 0, originalX: 0, originalY: 0 }
let letterA = { char: 'a', xPos: 0, yPos: 0, originalX: 0, originalY: 0 }
let letterL = { char: 'l', xPos: 0, yPos: 0, originalX: 0, originalY: 0 }
let swappableLetters = [letterP, letterY, letterA, letterL]
let selectedLetter = null
let letterSwapAnimation = null
let areObstaclesHidden = false
let showWelcome = false
let showTitle = false
let isBallHidden = true
let hasFlung = false
let playButton = { xPos: window.innerWidth / 2, yPos: window.innerHeight * .6 }
let trophyCount = 0

function handleCheatTap() {
  if (isCheatEnabled && isClose(touch1, goal, BALL_RADIUS * 2)) { 
    cheatTaps++ 
    if (cheatTaps >= TAPS_TO_ACTIVATE_CHEAT) {
      for (let i = 0; i < obstacles.length; i++) { 
        obstacles[i].isEnabled = false 
      } 
      // insert cheat effects here
      //goal.isEnabled = false
    }
  }
}

function initialize() {
  canvas = document.getElementById('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  document.addEventListener('touchstart', handleTouchstart)
  document.addEventListener('touchmove', handleTouchmove, { passive: false })
  document.addEventListener('touchend', handleTouchend)
  document.addEventListener('wheel', (e) => { e.preventDefault() }, { passive: false })
  showMenu()
  //generateLevel()
  //loopGame()
}

function handleTouchstart(e) {
  touch1.xPos = e.touches[0].clientX
  touch1.yPos = e.touches[0].clientY
  if (isClose(touch1, ball, BALL_RADIUS)) {
    ball.isBeingFlung = true
    return
  }
  if (
    showTitle && 
    touch1.xPos > canvas.width * .4 &&
    touch1.xPos < canvas.width * .6 &&
    touch1.yPos > canvas.height * .5 &&
    touch1.yPos < canvas.height * .7
  ) {
    //generateLevel()
  }
  // Check if tapping on "play" rectangle when correctly spelled
  if (hasFlung && isPlaySpelledCorrectly()) {
    if (isTouchingPlayRectangle(touch1)) {
      generateLevel()
      return
    }
  }
  handleTouchstartToRotate()
  handleTouchstartToSwap()
  handleTouchstartToSwapLetters()
  handleCheatTap()
}

function isTouchingPlayRectangle(touch) {
  // Calculate the circle bounds from all letters
  let sortedLetters = [...swappableLetters].sort((a, b) => a.xPos - b.xPos)
  let leftX = sortedLetters[0].xPos - LETTER_SQUARE_SIZE / 2
  let rightX = sortedLetters[3].xPos + LETTER_SQUARE_SIZE / 2
  let topY = sortedLetters[0].yPos - LETTER_SQUARE_SIZE / 2
  let bottomY = sortedLetters[0].yPos + LETTER_SQUARE_SIZE / 2
  
  // Check if touch is within the bounding rectangle of all circles
  return touch.xPos >= leftX &&
         touch.xPos <= rightX &&
         touch.yPos >= topY &&
         touch.yPos <= bottomY
}

function handleTouchmove(e) {
  e.preventDefault()
  let touch2 = { 
    xPos: e.touches[0].clientX, 
    yPos: e.touches[0].clientY 
  }
  if (ball.isBeingFlung) {
    ball.xVel = (touch2.xPos - touch1.xPos) / BALL_SPEED_DIVISOR
    ball.yVel = (touch2.yPos - touch1.yPos) / BALL_SPEED_DIVISOR
  }
  handleTouchmoveToRotate(touch2)
}

function showMenu() {
  areObstaclesHidden = true
  //generateLevel()

  setTimeout(() => showWelcome = true, 1000)
  setTimeout(() => showTitle = true, 2000)
  setTimeout(() => { spawnBall(); ball.xPos = canvas.width / 2; isBallHidden = false }, 3500)
  initializeLetterPositions()
  loopGame()  
}

function initializeLetterPositions() {
  // Calculate positions for "p   y   a   l" with spacing
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

function generateLevel() {
  areObstaclesHidden = false
  showWelcome = false
  showTitle = false
  hasFlung = false
  spawnBall()
  spawnGoal()
  spawnedObstacles = []
  for (let i = 0; i < obstacles.length; i++) spawnObstacle(obstacles[i])
  selectedObstacle = null
  cheatTaps = 0
}

function spawnBall() {
  let spawn = {
    xPos: BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random(),
    yPos: canvas.height - BALL_RADIUS
  }
  ball = { 
    xPos: spawn.xPos, 
    yPos: spawn.yPos, 
    xVel: 0, 
    yVel: 0, 
    angle: 0,
    isBeingFlung: false, 
    spawn: spawn 
}
}

function spawnGoal() {
  goal = {
    xPos: GOAL_WIDTH + (canvas.width - 2 * GOAL_WIDTH) * Math.random(),
    yPos: 0,
    isEnabled: true 
  }
}

function spawnObstacle(obstacle) {
  obstacle.isEnabled = true
  obstacle.angle = Math.random() * 2 * Math.PI
  obstacle.xVel = 0
  obstacle.yVel = 0
  let minY = goal.yPos + GOAL_HEIGHT + BALL_RADIUS * 2
  let maxY = ball.spawn.yPos - BALL_RADIUS * 4
  let minDistance = MIN_SPACE_FOR_SPAWN
  let maxAttempts = MAX_SPAWN_ATTEMPTS
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    obstacle.xPos = BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random()
    obstacle.yPos = minY + (maxY - minY) * Math.random()
    if (obstacle === wall) {
      obstacle.length = WALL_LENGTH
      let endB = getWallEnds().b
      let isEndBOutsideLeftFrame = endB.xPos < BALL_RADIUS * 2
      let isEndBOutsideRightFrame = endB.xPos > canvas.width - BALL_RADIUS * 2
      let isEndBOutsideTopFrame = endB.yPos < BALL_RADIUS * 4
      let isEndBOutsideBottomFrame = endB.yPos > canvas.height - BALL_RADIUS * 4
      if (isEndBOutsideLeftFrame || isEndBOutsideRightFrame || isEndBOutsideTopFrame || isEndBOutsideBottomFrame) {
        continue
      }
    }
    let overlaps = false
    for (let placed of spawnedObstacles) {
      let dx = obstacle.xPos - placed.xPos
      let dy = obstacle.yPos - placed.yPos
      let distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < minDistance) {
        overlaps = true
        break
      }
    }
    if (!overlaps) break
  } 
  spawnedObstacles.push({ 
    xPos: obstacle.xPos, 
    yPos: obstacle.yPos 
  })
}

function handleTouchend() {
  ball.isBeingFlung = false
  rotatingObstacle = null
}

function loopGame() {
  draw()
  moveBall()
  moveObstacles()
  handleCollision()
  setTimeout(loopGame, getMSPerFrame())
}

function moveBall() {
  ball.xPos += ball.xVel
  ball.yPos += ball.yVel 
  ball.angle += ball.xVel / BALL_RADIUS
  ball.xVel *= BALL_FRICTION
  ball.yVel *= BALL_FRICTION
}

function moveObstacles() {
  updateSwapAnimation()
  updateLetterSwapAnimation()
}

function handleCollision() {
  handleGoal()
  handleCannon()
  handlePuddle()
  handleWall()
  handleWormhole()
  handleKey()
  handleBonus()
  handleEdge()
}

function handleGoal() {
  if (goal.isEnabled && !key.isEnabled) {
    let isBallPastGoalLine = ball.yPos + BALL_RADIUS <= 0
    let isBallInsideRightPost = ball.xPos + BALL_RADIUS < goal.xPos + GOAL_WIDTH
    let isBallInsideLeftPost = ball.xPos - BALL_RADIUS > goal.xPos - GOAL_WIDTH
    if (isBallPastGoalLine && isBallInsideRightPost && isBallInsideLeftPost) {
      goal.isEnabled = false
      ball.xVel = 0
      ball.yVel = 0
      ball.xPos = goal.xPos
      ball.yPos = goal.yPos
      ball.yPos = GOAL_HEIGHT
      trophyCount++
      let bonusText = "(no bonus)"
      if (!bonus.isEnabled) {
        trophyCount++
        bonusText = "+ Bonus!"
      }
      alert(
`
Goal!

${bonusText}
`
      )
      generateLevel()
    }
  }
}

function handleCannon() {
  if (cannon.isEnabled && isClose(ball, cannon, BALL_RADIUS * 2)) {
    let speed = Math.hypot(ball.xVel, ball.yVel)
    ball.xVel = Math.sin(cannon.angle) * speed
    ball.yVel = -Math.cos(cannon.angle) * speed
    cannon.isEnabled = false
    setTimeout(() => cannon.isEnabled = true, COOLDOWN_DURATION)
  }
}

function handlePuddle() {
  if (puddle.isEnabled && !ball.isBeingFlung && isClose(ball, puddle, BALL_RADIUS * 2)) {
    ball.xVel = 0
    ball.yVel = 0
  }
}

function handleWall() {
  if (wall.isEnabled) {
    let dirX = Math.cos(wall.angle)
    let dirY = Math.sin(wall.angle)
    let toWallX = ball.xPos - wall.xPos
    let toWallY = ball.yPos - wall.yPos
    let projection = Math.max(0, Math.min(wall.length, toWallX * dirX + toWallY * dirY))
    let closestX = wall.xPos + projection * dirX
    let closestY = wall.yPos + projection * dirY
    let toClosestX = ball.xPos - closestX
    let toClosestY = ball.yPos - closestY
    let distance = Math.sqrt(toClosestX * toClosestX + toClosestY * toClosestY)
    let threshold = BALL_RADIUS + BALL_RADIUS / 8
    if (distance < threshold && distance > 0.01) {
      let normalX = toClosestX / distance
      let normalY = toClosestY / distance
      let dot = ball.xVel * normalX + ball.yVel * normalY
      ball.xVel -= 2 * dot * normalX
      ball.yVel -= 2 * dot * normalY
      ball.xPos = closestX + normalX * threshold
      ball.yPos = closestY + normalY * threshold
    }
  }
}

function handleWormhole() {
  if (wormholeA.isEnabled && isClose(ball, wormholeA, BALL_RADIUS * 2)) {
    ball.xPos = wormholeB.xPos
    ball.yPos = wormholeB.yPos
    cooldownWormhole()
  } else if (wormholeB.isEnabled && isClose(ball, wormholeB, BALL_RADIUS * 2)) {
    ball.xPos = wormholeA.xPos
    ball.yPos = wormholeA.yPos
    cooldownWormhole()
  }
}

function cooldownWormhole() {
  wormholeA.isEnabled = false
  wormholeB.isEnabled = false
  setTimeout(() => wormholeA.isEnabled = true, COOLDOWN_DURATION)
  setTimeout(() => wormholeB.isEnabled = true, COOLDOWN_DURATION)
}

function handleKey() {
  if (isClose(ball, key, BALL_RADIUS + KEY_SIZE)) {
    key.isEnabled = false
  }
}

function handleBonus() {
  if (isClose(ball, bonus, BALL_RADIUS + BALL_RADIUS / 2)) {
    bonus.isEnabled = false
  }
}

function handleEdge() {
  let isBallAtLeftEdge = ball.xPos - BALL_RADIUS <= 0
  let isBallAtRightEdge = ball.xPos + BALL_RADIUS >= canvas.width
  let isBallAtTopEdge = ball.yPos - BALL_RADIUS < GOAL_HEIGHT
  let isBallAtBottomEdge = ball.yPos + BALL_RADIUS > canvas.height
  let isBallHorizontallyAlignedWithGoal = ball.xPos > goal.xPos - GOAL_WIDTH / 2 && ball.xPos < goal.xPos + GOAL_WIDTH / 2 
  if (isBallAtLeftEdge) {
    ball.xPos = BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (isBallAtRightEdge) {
    ball.xPos = canvas.width - BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (isBallAtTopEdge && !isBallHorizontallyAlignedWithGoal) {
    ball.yPos = GOAL_HEIGHT + BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
  } else if (isBallAtBottomEdge) {
    ball.yPos = canvas.height - BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
    let speed = Math.hypot(ball.xVel, ball.yVel)
    if (!ball.isBeingFlung && speed < BALL_MIN_SPEED) {
      ball.xVel = 0
      ball.yVel = 0
      if (showTitle) {
        setTimeout(() => {
          hasFlung = true
          initializeLetterPositions()
        }, 1250)
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawMenu()
  drawTrophies()
  drawGoal()
  if (!areObstaclesHidden) {
    drawCannon()
    drawPuddle()
    drawWall()
    drawWormhole()
    drawKey()
    drawBonus()
  }
  if (!isBallHidden) drawBall()
  //drawSelectionBorder()
  drawSelectionElectricity()
  drawSwapAnimationElectricity()
  //drawSwappableBorders()
  drawLetterSelectionElectricity()
  drawLetterSwapAnimationElectricity()
  drawLetterSelectionBorder()
}

function isPlaySpelledCorrectly() {
  // Sort letters by xPos to get left-to-right order
  let sortedLetters = [...swappableLetters].sort((a, b) => a.xPos - b.xPos)
  // Check if they spell "play" from left to right
  return sortedLetters[0].char === 'p' &&
         sortedLetters[1].char === 'l' &&
         sortedLetters[2].char === 'a' &&
         sortedLetters[3].char === 'y'
}

function drawMenu() {
  if (showWelcome) {
    ctx.textAlign = "center"
    ctx.textBaseline = "alphabetic"
    ctx.font = "30px arial"
    ctx.fillStyle = "white"
    ctx.fillText("welcome to", canvas.width / 2, canvas.height * .25)
  }
  if (showTitle) {
    ctx.textAlign = "center"
    ctx.textBaseline = "alphabetic"
    ctx.font = "50px arial"
    ctx.fillStyle = "white"
    ctx.fillText("soccerpuzzle", canvas.width / 2, canvas.height * .3)
  }
  if (hasFlung) {
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = "bold 30px arial"
    // Draw each letter with its circle
    let colors = ["red", "yellow", "blue", "purple"]
    for (let i = 0; i < swappableLetters.length; i++) {
      let letter = swappableLetters[i]
      // Draw simple circle
      ctx.fillStyle = colors[i]
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(letter.xPos, letter.yPos, BALL_RADIUS * .75, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = "black"
      // Draw letter (centered both horizontally and vertically)
      ctx.fillText(letter.char, letter.xPos, letter.yPos)
    }
    
    // Draw teal electric border around rectangle if "play" is spelled correctly
    if (isPlaySpelledCorrectly()) {
      drawPlayBorder()
    }
  }
}

function drawPlayBorder() {
  // Calculate the bounding rectangle from all letters (for touch detection)
  let sortedLetters = [...swappableLetters].sort((a, b) => a.xPos - b.xPos)
  let leftX = sortedLetters[0].xPos - LETTER_SQUARE_SIZE / 2
  let rightX = sortedLetters[3].xPos + LETTER_SQUARE_SIZE / 2
  let topY = sortedLetters[0].yPos - LETTER_SQUARE_SIZE / 2
  let bottomY = sortedLetters[0].yPos + LETTER_SQUARE_SIZE / 2
  
  let rectWidth = rightX - leftX
  let rectHeight = bottomY - topY
  
  ctx.save()
  
  let time = Date.now() * 0.01
  
  // Draw multiple layers for electricity effect around the bounding rectangle
  for (let layer = 0; layer < 3; layer++) {
    let opacity = layer === 0 ? 0.3 : (layer === 1 ? 0.6 : 0.8)
    let lineWidth = layer === 0 ? 6 : (layer === 1 ? 3 : 1)
    
    ctx.strokeStyle = layer === 0 
      ? `rgba(77, 208, 225, ${opacity})`
      : layer === 1
      ? `rgba(150, 230, 240, ${opacity})`
      : `rgba(170, 235, 245, ${opacity})`
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    
    // Create jagged border effect
    let segments = 32
    ctx.beginPath()
    
    // Top edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let x = leftX + rectWidth * t
      let jitter = Math.sin(time * 2 + i * 0.5) * 2 + Math.cos(time * 1.5 + i * 0.7) * 2
      let y = topY + jitter * (layer === 0 ? 1 : 0.5)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    
    // Right edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let y = topY + rectHeight * t
      let jitter = Math.sin(time * 2 + (segments / 4 + i) * 0.5) * 2 + Math.cos(time * 1.5 + (segments / 4 + i) * 0.7) * 2
      let x = rightX + jitter * (layer === 0 ? 1 : 0.5)
      ctx.lineTo(x, y)
    }
    
    // Bottom edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let x = rightX - rectWidth * t
      let jitter = Math.sin(time * 2 + (segments / 2 + i) * 0.5) * 2 + Math.cos(time * 1.5 + (segments / 2 + i) * 0.7) * 2
      let y = bottomY + jitter * (layer === 0 ? 1 : 0.5)
      ctx.lineTo(x, y)
    }
    
    // Left edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let y = bottomY - rectHeight * t
      let jitter = Math.sin(time * 2 + (segments * 3 / 4 + i) * 0.5) * 2 + Math.cos(time * 1.5 + (segments * 3 / 4 + i) * 0.7) * 2
      let x = leftX + jitter * (layer === 0 ? 1 : 0.5)
      ctx.lineTo(x, y)
    }
    
    ctx.closePath()
    ctx.stroke()
  }
  
  ctx.restore()
}

function drawTrophies() {
  // Draw trophies horizontally starting from top left corner
  let startX = TROPHY_SIZE
  let startY = TROPHY_SIZE
  let spacing = TROPHY_SIZE * 2.5 // Space between trophies
  
  for (let i = 0; i < trophyCount; i++) {
    let x = startX + i * spacing
    let y = startY
    drawTrophy(x, y)
  }
}

function drawTrophy(x, y) {
  ctx.save()
  
  // Use TROPHY_SIZE as the base radius for scaling
  let radius = TROPHY_SIZE
  // Scale factor to make trophy appear as large as a circle with the same radius
  let scale = 1.6
  let scaledRadius = radius * scale
  
  // Draw trophy in gold/yellow with gradient
  let gradient = ctx.createLinearGradient(x, y - scaledRadius, x, y + scaledRadius)
  gradient.addColorStop(0, "#ffed4e") // Lighter gold at top
  gradient.addColorStop(0.5, "#ffd700") // Gold in middle
  gradient.addColorStop(1, "#daa520") // Darker gold at bottom
  ctx.fillStyle = gradient
  ctx.strokeStyle = "#b8860b" // Dark gold for outline
  ctx.lineWidth = Math.max(1, radius * 0.1)
  
  // Trophy base (bottom, wider and perfectly centered)
  let baseWidth = scaledRadius * 1.0
  let baseHeight = scaledRadius * 0.15
  let baseY = y + scaledRadius * 0.35
  ctx.beginPath()
  ctx.rect(x - baseWidth / 2, baseY, baseWidth, baseHeight)
  ctx.fill()
  ctx.stroke()
  
  // Trophy stem/pedestal (connects base to cup, perfectly centered)
  let stemWidth = scaledRadius * 0.3
  let stemHeight = scaledRadius * 0.2
  let stemY = y + scaledRadius * 0.15
  ctx.beginPath()
  ctx.rect(x - stemWidth / 2, stemY, stemWidth, stemHeight)
  ctx.fill()
  ctx.stroke()
  
  // Trophy cup/bowl (main body, perfectly symmetrical)
  let cupBottomY = stemY
  let cupTopY = y - scaledRadius * 0.3
  let cupBottomWidth = scaledRadius * 0.4
  let cupTopWidth = scaledRadius * 0.7
  let cupInnerTopWidth = scaledRadius * 0.4
  
  ctx.beginPath()
  // Start at bottom left
  ctx.moveTo(x - cupBottomWidth / 2, cupBottomY)
  // Left side curve (symmetric)
  ctx.quadraticCurveTo(
    x - cupTopWidth / 2, (cupBottomY + cupTopY) / 2,
    x - cupTopWidth / 2, cupTopY
  )
  // Top rim left
  ctx.lineTo(x - cupInnerTopWidth / 2, cupTopY)
  // Inner left edge
  ctx.lineTo(x - cupInnerTopWidth / 2, cupTopY + scaledRadius * 0.1)
  // Inner bottom curve (symmetric)
  ctx.quadraticCurveTo(x, cupTopY + scaledRadius * 0.15, x + cupInnerTopWidth / 2, cupTopY + scaledRadius * 0.1)
  // Inner right edge
  ctx.lineTo(x + cupInnerTopWidth / 2, cupTopY)
  // Top rim right
  ctx.lineTo(x + cupTopWidth / 2, cupTopY)
  // Right side curve (symmetric to left)
  ctx.quadraticCurveTo(
    x + cupTopWidth / 2, (cupBottomY + cupTopY) / 2,
    x + cupBottomWidth / 2, cupBottomY
  )
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  // Trophy handles (perfectly symmetrical C-shaped handles)
  let handleRadius = scaledRadius * 0.2
  let handleXOffset = scaledRadius * 0.45
  let handleY = y - scaledRadius * 0.05
  let handleThickness = scaledRadius * 0.12
  
  // Left handle (C-shaped, opening to the right)
  ctx.beginPath()
  ctx.arc(x - handleXOffset, handleY, handleRadius, Math.PI * 0.5, Math.PI * 1.5, false)
  ctx.lineWidth = handleThickness
  ctx.lineCap = "round"
  ctx.stroke()
  
  // Right handle (C-shaped, opening to the left, perfectly mirrored)
  ctx.beginPath()
  ctx.arc(x + handleXOffset, handleY, handleRadius, Math.PI * 1.5, Math.PI * 0.5, false)
  ctx.stroke()
  
  // Star on top (perfectly centered, 5-pointed star)
  ctx.fillStyle = "#ffd700"
  ctx.strokeStyle = "#ffaa00"
  ctx.lineWidth = Math.max(1, radius * 0.05)
  ctx.beginPath()
  let starX = x
  let starY = y - scaledRadius * 0.4
  let starOuterRadius = scaledRadius * 0.15
  let starInnerRadius = starOuterRadius * 0.5
  let starPoints = 5
  
  for (let i = 0; i < starPoints * 2; i++) {
    let angle = (Math.PI * i) / starPoints - Math.PI / 2
    let r = (i % 2 === 0) ? starOuterRadius : starInnerRadius
    let px = starX + Math.cos(angle) * r
    let py = starY + Math.sin(angle) * r
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  ctx.restore()
}

function drawBall() {
  ctx.save()
  ctx.translate(ball.xPos, ball.yPos)
  ctx.save()
  ctx.rotate(ball.angle)
  ctx.beginPath()
  ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = "white"
  ctx.fill()
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = "#333"
  drawPentagon(0, 0, BALL_RADIUS * 0.4)
  let outerRadius = BALL_RADIUS * 0.85
  for (let i = 0; i < 5; i++) {
    let angle = (i * 2 * Math.PI / 5) - Math.PI / 2
    let px = Math.cos(angle) * outerRadius
    let py = Math.sin(angle) * outerRadius
    drawPentagon(px, py, BALL_RADIUS * 0.3, angle + Math.PI)
  }
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    let angle = (i * 2 * Math.PI / 5) - Math.PI / 2
    let startRadius = BALL_RADIUS * 0.4
    let endRadius = BALL_RADIUS * 0.7
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius)
    ctx.lineTo(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius)
    ctx.stroke()
  }
  ctx.restore()
  let gradient = ctx.createRadialGradient(
    -BALL_RADIUS * 0.3, -BALL_RADIUS * 0.3, BALL_RADIUS * 0.1,
    0, 0, BALL_RADIUS
  )
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)")
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.15)")
  ctx.beginPath()
  ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.restore()
}

function drawPentagon(cx, cy, radius, rotation = 0) {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    let angle = (i * 2 * Math.PI / 5) - Math.PI / 2 + rotation
    let px = cx + Math.cos(angle) * radius
    let py = cy + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

function drawGoal() {
  let netSpacing = BALL_RADIUS / 3
  let leftPost = goal.xPos - GOAL_WIDTH / 2
  let rightPost = goal.xPos + GOAL_WIDTH / 2
  ctx.strokeStyle = "#555"
  ctx.lineWidth = 1.5
  for (let x = leftPost; x <= rightPost; x += netSpacing) {
    ctx.beginPath()
    ctx.moveTo(x, goal.yPos)
    ctx.lineTo(x, goal.yPos + GOAL_HEIGHT)
    ctx.stroke()
  }
  for (let y = goal.yPos; y <= goal.yPos + GOAL_HEIGHT; y += netSpacing) {
    ctx.beginPath()
    ctx.moveTo(leftPost, y)
    ctx.lineTo(rightPost, y)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(goal.xPos, goal.yPos)
  ctx.lineTo(goal.xPos - GOAL_WIDTH / 2, goal.yPos)
  ctx.lineTo(goal.xPos - GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
  ctx.lineTo(0, goal.yPos + GOAL_HEIGHT)
  ctx.moveTo(goal.xPos, goal.yPos)
  ctx.lineTo(goal.xPos + GOAL_WIDTH / 2, goal.yPos)
  ctx.lineTo(goal.xPos + GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
  ctx.lineTo(canvas.width, goal.yPos + GOAL_HEIGHT)
  ctx.lineWidth = 5
  ctx.strokeStyle = "grey"
  ctx.stroke()
  ctx.closePath()
}

function drawCannon() {
  let color = "red"
  ctx.save()
  ctx.translate(cannon.xPos, cannon.yPos)
  ctx.rotate(cannon.angle)
  ctx.beginPath()
  ctx.arc(0, 0, BALL_RADIUS * .75, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
  ctx.fillStyle = "black"
  ctx.beginPath()
  ctx.moveTo(0, -BALL_RADIUS * 0.6)
  ctx.lineTo(BALL_RADIUS * 0.4, BALL_RADIUS * 0.2)
  ctx.lineTo(BALL_RADIUS * 0.15, BALL_RADIUS * 0.2)
  ctx.lineTo(BALL_RADIUS * 0.15, BALL_RADIUS * 0.6)
  ctx.lineTo(-BALL_RADIUS * 0.15, BALL_RADIUS * 0.6)
  ctx.lineTo(-BALL_RADIUS * 0.15, BALL_RADIUS * 0.2)
  ctx.lineTo(-BALL_RADIUS * 0.4, BALL_RADIUS * 0.2)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, BALL_RADIUS, BALL_RADIUS * .375, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawPuddle() {
  ctx.beginPath()
  ctx.arc(puddle.xPos, puddle.yPos, BALL_RADIUS * .75, 0, 2 * Math.PI)
  ctx.fillStyle = "blue"
  ctx.fill()
}

function drawWall() {
  let color = "#654321"
  let ends = getWallEnds()
  ctx.beginPath()
  ctx.moveTo(ends.a.xPos, ends.a.yPos)
  ctx.lineTo(ends.b.xPos, ends.b.yPos)
  ctx.lineWidth = BALL_RADIUS / 4
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.save()
  ctx.translate(ends.a.xPos, ends.a.yPos)
  ctx.rotate(wall.angle)
  ctx.beginPath()
  ctx.rect(-BALL_RADIUS * .375, -BALL_RADIUS * .375, BALL_RADIUS * .75, BALL_RADIUS * .75)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
  ctx.beginPath()
  ctx.arc(ends.b.xPos, ends.b.yPos, BALL_RADIUS * .375, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

function drawWormhole() {
  let color = "purple"
  for (let wormhole of [wormholeA, wormholeB]) {
    ctx.beginPath()
    ctx.arc(wormhole.xPos, wormhole.yPos, BALL_RADIUS * .75, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(wormholeA.xPos, wormholeA.yPos)
  ctx.lineTo(wormholeB.xPos, wormholeB.yPos)
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.closePath()
}

function drawKey() {
  if (key.isEnabled) {
    let color = "orange"
    ctx.save()
    ctx.translate(key.xPos, key.yPos)
    ctx.rotate(-Math.PI / 4)
    
    // Key Head (ring)
    ctx.beginPath()
    ctx.arc(-KEY_SIZE * 0.4, 0, KEY_SIZE * 0.4, 0, 2 * Math.PI)
    ctx.strokeStyle = color
    ctx.lineWidth = KEY_SIZE * 0.2
    ctx.stroke()
    
    // Key Shaft
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(KEY_SIZE, 0)
    ctx.lineWidth = KEY_SIZE * 0.16
    ctx.lineCap = "round"
    ctx.stroke()
    
    // Key Teeth
    ctx.beginPath()
    ctx.moveTo(KEY_SIZE * 0.6, 0)
    ctx.lineTo(KEY_SIZE * 0.6, KEY_SIZE * 0.3)
    ctx.moveTo(KEY_SIZE * 0.9, 0)
    ctx.lineTo(KEY_SIZE * 0.9, KEY_SIZE * 0.3)
    ctx.lineWidth = KEY_SIZE * 0.16
    ctx.lineCap = "round"
    ctx.stroke()
    
    ctx.restore()

    ctx.beginPath()
    ctx.moveTo(goal.xPos - GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineTo(goal.xPos + GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineWidth = 5
    ctx.strokeStyle = color
    ctx.stroke()
  }
}

function drawBonus() {
  if (bonus.isEnabled) {
    ctx.fillStyle = "green"
    ctx.lineWidth = 3
    ctx.beginPath()
    let starPoints = 5
    let outerRadius = BALL_RADIUS * .75
    let innerRadius = BALL_RADIUS * .25
    for (let i = 0; i < starPoints * 2; i++) {
      let angle = (Math.PI * i) / starPoints - Math.PI / 2
      let radius = (i % 2 === 0) ? outerRadius : innerRadius
      let px = bonus.xPos + Math.cos(angle) * radius
      let py = bonus.yPos + Math.sin(angle) * radius
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.closePath()
    ctx.fill()
  }
}

function drawSelectionBorder() {
  if (!selectedObstacle) return
  ctx.beginPath()
  ctx.arc(selectedObstacle.xPos, selectedObstacle.yPos, BALL_RADIUS * 1.3, 0, 2 * Math.PI)
  ctx.strokeStyle = "green"
  ctx.lineWidth = 4
  ctx.stroke()
}

function drawElectricityLine(fromX, fromY, toX, toY) {
  ctx.save()
  
  // Calculate distance and direction
  let dx = toX - fromX
  let dy = toY - fromY
  let distance = Math.hypot(dx, dy)
  
  if (distance < 1) {
    ctx.restore()
    return
  }
  
  // Normalize direction
  let nx = dx / distance
  let ny = dy / distance
  // Perpendicular direction for offsets
  let px = -ny
  let py = nx
  
  // Time-based animation for electricity flicker
  let time = Date.now() * 0.01
  
  // Draw glow effect (outer layer)
  ctx.strokeStyle = "rgba(77, 208, 225, 0.3)"
  ctx.lineWidth = 8
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
  
  // Draw main electricity line with jagged segments
  let segments = Math.max(5, Math.floor(distance / 30))
  
  // Draw multiple electricity arcs for effect
  for (let arc = 0; arc < 3; arc++) {
    ctx.strokeStyle = arc === 0 ? "#4dd0e1" : "rgba(150, 230, 240, 0.6)"
    ctx.lineWidth = arc === 0 ? 2 : 1
    
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    
    for (let i = 1; i < segments; i++) {
      let t = i / segments
      // Base position along the line
      let baseX = fromX + dx * t
      let baseY = fromY + dy * t
      
      // Add random offset perpendicular to the line (electricity jitter)
      // Use time and position to create animated noise
      let noise1 = Math.sin(time + i * 3.7 + arc * 2.1) * 0.5 + Math.sin(time * 1.3 + i * 2.3) * 0.5
      let noise2 = Math.cos(time * 0.8 + i * 4.1 + arc * 1.7) * 0.5 + Math.cos(time * 1.7 + i * 1.9) * 0.5
      let offset = (noise1 + noise2) * 12 * (1 - Math.abs(t - 0.5) * 2) // Stronger in middle
      
      let jitterX = baseX + px * offset
      let jitterY = baseY + py * offset
      
      ctx.lineTo(jitterX, jitterY)
    }
    
    ctx.lineTo(toX, toY)
    ctx.stroke()
  }
  
  // Draw bright core
  ctx.strokeStyle = "#aae6f0"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
  
  // Add small spark effects at both ends
  let sparkCount = 3
  for (let i = 0; i < sparkCount; i++) {
    let sparkAngle = time * 2 + i * (Math.PI * 2 / sparkCount)
    let sparkLen = 8 + Math.sin(time * 3 + i) * 4
    
    ctx.strokeStyle = "rgba(150, 230, 240, 0.8)"
    ctx.lineWidth = 1
    
    // Spark at from end
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(
      fromX + Math.cos(sparkAngle) * sparkLen,
      fromY + Math.sin(sparkAngle) * sparkLen
    )
    ctx.stroke()
    
    // Spark at to end
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX + Math.cos(sparkAngle + Math.PI) * sparkLen,
      toY + Math.sin(sparkAngle + Math.PI) * sparkLen
    )
    ctx.stroke()
  }
  
  ctx.restore()
}

function drawSelectionElectricity() {
  if (!selectedObstacle || !selectedObstacle.isEnabled || isBallHidden) return
  
  let ballX = ball.xPos
  let ballY = ball.yPos
  let spriteX = selectedObstacle.xPos
  let spriteY = selectedObstacle.yPos
  
  drawElectricityLine(spriteX, spriteY, ballX, ballY)
}

function drawSwapAnimationElectricity() {
  if (!swapAnimation || isBallHidden) return
  
  let ballX = ball.xPos
  let ballY = ball.yPos
  
  // Draw electricity to obstacleA
  if (swapAnimation.obstacleA && swapAnimation.obstacleA.isEnabled) {
    let aX = swapAnimation.obstacleA.xPos
    let aY = swapAnimation.obstacleA.yPos
    drawElectricityLine(aX, aY, ballX, ballY)
  }
  
  // Draw electricity to obstacleB
  if (swapAnimation.obstacleB && swapAnimation.obstacleB.isEnabled) {
    let bX = swapAnimation.obstacleB.xPos
    let bY = swapAnimation.obstacleB.yPos
    drawElectricityLine(bX, bY, ballX, ballY)
  }
}

function drawSwappableBorders() {
  // Only show borders when an obstacle is selected and swap hasn't started
  if (!selectedObstacle || swapAnimation || isBallHidden) return
  
  let time = Date.now() * 0.01
  
  for (let obstacle of swappableObstacles) {
    // Skip the selected obstacle (it has its own green border)
    if (obstacle === selectedObstacle || !obstacle.isEnabled) continue
    
    ctx.save()
    
    // Pulsing teal electricity border
    let pulse = 1
    let radius = BALL_RADIUS * 1.3
    
    // Draw multiple layers for electricity effect
    for (let layer = 0; layer < 3; layer++) {
      let opacity = layer === 0 ? 0.3 * pulse : (layer === 1 ? 0.6 * pulse : 0.8 * pulse)
      let lineWidth = layer === 0 ? 6 : (layer === 1 ? 3 : 1)
      
      ctx.strokeStyle = layer === 0 
        ? `rgba(77, 208, 225, ${opacity})`
        : layer === 1
        ? `rgba(150, 230, 240, ${opacity})`
        : `rgba(170, 235, 245, ${opacity})`
      ctx.lineWidth = lineWidth
      ctx.lineCap = "round"
      
      // Create jagged border effect
      let segments = 16
      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        let angle = (i / segments) * Math.PI * 2
        let jitter = Math.sin(time * 2 + i * 0.5) * 2 + Math.cos(time * 1.5 + i * 0.7) * 2
        let r = radius + jitter * (layer === 0 ? 1 : 0.5)
        let x = obstacle.xPos + Math.cos(angle) * r
        let y = obstacle.yPos + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }
    
    // Add spark effects around the border
    let sparkCount = 6
    for (let i = 0; i < sparkCount; i++) {
      let sparkAngle = (i / sparkCount) * Math.PI * 2 + time * 2
      let sparkLen = 5 + Math.sin(time * 3 + i) * 3
      let sparkX = obstacle.xPos + Math.cos(sparkAngle) * radius
      let sparkY = obstacle.yPos + Math.sin(sparkAngle) * radius
      
      ctx.strokeStyle = `rgba(150, 230, 240, ${0.8 * pulse})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sparkX, sparkY)
      ctx.lineTo(
        sparkX + Math.cos(sparkAngle) * sparkLen,
        sparkY + Math.sin(sparkAngle) * sparkLen
      )
      ctx.stroke()
    }
    
    ctx.restore()
  }
}

function getCircleBorderPoint(letterX, letterY, targetX, targetY) {
  // Calculate circle radius
  let radius = LETTER_SQUARE_SIZE / 2
  
  // Find intersection point of line from target (ball) to letter center with circle border
  let dx = letterX - targetX
  let dy = letterY - targetY
  let distance = Math.hypot(dx, dy)
  
  // If target is inside or at center, return point on circle in direction of target
  if (distance < radius || distance === 0) {
    // Return point on circle in the direction from center to target
    let angle = Math.atan2(targetY - letterY, targetX - letterX)
    return {
      x: letterX + Math.cos(angle) * radius,
      y: letterY + Math.sin(angle) * radius
    }
  }
  
  // Calculate intersection with circle
  // Normalize direction vector
  let nx = dx / distance
  let ny = dy / distance
  
  // Point on circle in direction from target to letter center
  return {
    x: letterX - nx * radius,
    y: letterY - ny * radius
  }
}

function drawLetterSelectionBorder() {
  if (!selectedLetter || !hasFlung) return
  
  let letterX = selectedLetter.xPos
  let letterY = selectedLetter.yPos
  let radius = LETTER_SQUARE_SIZE / 2
  
  ctx.save()
  
  let time = Date.now() * 0.01
  
  // Draw multiple layers for electricity effect
  for (let layer = 0; layer < 3; layer++) {
    let opacity = layer === 0 ? 0.3 : (layer === 1 ? 0.6 : 0.8)
    let lineWidth = layer === 0 ? 6 : (layer === 1 ? 3 : 1)
    
    ctx.strokeStyle = layer === 0 
      ? `rgba(77, 208, 225, ${opacity})`
      : layer === 1
      ? `rgba(150, 230, 240, ${opacity})`
      : `rgba(170, 235, 245, ${opacity})`
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    
    // Create jagged border effect around the circle
    let segments = 32
    ctx.beginPath()
    
    for (let i = 0; i <= segments; i++) {
      let angle = (i / segments) * Math.PI * 2
      let jitter = Math.sin(time * 2 + i * 0.5) * 2 + Math.cos(time * 1.5 + i * 0.7) * 2
      let r = radius + jitter * (layer === 0 ? 1 : 0.5)
      let x = letterX + Math.cos(angle) * r
      let y = letterY + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    
    ctx.closePath()
    ctx.stroke()
  }
  
  // Add spark effects around the circle
  let sparkCount = 8
  for (let i = 0; i < sparkCount; i++) {
    let sparkAngle = (i / sparkCount) * Math.PI * 2 + time * 2
    let sparkLen = 5 + Math.sin(time * 3 + i) * 3
    let sparkX = letterX + Math.cos(sparkAngle) * radius
    let sparkY = letterY + Math.sin(sparkAngle) * radius
    
    ctx.strokeStyle = `rgba(150, 230, 240, 0.8)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(sparkX, sparkY)
    ctx.lineTo(
      sparkX + Math.cos(sparkAngle) * sparkLen,
      sparkY + Math.sin(sparkAngle) * sparkLen
    )
    ctx.stroke()
  }
  
  ctx.restore()
}

function drawLetterSelectionElectricity() {
  if (!selectedLetter || !hasFlung) return
  
  let ballX = ball.xPos
  let ballY = ball.yPos
  let letterX = selectedLetter.xPos
  let letterY = selectedLetter.yPos
  
  // Get the point on the circle border closest to the ball
  let borderPoint = getCircleBorderPoint(letterX, letterY, ballX, ballY)
  
  drawElectricityLine(borderPoint.x, borderPoint.y, ballX, ballY)
}

function drawLetterSwapAnimationElectricity() {
  if (!letterSwapAnimation || !hasFlung) return
  
  let ballX = ball.xPos
  let ballY = ball.yPos
  
  // Draw electricity to letterA
  if (letterSwapAnimation.letterA) {
    let aX = letterSwapAnimation.letterA.xPos
    let aY = letterSwapAnimation.letterA.yPos
    let borderPoint = getCircleBorderPoint(aX, aY, ballX, ballY)
    drawElectricityLine(borderPoint.x, borderPoint.y, ballX, ballY)
  }
  
  // Draw electricity to letterB
  if (letterSwapAnimation.letterB) {
    let bX = letterSwapAnimation.letterB.xPos
    let bY = letterSwapAnimation.letterB.yPos
    let borderPoint = getCircleBorderPoint(bX, bY, ballX, ballY)
    drawElectricityLine(borderPoint.x, borderPoint.y, ballX, ballY)
  }
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

// ai swap/rotate code 

let swapAnimation = null

function handleTouchstartToRotate() {
  let cannonHandle = getCannonHandle()
  if (isClose(touch1, cannonHandle, BALL_RADIUS)) {
    rotatingObstacle = cannon
    return
  }
  let wallEnds = getWallEnds()
  if (isClose(touch1, wallEnds.b, BALL_RADIUS)) {
    rotatingObstacle = wall
    return
  }
}

function handleTouchstartToSwap() {
  if (swapAnimation) return
  let tappedObstacle = getTappedObstacle(touch1)
  if (tappedObstacle && tappedObstacle.isEnabled) {
    if (selectedObstacle && selectedObstacle !== tappedObstacle) {
      startSwapAnimation(selectedObstacle, tappedObstacle)
      selectedObstacle = null
    } else {
      selectedObstacle = tappedObstacle
    }
  } else {
    selectedObstacle = null
  }
}

function handleTouchstartToSwapLetters() {
  if (!hasFlung || letterSwapAnimation) return
  let tappedLetter = getTappedLetter(touch1)
  if (tappedLetter) {
    if (selectedLetter && selectedLetter !== tappedLetter) {
      startLetterSwapAnimation(selectedLetter, tappedLetter)
      selectedLetter = null
    } else {
      selectedLetter = tappedLetter
    }
  } else {
    selectedLetter = null
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

function startLetterSwapAnimation(letterA, letterB) {
  letterSwapAnimation = {
    letterA: letterA,
    letterB: letterB,
    startAX: letterA.xPos,
    startAY: letterA.yPos,
    startBX: letterB.xPos,
    startBY: letterB.yPos,
    progress: 0
  }
}

function updateLetterSwapAnimation() {
  if (!letterSwapAnimation) return
  letterSwapAnimation.progress++
  let t = letterSwapAnimation.progress / SWAP_DURATION
  let eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  letterSwapAnimation.letterA.xPos = letterSwapAnimation.startAX + (letterSwapAnimation.startBX - letterSwapAnimation.startAX) * eased
  letterSwapAnimation.letterA.yPos = letterSwapAnimation.startAY + (letterSwapAnimation.startBY - letterSwapAnimation.startAY) * eased
  letterSwapAnimation.letterB.xPos = letterSwapAnimation.startBX + (letterSwapAnimation.startAX - letterSwapAnimation.startBX) * eased
  letterSwapAnimation.letterB.yPos = letterSwapAnimation.startBY + (letterSwapAnimation.startAY - letterSwapAnimation.startBY) * eased
  if (letterSwapAnimation.progress >= SWAP_DURATION) {
    letterSwapAnimation.letterA.xPos = letterSwapAnimation.startBX
    letterSwapAnimation.letterA.yPos = letterSwapAnimation.startBY
    letterSwapAnimation.letterB.xPos = letterSwapAnimation.startAX
    letterSwapAnimation.letterB.yPos = letterSwapAnimation.startAY
    letterSwapAnimation = null
  }
}

function handleTouchmoveToRotate(touch2) {
  if (rotatingObstacle === cannon) {
    let dx = touch2.xPos - cannon.xPos
    let dy = touch2.yPos - cannon.yPos
    cannon.angle = Math.atan2(-dx, dy)
  }
  if (rotatingObstacle === wall) {
    let dx = touch2.xPos - wall.xPos
    let dy = touch2.yPos - wall.yPos
    wall.angle = Math.atan2(dy, dx)
    let wallLength = Math.sqrt(dx * dx + dy * dy)
    wall.length = Math.max(WALL_LENGTH, wallLength)
  }
}

function getCannonHandle() { 
  return {
    xPos: cannon.xPos - Math.sin(cannon.angle) * BALL_RADIUS * 1.5,
    yPos: cannon.yPos + Math.cos(cannon.angle) * BALL_RADIUS * 1.5
  }
}

function getWallEnds() {
  let dirX = Math.cos(wall.angle)
  let dirY = Math.sin(wall.angle)
  return {
    a: { 
      xPos: wall.xPos, 
      yPos: wall.yPos 
    },
    b: { 
      xPos: wall.xPos + wall.length * dirX, 
      yPos: wall.yPos + wall.length * dirY 
    }
  }
}

function getTappedObstacle(touch) {
  for (let obstacle of swappableObstacles) {
    if (isClose(touch, obstacle, BALL_RADIUS)) {
      return obstacle
    }
  }
  return null
}

function startSwapAnimation(obstacleA, obstacleB) {
  swapAnimation = {
    obstacleA: obstacleA,
    obstacleB: obstacleB,
    startAX: obstacleA.xPos,
    startAY: obstacleA.yPos,
    startBX: obstacleB.xPos,
    startBY: obstacleB.yPos,
    progress: 0
  }
}

function updateSwapAnimation() {
  if (!swapAnimation) return
  swapAnimation.progress++
  let t = swapAnimation.progress / SWAP_DURATION
  let eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  swapAnimation.obstacleA.xPos = swapAnimation.startAX + (swapAnimation.startBX - swapAnimation.startAX) * eased
  swapAnimation.obstacleA.yPos = swapAnimation.startAY + (swapAnimation.startBY - swapAnimation.startAY) * eased
  swapAnimation.obstacleB.xPos = swapAnimation.startBX + (swapAnimation.startAX - swapAnimation.startBX) * eased
  swapAnimation.obstacleB.yPos = swapAnimation.startBY + (swapAnimation.startAY - swapAnimation.startBY) * eased
  if (swapAnimation.progress >= SWAP_DURATION) {
    swapAnimation.obstacleA.xPos = swapAnimation.startBX
    swapAnimation.obstacleA.yPos = swapAnimation.startBY
    swapAnimation.obstacleB.xPos = swapAnimation.startAX
    swapAnimation.obstacleB.yPos = swapAnimation.startAY
    swapAnimation = null
  }
}