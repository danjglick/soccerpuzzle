// npx --yes live-server --host=0.0.0.0 --port=8080
let isCheatEnabled = true
const KEY_TAPS_TO_ACTIVATE_CHEAT = 5
let keyTaps = 0
// http://10.0.0.145:8080

const FPS = 60
const MS_PER_FRAME = 1000 / FPS
const BALL_RADIUS = window.innerWidth / 20
const FLING_DIVISOR = 8
const GOAL_HEIGHT = BALL_RADIUS * 1.5
const GOAL_WIDTH = BALL_RADIUS * 4
const WALL_LENGTH = BALL_RADIUS * 5
const MAX_SPAWN_ATTEMPTS = 10000
const WEIGHTED_POOL_OF_BONUS_COUNTS = [0]//[1, 1, 1, 2, 2, 3]
const MIN_SPACE_FOR_SPAWN = WALL_LENGTH + BALL_RADIUS

let canvas;
let ctx;
let ball = { xPos: 0, yPos: 0, xVel: 0, yVel: 0, isBeingFlung: false, spawn: { xPos: 0, yPos: 0 } }
let goal = { xPos: 0, yPos: 0, isEnabled: true}
let cannon = { xPos: 0, yPos: 0, angle: 0, }
let puddle = { xPos: 0, yPos: 0 }
let wormhole = { a: { xPos: 0, yPos: 0 }, b: { xPos: 0, yPos: 0 }, isEnabled: true }
let wall = { xPos: 0, yPos: 0, angle: 0, length: WALL_LENGTH }
let key = { xPos: 0, yPos: 0, isEnabled: true }
let bonus = []
let touch1 = { xPos: 0, yPos: 0 }
let score = 0
let multiplier = 1
let placedObstacles = []
let ballSpawnY = 0

function initialize() {
  canvas = document.getElementById('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  document.addEventListener('touchstart', handleTouchstart)
  document.addEventListener('touchmove', handleTouchmove, { passive: false })
  document.addEventListener('touchend', handleTouchend)
  document.addEventListener('wheel', (e) => { e.preventDefault() }, { passive: false })
  generateLevel()
  loopGame()
}

function generateLevel() {
  spawnBall()
  spawnGoal()
  placedObstacles = []
  initializeSwapData()
  spawnObstacle(cannon)
  spawnObstacle(puddle)
  spawnObstacle(wormhole.a)
  spawnObstacle(wormhole.b)
  spawnObstacle(key)
  spawnObstacle(wall)
  setBonus()
  for (let i = 0; i < bonus.length; i++) { spawnObstacle(bonus[i]) }
  goal.isEnabled = true
  cannon.isEnabled = true
  wormhole.isEnabled = true
  key.isEnabled = true
  wall.length = WALL_LENGTH
  keyTaps = 0
}

function setBonus() {
  bonus = []
  let bonusCount = WEIGHTED_POOL_OF_BONUS_COUNTS[Math.floor(Math.random() * WEIGHTED_POOL_OF_BONUS_COUNTS.length)]
  for (let i = 0; i < bonusCount; i++) {
    bonus.push({ xPos: 0, yPos: 0})
  }
  multiplier = bonusCount + 1
}

function spawnBall() {
  let spawn = {
    xPos: BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random(),
    yPos: canvas.height - BALL_RADIUS
  }
  ball = { xPos: spawn.xPos, yPos: spawn.yPos, xVel: 0, yVel: 0, isBeingFlung: false, spawn: spawn }
}

function spawnGoal() {
  goal = {
    xPos: GOAL_WIDTH + (canvas.width - 2 * GOAL_WIDTH) * Math.random(),
    yPos: 0 
  }
}

function spawnObstacle(obstacle) {
  let obstacleMinY = goal.yPos + GOAL_HEIGHT + BALL_RADIUS * 2
  let obstacleMaxY = ball.spawn.yPos - BALL_RADIUS * 2
  let minDistance = MIN_SPACE_FOR_SPAWN
  let maxAttempts = MAX_SPAWN_ATTEMPTS
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    obstacle.xPos = BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random()
    obstacle.yPos = obstacleMinY + (obstacleMaxY - obstacleMinY) * Math.random()
    if ('angle' in obstacle) {
      obstacle.angle = Math.random() * 2 * Math.PI
    }
    if (obstacle === wall) {
      let endB = getWallEnds().b
      if (endB.xPos < BALL_RADIUS * 2 || endB.xPos > canvas.width - BALL_RADIUS * 2 ||
          endB.yPos < BALL_RADIUS * 4 || endB.yPos > canvas.height - BALL_RADIUS * 4) {
        continue
      }
    }
    let overlaps = false
    for (let placed of placedObstacles) {
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
  placedObstacles.push({ xPos: obstacle.xPos, yPos: obstacle.yPos })
}

function handleTouchstart(e) {
  touch1.xPos = e.touches[0].clientX
  touch1.yPos = e.touches[0].clientY
  if (isClose(touch1, ball, BALL_RADIUS)) {
    ball.isBeingFlung = true
    return
  }
  handleTouchstartToRotate()
  handleTouchstartToSwap()
  if (isCheatEnabled && isClose(touch1, key, BALL_RADIUS)) { keyTaps++; if (keyTaps >= KEY_TAPS_TO_ACTIVATE_CHEAT) { key.isEnabled = false; bonus = []; } return }
}

function handleTouchmove(e) {
  e.preventDefault()
  let touch2 = { xPos: e.touches[0].clientX, yPos: e.touches[0].clientY }
  if (ball.isBeingFlung) {
    ball.xVel = (touch2.xPos - touch1.xPos) / FLING_DIVISOR
    ball.yVel = (touch2.yPos - touch1.yPos) / FLING_DIVISOR
  }
  handleTouchmoveToRotate(touch2)
}

function handleTouchend() {
  ball.isBeingFlung = false
  rotatingObject = null
}

function loopGame() {
  moveBall()
  updateSwapAnimation()
  handleCollision()
  draw()
  setTimeout(loopGame, MS_PER_FRAME)
}

function moveBall() {
  ball.xPos += ball.xVel
  ball.yPos += ball.yVel
}

function handleCollision() {
  handleCollisionWithGoal()
  handleCollisionWithCannon()
  handleCollisionWithPuddle()
  handleCollisionWithWormhole()
  handleCollisionWithWall()
  handleCollisionWithKey()
  handleCollisionWithBonus()
  handleCollisionWithEdge()
}

function handleCollisionWithGoal() {
  if (goal.isEnabled) {
    if (
      ball.yPos - BALL_RADIUS < goal.yPos + GOAL_HEIGHT &&
      ball.xPos + BALL_RADIUS < goal.xPos + GOAL_WIDTH &&
      ball.xPos - BALL_RADIUS > goal.xPos - GOAL_WIDTH
    ) {
      if (!key.isEnabled) {
        alert("Goal!")
        let newPoints = 1
        if (bonus.length == 0) { newPoints *= multiplier }
        score += newPoints
        goal.isEnabled = false
        setTimeout(generateLevel, 1000)
      } else {
        ball.yVel = Math.abs(ball.yVel)
        ball.yPos = goal.yPos + GOAL_HEIGHT + BALL_RADIUS
      }
    }
  }
}

function handleCollisionWithCannon() {
  if (cannon.isEnabled && isClose(ball, cannon, BALL_RADIUS * 2)) {
    let speed = Math.hypot(ball.xVel, ball.yVel)
    ball.xVel = Math.sin(cannon.angle) * speed
    ball.yVel = -Math.cos(cannon.angle) * speed
    cannon.isEnabled = false
    setTimeout(() => cannon.isEnabled = true, 3000)
  }
}

function handleCollisionWithPuddle() {
  if (!ball.isBeingFlung && isClose(ball, puddle, BALL_RADIUS * 2)) {
    ball.xVel = 0
    ball.yVel = 0
  }
}

function handleCollisionWithWormhole() {
  if (wormhole.isEnabled) {
    if (isClose(ball, wormhole.a, BALL_RADIUS * 2)) {
      ball.xPos = wormhole.b.xPos
      ball.yPos = wormhole.b.yPos
      wormhole.isEnabled = false
      setTimeout(() => wormhole.isEnabled = true, 3000)
    } else if (isClose(ball, wormhole.b, BALL_RADIUS * 2)) {
      ball.xPos = wormhole.a.xPos
      ball.yPos = wormhole.a.yPos
      wormhole.isEnabled = false
      setTimeout(() => wormhole.isEnabled = true, 3000)
    }
  }
}

function handleCollisionWithWall() {
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

function handleCollisionWithKey() {
  if (isClose(ball, key, BALL_RADIUS + BALL_RADIUS / 2)) {
    key.isEnabled = false
  }
}

function handleCollisionWithBonus() {
  for (let i = 0; i < bonus.length; i++) {
    if (isClose(ball, bonus[i], BALL_RADIUS + BALL_RADIUS / 2)) {
      bonus.splice(i, 1)
    }
  }
}

function handleCollisionWithEdge() {
  if (ball.xPos - BALL_RADIUS <= 0) {
    ball.xPos = BALL_RADIUS
    ball.xVel = -ball.xVel
  } else if (ball.xPos + BALL_RADIUS >= canvas.width) {
    ball.xPos = canvas.width - BALL_RADIUS
    ball.xVel = -ball.xVel
  } else if (ball.yPos - BALL_RADIUS < GOAL_HEIGHT) {
    ball.yPos = GOAL_HEIGHT + BALL_RADIUS
    ball.yVel = -ball.yVel
  } else if (ball.yPos + BALL_RADIUS > canvas.height) {
    ball.yPos = canvas.height - BALL_RADIUS
    ball.yVel = -ball.yVel
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawGoal()
  drawCannon()
  drawPuddle()
  drawWormhole()
  drawWall()
  drawKey()
  drawBall()
  drawBonus()
  //drawScore()
  drawSelectionBorder()
}

function drawSelectionBorder() {
  if (!selectedObstacle) return
  ctx.beginPath()
  ctx.arc(selectedObstacle.xPos, selectedObstacle.yPos, BALL_RADIUS * 1.3, 0, 2 * Math.PI)
  ctx.strokeStyle = "green"
  ctx.lineWidth = 4
  ctx.stroke()
}

function drawBall() {
  ctx.beginPath()
  ctx.arc(ball.xPos, ball.yPos, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = "grey"
  ctx.fill()
}

function drawGoal() {
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
  ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI)
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
  ctx.arc(0, BALL_RADIUS * 1.5, BALL_RADIUS / 2, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawPuddle() {
  ctx.beginPath()
  ctx.arc(puddle.xPos, puddle.yPos, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = "blue"
  ctx.fill()
}

function drawWormhole() {
  let color = "purple"
  for (let node of Object.values(wormhole)) {
    ctx.beginPath()
    ctx.arc(node.xPos, node.yPos, BALL_RADIUS, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(wormhole.a.xPos, wormhole.a.yPos)
  ctx.lineTo(wormhole.b.xPos, wormhole.b.yPos)
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.closePath()
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
  ctx.rect(-BALL_RADIUS / 2, -BALL_RADIUS / 2, BALL_RADIUS, BALL_RADIUS)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
  ctx.beginPath()
  ctx.arc(ends.b.xPos, ends.b.yPos, BALL_RADIUS / 2, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

function drawKey() {
  if (key.isEnabled) {
    let color = "orange"
    ctx.beginPath()
    ctx.arc(key.xPos, key.yPos, BALL_RADIUS / 2, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(goal.xPos - GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineTo(goal.xPos + GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineWidth = 5
    ctx.strokeStyle = color
    ctx.stroke()
    ctx.restore()
  }
}

function drawBonus() {
  for (let i = 0; i < bonus.length; i++) {
    ctx.font = `bold ${BALL_RADIUS}px sans-serif`
    ctx.fillStyle = "green"
    ctx.fillText(`${multiplier}X`, bonus[i].xPos, bonus[i].yPos)
  }
}

function drawScore() {
  ctx.font = `bold ${GOAL_HEIGHT}px sans-serif`
  ctx.fillStyle = "grey"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(score, canvas.width - BALL_RADIUS, GOAL_HEIGHT / 3)
}

function isClose(objectA, objectB, threshold = BALL_RADIUS * 2) {
  return(
    Math.abs(objectA.xPos - objectB.xPos) < threshold && 
    Math.abs(objectA.yPos - objectB.yPos) < threshold
  )
}

// ai swap/rotate code 

let rotatingObject = null
let obstacles = []
let selectedObstacle = null
let swapAnimation = null
let SWAP_DURATION = 20

function initializeSwapData() {
  selectedObstacle = null
  obstacles = [cannon, puddle, wormhole.a, wormhole.b, wall]
}

function handleTouchstartToRotate() {
  let cannonHandle = getCannonHandle()
  if (isClose(touch1, cannonHandle, BALL_RADIUS)) {
    rotatingObject = cannon
    return
  }
  let wallEnds = getWallEnds()
  if (isClose(touch1, wallEnds.b, BALL_RADIUS)) {
    rotatingObject = wall
    return
  }
}

function handleTouchstartToSwap() {
  if (swapAnimation) return
  let tappedObstacle = getTappedObstacle(touch1)
  if (tappedObstacle) {
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

function handleTouchmoveToRotate(touch2) {
  if (rotatingObject === cannon) {
    let dx = touch2.xPos - cannon.xPos
    let dy = touch2.yPos - cannon.yPos
    cannon.angle = Math.atan2(-dx, dy)
  }
  if (rotatingObject === wall) {
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
  for (let obstacle of obstacles) {
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