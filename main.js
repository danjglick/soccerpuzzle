// npx --yes live-server --host=0.0.0.0 --port=8080
let isCheatEnabled = true
const TAPS_TO_ACTIVATE_CHEAT = 3
let cheatTaps = 0
// http://10.0.0.145:8080

const FPS = 60
const BALL_RADIUS = window.innerWidth / 20
const BALL_SPEED_DIVISOR = 5
const BALL_RESTITUTION = .85
const BALL_MAX_SPEED = 30
const GOAL_HEIGHT = BALL_RADIUS * 1.5
const GOAL_WIDTH = BALL_RADIUS * 4
const WALL_LENGTH = BALL_RADIUS * 5
const MAX_SPAWN_ATTEMPTS = 10000
const MIN_SPACE_FOR_SPAWN = WALL_LENGTH + BALL_RADIUS
const SCURRY_SPEED_DIVISOR = 250
const SCURRY_SPOTS = [{ xPos: 0, yPos: window.innerHeight / 2 }, { xPos: 0, yPos: window.innerHeight * .25 }, { xPos: 0, yPos: 0 }, { xPos: window.innerWidth, yPos: 0 }, { xPos: window.innerWidth, yPos: window.innerHeight * .25 }, { xPos: window.innerWidth, yPos: window.innerHeight / 2 }]
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
let touch1 = { xPos: 0, yPos: 0 }
let spawnedObstacles = []
let rotatingObstacle = {}
let selectedObstacle = {}
let isScurryMode = false
let scurryingObstacles = [cannon, puddle, wall, wormholeA, wormholeB, bonus]

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
  spawnedObstacles = []
  spawnObstacle(cannon)
  spawnObstacle(puddle)
  spawnObstacle(wall)
  spawnObstacle(wormholeA)
  spawnObstacle(wormholeB)
  spawnObstacle(key)
  spawnObstacle(bonus)
  selectedObstacle = null
  isScurryMode = false
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

function handleTouchstart(e) {
  touch1.xPos = e.touches[0].clientX
  touch1.yPos = e.touches[0].clientY
  if (isClose(touch1, ball, BALL_RADIUS)) {
    ball.isBeingFlung = true
    return
  }
  handleTouchstartToRotate()
  handleTouchstartToSwap()
  if (isCheatEnabled && isClose(touch1, goal, BALL_RADIUS * 2)) { cheatTaps++; if (cheatTaps >= TAPS_TO_ACTIVATE_CHEAT) { key.isEnabled = false; } }
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

function handleTouchend() {
  ball.isBeingFlung = false
  rotatingObstacle = null
}

function loopGame() {
  moveBall()
  moveObstacles()
  handleCollision()
  draw()
  setTimeout(loopGame, getMSPerFrame())
}

function moveBall() {
  ball.xPos += ball.xVel
  ball.yPos += ball.yVel
  let isBallAtBottomEdge = ball.yPos + BALL_RADIUS >= canvas.height - BALL_RADIUS
  let speed = Math.hypot(ball.xVel, ball.yVel)
  if (isBallAtBottomEdge && speed < 19 && !ball.isBeingFlung) {
    ball.xVel = 0
    ball.yVel = 0
  }
}

function moveObstacles() {
  for (let i = 0; i < scurryingObstacles.length; i++) {
    let obstacle = scurryingObstacles[i]
    obstacle.xPos += obstacle.xVel
    obstacle.yPos += obstacle.yVel
  }
  updateSwapAnimation()
}

function handleCollision() {
  handleCollisionWithGoal()
  handleCollisionWithCannon()
  handleCollisionWithPuddle()
  handleCollisionWithWall()
  handleCollisionWithWormhole()
  handleCollisionWithKey()
  handleCollisionWithBonus()
  handleCollisionWithScurryingObstacle()
  handleCollisionWithEdge()
}

function handleCollisionWithGoal() {
  if (goal.isEnabled && !key.isEnabled) {
    let isBallPastGoalLine = ball.yPos - BALL_RADIUS < goal.yPos + GOAL_HEIGHT
    let isBallInsideRightPost = ball.xPos + BALL_RADIUS < goal.xPos + GOAL_WIDTH
    let isBallInsideLeftPost = ball.xPos - BALL_RADIUS > goal.xPos - GOAL_WIDTH
    if (isBallPastGoalLine && isBallInsideRightPost && isBallInsideLeftPost) {
      if (bonus.isEnabled) {
        alert("Goal!")
      } else {
        alert("Goal + Bonus!")
      }
      scurryObstacles()
      setTimeout(generateLevel, 5000)
    }
  }
}

function scurryObstacles() {
  isScurryMode = true
  goal.isEnabled = false
  let usedWaypoints = []
  for (let i = 0; i < scurryingObstacles.length; i++) {
    let obstacle = scurryingObstacles[i]
    obstacle.isEnabled = false
    let isObstacleInLeftHalf = obstacle.xPos < canvas.width / 2
    let exitX = isObstacleInLeftHalf ? canvas.width : 0
    let waypoint = null
    let maxAttempts = 100
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      waypoint = {
        xPos: exitX,
        yPos: Math.random() * canvas.height * 0.7
      }
      let isTooClose = false
      for (let j = 0; j < usedWaypoints.length; j++) {
        if (isClose(waypoint, usedWaypoints[j], WALL_LENGTH)) {
          isTooClose = true
          break
        }
      }
      if (!isTooClose) break
    }
    obstacle.xVel = (waypoint.xPos - obstacle.xPos) / SCURRY_SPEED_DIVISOR
    obstacle.yVel = (waypoint.yPos - obstacle.yPos) / SCURRY_SPEED_DIVISOR
    usedWaypoints.push(waypoint)
  }
}

function handleCollisionWithScurryingObstacle() {
  if (isScurryMode) {
    for (let i = 0; i < scurryingObstacles.length; i++) {
      if (isClose(scurryingObstacles[i], ball, BALL_RADIUS * 2)) {
        //alert("hit!")
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
    setTimeout(() => cannon.isEnabled = true, COOLDOWN_DURATION)
  }
}

function handleCollisionWithPuddle() {
  if (puddle.isEnabled && !ball.isBeingFlung && isClose(ball, puddle, BALL_RADIUS * 2)) {
    ball.xVel = 0
    ball.yVel = 0
  }
}

function handleCollisionWithWall() {
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

function handleCollisionWithWormhole() {
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

function handleCollisionWithKey() {
  if (isClose(ball, key, BALL_RADIUS + BALL_RADIUS / 2)) {
    key.isEnabled = false
  }
}

function handleCollisionWithBonus() {
  if (isClose(ball, bonus, BALL_RADIUS + BALL_RADIUS / 2)) {
    bonus.isEnabled = false
  }
}

function handleCollisionWithEdge() {
  let isBallAtLeftEdge = ball.xPos - BALL_RADIUS <= 0
  let isBallAtRightEdge = ball.xPos + BALL_RADIUS >= canvas.width
  let isBallAtTopEdge = ball.yPos - BALL_RADIUS < GOAL_HEIGHT
  let isBallAtBottomEdge = ball.yPos + BALL_RADIUS > canvas.height
  if (isBallAtLeftEdge) {
    ball.xPos = BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (isBallAtRightEdge) {
    ball.xPos = canvas.width - BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (isBallAtTopEdge) {
    ball.yPos = GOAL_HEIGHT + BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
  } else if (isBallAtBottomEdge) {
    ball.yPos = canvas.height - BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawGoal()
  drawCannon()
  drawPuddle()
  drawWall()
  drawWormhole()
  drawKey()
  drawBonus()
  drawBall()
  drawSelectionBorder()
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

function drawWormhole() {
  let color = "purple"
  for (let wormhole of [wormholeA, wormholeB]) {
    ctx.beginPath()
    ctx.arc(wormhole.xPos, wormhole.yPos, BALL_RADIUS, 0, 2 * Math.PI)
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
  let swappableObstacles = [cannon, puddle, wall, wormholeA, wormholeB]
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