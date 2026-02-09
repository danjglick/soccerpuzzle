function generateMenu() {
  areObstaclesHidden = true
  isBallHidden = true
  setTimeout(() => showWelcome = true, 1000)
  setTimeout(() => showTitle = true, 2000)
  setTimeout(() => { generateBall(); ball.xPos = canvas.width / 2; isBallHidden = false }, 3500)
  initializeLetterPositions()
  loopGame()  
}

function generateLevel() {
  isCelebration = false
  tries = 0
  enemies = []
  areObstaclesHidden = false
  showWelcome = false
  showTitle = false
  hasFlung = false
  spawnedObstacles = []
  selectedObstacle = null
  cheatTaps = 0
  hasAddedTrophyThisCelebration = false 
  hasGotTrophy = false
  generateBall()
  generateGoal()
  generateEnemyList()
  for (let i = 0; i < obstacles.length; i++) generateObstacle(obstacles[i])
  generateDollars()
}

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

function generateGoal() {
  goal = {
    xPos: GOAL_WIDTH + (canvas.width - 2 * GOAL_WIDTH) * Math.random(),
    yPos: 0,
    xVel: 0,
    isEnabled: true 
  }
}

function generateEnemyList() {
  for (let i = 0; i < ENEMY_COUNT; i++) {
    let enemy = {
      xPos: 0,
      yPos: 0
    }
    enemies.push(enemy)
    obstacles.push(enemy)
  }
}

function generateDollars() {
  for (let i = 0; i < DOLLAR_COUNT; i++) {
    let dollar = {
      xPos: Math.random() * canvas.width,
      yPos: (Math.random() * canvas.height / 2 - (canvas.height * .8) + GOAL_HEIGHT),
      isEnabled: true 
    }
    for (let i = 0; i < dollars.length; i++) {
      while (isClose(dollars[i], dollar, BALL_RADIUS * 5)) {
        dollar = {
          xPos: Math.random() * canvas.width * .9 + BALL_RADIUS,
          yPos: (Math.random() * canvas.height / 2 - (canvas.height * .8) + GOAL_HEIGHT),
          isEnabled: true 
        }    
      }
    }
    dollars.push(dollar)
  } 
}

function generateObstacle(obstacle) {
  obstacle.isEnabled = true
  obstacle.angle = Math.random() * 2 * Math.PI
  obstacle.xVel = 0
  obstacle.yVel = 0
  let minY = goal.yPos + GOAL_HEIGHT + BALL_RADIUS * 2
  let maxY = ball.spawn.yPos - BALL_RADIUS * 4
  let minDistance = MIN_SPACE_FOR_SPAWN
  let maxAttempts = MAX_SPAWN_ATTEMPTS
  
  // Standard obstacle generation (wallendA and wallendB are generated independently)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    obstacle.xPos = BALL_RADIUS + (canvas.width - 2 * BALL_RADIUS) * Math.random()
    obstacle.yPos = minY + (maxY - minY) * Math.random()
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
  if (obstacle == bonus) {
    bonus.spawn = {
      xPos: obstacle.xPos,
      yPos: obstacle.yPos
    }
  }
}
