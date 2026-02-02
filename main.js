// Simple prototype: objects fall from sky, ball hits them to make them disappear

const FPS = 60
const BALL_RADIUS = window.innerWidth / 15
const BALL_SPEED_DIVISOR = 3
const BALL_RESTITUTION = .85
const BALL_MIN_SPEED = 30
const BALL_FRICTION = 1

let canvas
let ctx
let ball = {}
let fallingObjects = []
let touch1 = { xPos: 0, yPos: 0 }
let lastSpawnTime = 0
const SPAWN_INTERVAL = 500 // spawn new object every 500ms
const FALL_SPEED = 2

// INITIALIZE

function initialize() {
  canvas = document.getElementById('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  document.addEventListener('touchstart', handleTouchstart)
  document.addEventListener('touchmove', handleTouchmove, { passive: false })
  document.addEventListener('touchend', handleTouchend)
  document.addEventListener('wheel', (e) => { e.preventDefault() }, { passive: false })
  generateBall()
  loopGame()
}

// GENERATE

function generateBall() {
  let spawn = {
    xPos: canvas.width / 2,
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

function spawnFallingObject() {
  fallingObjects.push({
    xPos: Math.random() * canvas.width,
    yPos: -30,
    size: 20 + Math.random() * 30,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  })
}

// LOOP

function loopGame() {
  update()
  draw()
  setTimeout(loopGame, 1000 / FPS)
}

// UPDATE

function update() {
  moveBall()
  moveFallingObjects()
  spawnObjects()
  handleCollisions()
}

function moveBall() {
  ball.xPos += ball.xVel
  ball.yPos += ball.yVel
  ball.angle += ball.xVel / BALL_RADIUS
  ball.xVel *= BALL_FRICTION
  ball.yVel *= BALL_FRICTION
  handleEdge()
}

function handleEdge() {
  let isBallAtLeftEdge = ball.xPos - BALL_RADIUS <= 0
  let isBallAtRightEdge = ball.xPos + BALL_RADIUS >= canvas.width
  let isBallAtTopEdge = ball.yPos - BALL_RADIUS <= 0
  let isBallAtBottomEdge = ball.yPos + BALL_RADIUS >= canvas.height
  
  if (isBallAtLeftEdge) {
    ball.xPos = BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (isBallAtRightEdge) {
    ball.xPos = canvas.width - BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (isBallAtTopEdge) {
    ball.yPos = BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
  } else if (isBallAtBottomEdge) {
    ball.yPos = canvas.height - BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
    let speed = Math.hypot(ball.xVel, ball.yVel)
    if (!ball.isBeingFlung && speed < BALL_MIN_SPEED) {
      ball.xVel = 0
      ball.yVel = 0
    }
  }
}

function moveFallingObjects() {
  for (let i = fallingObjects.length - 1; i >= 0; i--) {
    fallingObjects[i].yPos += FALL_SPEED
    
    // Remove if off screen
    if (fallingObjects[i].yPos > canvas.height + 50) {
      fallingObjects.splice(i, 1)
    }
  }
}

function spawnObjects() {
  let now = Date.now()
  if (now - lastSpawnTime > SPAWN_INTERVAL) {
    spawnFallingObject()
    lastSpawnTime = now
  }
}

function handleCollisions() {
  for (let i = fallingObjects.length - 1; i >= 0; i--) {
    let obj = fallingObjects[i]
    let dx = ball.xPos - obj.xPos
    let dy = ball.yPos - obj.yPos
    let distance = Math.sqrt(dx * dx + dy * dy)
    let minDistance = BALL_RADIUS + obj.size / 2
    
    if (distance < minDistance) {
      // Collision! Remove the object
      fallingObjects.splice(i, 1)
    }
  }
}

// HANDLE INPUT

function handleTouchstart(e) {
  touch1.xPos = e.touches[0].clientX
  touch1.yPos = e.touches[0].clientY
  let dx = touch1.xPos - ball.xPos
  let dy = touch1.yPos - ball.yPos
  let distance = Math.sqrt(dx * dx + dy * dy)
  if (distance < BALL_RADIUS * 2) {
    ball.isBeingFlung = true
  }
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
}

function handleTouchend() {
  ball.isBeingFlung = false
}

// DRAW

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawFallingObjects()
  drawBall()
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

function drawFallingObjects() {
  for (let obj of fallingObjects) {
    ctx.beginPath()
    ctx.arc(obj.xPos, obj.yPos, obj.size / 2, 0, 2 * Math.PI)
    ctx.fillStyle = obj.color
    ctx.fill()
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
