// npx --yes live-server --host=0.0.0.0 --port=8080
// http://10.0.0.145:8080

const FPS = 60
const MS_PER_FRAME = 1000 / FPS
const BALL_RADIUS = window.innerWidth / 20
const FLING_DIVISOR = 4
const GOAL_HEIGHT = BALL_RADIUS
const GOAL_WIDTH = BALL_RADIUS * 4
const WALL_WIDTH = BALL_RADIUS * 5
const COLORS = { cannon: "red", puddle: "blue", wormhole: "purple", wall: "#654321", key: "orange" }
const BALL_SPAWN = { xPos: window.innerWidth / 2, yPos: window.innerHeight - BALL_RADIUS, xVel: 0, yVel: 0, isBeingFlung: false }

let canvas;
let ctx;
let ball = BALL_SPAWN
let goal = { xPos: window.innerWidth / 2, yPos: 0 }
let cannon = { xPos: 0, yPos: 0, angle: 0 }
let puddle = { xPos: 0, yPos: 0 }
let wormhole = { entrance: { xPos: 0, yPos: 0 }, exit: { xPos: 0, yPos: 0 } }
let wall = { xPos: 0, yPos: 0, angle: 0 }
let key = { xPos: 0, yPos: 0, isGot: false }
let touch1 = { xPos: 0, yPos: 0 }
let score = 0
let spawnedObstacles = []

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
}

function generateLevel() {
  ball = BALL_SPAWN
  spawnedObstacles = []
  initializeSwapData()
  spawnObstacle(cannon)
  spawnObstacle(puddle)
  spawnObstacle(wormhole.entrance)
  spawnObstacle(wormhole.exit)
  spawnObstacle(wall)
  spawnObstacle(key)
  key.isGot = false
  loopGame()
}

function spawnObstacle(obstacle) {
  let obstacleMinY = goal.yPos + GOAL_HEIGHT + BALL_RADIUS * 2
  let obstacleMaxY = BALL_SPAWN.yPos - BALL_RADIUS * 2
  let minDistance = BALL_RADIUS * 2.5
  let maxAttempts = 100
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    obstacle.xPos = BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random()
    obstacle.yPos = obstacleMinY + (obstacleMaxY - obstacleMinY) * Math.random()
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
  spawnedObstacles.push({ xPos: obstacle.xPos, yPos: obstacle.yPos })
  if ('angle' in obstacle) {
    obstacle.angle = Math.random() * 2 * Math.PI
  }
}

function resetLevel() {
  ball = BALL_SPAWN
  key.isGot = false
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
  wallPivot = null
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
  handleCollisionWithEdge()
}

function handleCollisionWithGoal() {
  if (
    ball.yPos - BALL_RADIUS < goal.yPos + GOAL_HEIGHT &&
    ball.xPos + BALL_RADIUS < goal.xPos + GOAL_WIDTH &&
    ball.xPos - BALL_RADIUS > goal.xPos - GOAL_WIDTH
  ) {
    if (key.isGot) {
      score++
      generateLevel()
      return
    } else {
      ball.yVel = -ball.yVel
    }
  }
}

function handleCollisionWithCannon() {
  if (isClose(ball, cannon, BALL_RADIUS * 2)) {
    let speed = Math.sqrt(ball.xVel * ball.xVel + ball.yVel * ball.yVel)
    ball.xVel = Math.sin(cannon.angle) * speed
    ball.yVel = -Math.cos(cannon.angle) * speed
  }
}

function handleCollisionWithPuddle() {
  if (isClose(ball, puddle, BALL_RADIUS * 2)) {
    ball.xVel = 0
    ball.yVel = 0
  }
}

function handleCollisionWithWormhole() {
  if (isClose(ball, wormhole.entrance, BALL_RADIUS * 2)) {
    ball.xPos = wormhole.exit.xPos
    ball.yPos = wormhole.exit.yPos
  }
}

function handleCollisionWithWall() {
  let dirX = Math.cos(wall.angle)
  let dirY = Math.sin(wall.angle)
  let startX = wall.xPos - WALL_WIDTH / 2 * dirX
  let startY = wall.yPos - WALL_WIDTH / 2 * dirY
  let toStartX = ball.xPos - startX
  let toStartY = ball.yPos - startY
  let projection = Math.max(0, Math.min(WALL_WIDTH, toStartX * dirX + toStartY * dirY))
  let closestX = startX + projection * dirX
  let closestY = startY + projection * dirY
  let toClosestX = ball.xPos - closestX
  let toClosestY = ball.yPos - closestY
  let distance = Math.sqrt(toClosestX * toClosestX + toClosestY * toClosestY)
  let threshold = BALL_RADIUS + BALL_RADIUS / 8
  if (distance < threshold) {
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
    key.isGot = true
  }
}

function handleCollisionWithEdge() {
  if (ball.xPos - BALL_RADIUS <= 0) {
    ball.xPos = BALL_RADIUS
    ball.xVel = -ball.xVel
  } else if (ball.xPos + BALL_RADIUS >= canvas.width) {
    ball.xPos = canvas.width - BALL_RADIUS
    ball.xVel = -ball.xVel
  } else if (ball.yPos - BALL_RADIUS < 0) {
    ball.yPos = BALL_RADIUS
    ball.yVel = -ball.yVel
  } else if (ball.yPos + BALL_RADIUS > canvas.height) {
    ball.yPos = canvas.height - BALL_RADIUS
    ball.yVel = -ball.yVel
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawBall()
  drawGoal()
  drawCannon()
  drawPuddle()
  drawWormhole()
  drawWall()
  drawKey()
  drawScore()
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
  for (let i = 0; i < 2; i++) {
    let half_goal_width = (i == 1 ? GOAL_WIDTH : -GOAL_WIDTH) / 2
    ctx.rect(goal.xPos, goal.yPos, half_goal_width, GOAL_HEIGHT)
  }
  ctx.fillStyle = "grey"
  ctx.fill()
}

function drawCannon() {
  ctx.save()
  ctx.translate(cannon.xPos, cannon.yPos)
  ctx.rotate(cannon.angle)
  ctx.beginPath()
  ctx.arc(0, 0, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = COLORS.cannon
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
  ctx.fillStyle = COLORS.cannon
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
  ctx.beginPath()
  ctx.arc(wormhole.entrance.xPos, wormhole.entrance.yPos, BALL_RADIUS, 0, 2 * Math.PI)
  ctx.fillStyle = "purple"
  ctx.fill()
  ctx.beginPath()
  ctx.arc(wormhole.exit.xPos, wormhole.exit.yPos, BALL_RADIUS / 4, 0, 2 * Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(wormhole.entrance.xPos, wormhole.entrance.yPos)
  ctx.lineTo(wormhole.exit.xPos, wormhole.exit.yPos)
  ctx.lineWidth = 1
  ctx.strokeStyle = "purple"
  ctx.stroke()
  ctx.closePath()
}

function drawWall() {
  let ends = getWallEnds()
  ctx.beginPath()
  ctx.moveTo(ends.a.xPos, ends.a.yPos)
  ctx.lineTo(ends.b.xPos, ends.b.yPos)
  ctx.lineWidth = BALL_RADIUS / 4
  ctx.strokeStyle = COLORS.wall
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(ends.a.xPos, ends.a.yPos, BALL_RADIUS / 2, 0, 2 * Math.PI)
  ctx.fillStyle = COLORS.wall
  ctx.fill()
  ctx.beginPath()
  ctx.arc(ends.b.xPos, ends.b.yPos, BALL_RADIUS / 2, 0, 2 * Math.PI)
  ctx.fillStyle = COLORS.wall
  ctx.fill()
}

function drawKey() {
  ctx.beginPath()
  ctx.arc(key.xPos, key.yPos, BALL_RADIUS / 2, 0, 2 * Math.PI)
  ctx.fillStyle = COLORS.key
  ctx.fill()
  if (!key.isGot) {
    ctx.beginPath()
    ctx.moveTo(goal.xPos - GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineTo(goal.xPos + GOAL_WIDTH / 2, goal.yPos + GOAL_HEIGHT)
    ctx.lineWidth = GOAL_HEIGHT / 2
    ctx.strokeStyle = COLORS.key
    ctx.stroke()
    ctx.restore()
  }
}

function drawScore() {
  ctx.font = `bold ${GOAL_HEIGHT * 1.5}px sans-serif`
  ctx.fillStyle = "black"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(score, goal.xPos, goal.yPos + GOAL_HEIGHT / 2)
}

function isClose(objectA, objectB, threshold = BALL_RADIUS * 2) {
  return(
    Math.abs(objectA.xPos - objectB.xPos) < threshold && 
    Math.abs(objectA.yPos - objectB.yPos) < threshold
  )
}


// ai swap/rotate code 

let rotatingObject = null
let wallPivot = null
let obstacles = []
let selectedObstacle = null
let swapAnimation = null
let SWAP_DURATION = 20

function initializeSwapData() {
  selectedObstacle = null
  obstacles = [cannon, puddle, wormhole.entrance, wormhole.exit, wall, key]
}

function handleTouchstartToRotate() {
  let cannonHandle = getCannonHandle()
  if (isClose(touch1, cannonHandle, BALL_RADIUS)) {
    rotatingObject = cannon
    return
  }
  let wallEnds = getWallEnds()
  if (isClose(touch1, wallEnds.a, BALL_RADIUS)) {
    rotatingObject = wall
    wallPivot = wallEnds.b
    return
  }
  if (isClose(touch1, wallEnds.b, BALL_RADIUS)) {
    rotatingObject = wall
    wallPivot = wallEnds.a
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
  if (rotatingObject === wall && wallPivot) {
    let dx = touch2.xPos - wallPivot.xPos
    let dy = touch2.yPos - wallPivot.yPos
    wall.angle = Math.atan2(dy, dx)
    wall.xPos = wallPivot.xPos + Math.cos(wall.angle) * WALL_WIDTH / 2
    wall.yPos = wallPivot.yPos + Math.sin(wall.angle) * WALL_WIDTH / 2
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
    a: { xPos: wall.xPos - WALL_WIDTH / 2 * dirX, yPos: wall.yPos - WALL_WIDTH / 2 * dirY },
    b: { xPos: wall.xPos + WALL_WIDTH / 2 * dirX, yPos: wall.yPos + WALL_WIDTH / 2 * dirY }
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


