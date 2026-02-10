function handleTouchstart(e) {
  touch1.xPos = e.touches[0].clientX + camera.xPos
  touch1.yPos = e.touches[0].clientY + camera.yPos
  if (isClose(touch1, ball, BALL_RADIUS)) {
    ball.isBeingFlung = true
    return
  }
  // if (hasFlung && isPlaySpelledCorrectly()) { // Check if tapping on "play" rectangle when correctly spelled
  //   if (isTouchingPlayRectangle(touch1)) {
  //     generateLevel()
  //     return
  //   }
  // }
  // handleTouchstartToSwapLetters()
  handleTouchstartToRotate()
  handleTouchstartToSwap()
  handleCheatTap()
}

function handleTouchmove(e) {
  e.preventDefault()
  let touch2 = { 
    xPos: e.touches[0].clientX + camera.xPos, 
    yPos: e.touches[0].clientY + camera.yPos 
  }
  if (ball.isBeingFlung) {
    hasFlung = true
    ball.xVel = (touch2.xPos - touch1.xPos) / BALL_SPEED_DIVISOR
    ball.yVel = (touch2.yPos - touch1.yPos) / BALL_SPEED_DIVISOR
    setTimeout(() => { isTwinAPassing = false; isTwinBPassing = false }, 100)
    if (isClose(touch1, puddle, BALL_RADIUS)) {
      setTimeout(() => puddle.isEnabled = true, 1000)
    }
  }
  handleTouchmoveToRotate(touch2)
}

function handleTouchend() {
  ball.isBeingFlung = false
  rotatingObstacle = null
}

function handleContinueBtn() {
  isCelebration = false
  document.getElementById("continueBtn").hidden = true
  dollars = []
  panCamera(false, 0)
  generateLevel()   
}

function handleCollision() {
  handleGoal()
  handleCannon()
  handlePuddle()
  handleWall()
  handleWormhole()
  handleTwinA()
  handleTwinB()
  handleKey()
  handleBonus()
  handleMystery()
  handleEnemy()
  handleEdge()
  handleDollar()
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
      //alert("Goal!")
      //alert(getAlertText(bonusText))
      //generateLevel()
      isCelebration = true
      hasAddedTrophyThisCelebration = false
      hasFlung = false
      // function shelfTrophy() {
      //   if (hasGotTrophy && !hasAddedTrophyThisCelebration) {
      //     hasGotTrophy = false
      //     bonus.isEnabled = false
      //     hasAddedTrophyThisCelebration = true
      //     trophies.push(tries)
      //   }
      // }
      // setTimeout(shelfTrophy, 2500) 
      setTimeout(() => panCamera(), 1000)
    }
  }
}

function handleCannon() {
  if (cannon.isEnabled && isClose(ball, cannon, BALL_RADIUS)) {
    let speed = Math.hypot(ball.xVel, ball.yVel)
    ball.xVel = Math.sin(cannon.angle) * speed
    ball.yVel = -Math.cos(cannon.angle) * speed
    cannon.isEnabled = false
    setTimeout(() => cannon.isEnabled = true, COOLDOWN_DURATION)
  }
}

function handlePuddle() {
  if (puddle.isEnabled && !ball.isBeingFlung && isClose(ball, puddle, BALL_RADIUS)) {
    ball.xVel = 0
    ball.yVel = 0
    ball.xPos = puddle.xPos
    ball.yPos = puddle.yPos
    puddle.isEnabled = false
  }
}

function handleWall() {
  if (!wallendA.isEnabled || !wallendB.isEnabled) return
  let ends = getWallEnds()
  let dirX = ends.b.xPos - ends.a.xPos
  let dirY = ends.b.yPos - ends.a.yPos
  let wallLength = Math.sqrt(dirX * dirX + dirY * dirY)
  if (wallLength < 0.01) return
  dirX /= wallLength
  dirY /= wallLength
  let toWallX = ball.xPos - ends.a.xPos
  let toWallY = ball.yPos - ends.a.yPos
  let projection = Math.max(0, Math.min(wallLength, toWallX * dirX + toWallY * dirY))
  let closestX = ends.a.xPos + projection * dirX
  let closestY = ends.a.yPos + projection * dirY
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

function handleWormhole() {
  if (wormholeA.isEnabled && isClose(ball, wormholeA, BALL_RADIUS)) {
    ball.xPos = wormholeB.xPos
    ball.yPos = wormholeB.yPos
    let xVel = ball.xVel
    let yVel = ball.yVel
    ball.xVel = 0
    ball.yVel = 0
    isBallHidden = true
    if (hasGotTrophy) bonus.isEnabled = false
    setTimeout(() => {
      isBallHidden = false
      bonus.isEnabled = true
      ball.xVel = xVel
      ball.yVel = yVel
    }, 750)
    cooldownWormhole()
  } else if (wormholeB.isEnabled && isClose(ball, wormholeB, BALL_RADIUS + BALL_RADIUS)) {
    ball.xPos = wormholeA.xPos
    ball.yPos = wormholeA.yPos
    let xVel = ball.xVel
    let yVel = ball.yVel
    ball.xVel = 0
    ball.yVel = 0
    isBallHidden = true
    if (hasGotTrophy) bonus.isEnabled = false
    setTimeout(() => {
      isBallHidden = false
      bonus.isEnabled = true
      ball.xVel = xVel
      ball.yVel = yVel
    }, 750)
    cooldownWormhole()
  }
}

function handleTwinA() {
  if (twinA.isEnabled && isClose(twinA, ball, BALL_RADIUS)) {
    if (isTwinBPassing) {
      ball.xVel = 0
      ball.yVel = 0
    } else {
      isTwinAPassing = true
      ball.xVel = (twinB.xPos - ball.xPos) * .05
      ball.yVel = (twinB.yPos - ball.yPos) * .05
    }
  }
}

function handleTwinB() {
  if (twinB.isEnabled && isClose(twinB, ball, BALL_RADIUS)) {
    if (isTwinAPassing) {
      ball.xVel = 0
      ball.yVel = 0
    } else {
      isTwinBPassing = true
      ball.xVel = (twinA.xPos - ball.xPos) * .05
      ball.yVel = (twinA.yPos - ball.yPos) * .05
    }
  } 
}

function handleKey() {
  if (isClose(ball, key, BALL_RADIUS + KEY_SIZE)) {
    key.isEnabled = false
  }
}

function handleBonus() {
  if (isClose(ball, bonus, BALL_RADIUS + TROPHY_SIZE)) {
    hasGotTrophy = true
  }
}

function handleMystery() {
  function examplePowerUpA() {
    console.log("a")
  }
  function examplePowerUpB() {
    console.log("b")
  }
  if (mystery.isEnabled && isClose(mystery, ball, BALL_RADIUS)) {
    let powerups = [examplePowerUpA, examplePowerUpB]
    let randomPowerup = powerups[Math.floor(Math.random() * powerups.length)]
    randomPowerup()
  }
}

function handleEnemy() {
  for (let i = 0; i < enemies.length; i++) {
    let enemy = enemies[i]
    if (enemy.isEnabled && isClose(enemy, ball, BALL_RADIUS)) {
      ball.xVel = (enemy.xPos - ball.xPos) / (BALL_SPEED_DIVISOR * 2)
      ball.yVel = (canvas.height - ball.yPos) / (BALL_SPEED_DIVISOR * 2)
    }
  }
}

function handleDollar() {
  for (let i = 0; i < dollars.length; i++) {
    let dollar = dollars[i]
    if (isClose(ball, dollar, BALL_RADIUS * 1.5)) {
      dollar.isEnabled = false
    }
  }
}

function handleEdge() {
  let isBallAtLeftEdge = ball.xPos - BALL_RADIUS <= 0
  let isBallAtRightEdge = ball.xPos + BALL_RADIUS >= canvas.width
  let isBallAtTopEdge = ball.yPos - BALL_RADIUS < GOAL_HEIGHT
  let isBallAtBottomEdge = ball.yPos + BALL_RADIUS > canvas.height + BALL_RADIUS * 2
  let isBallHorizontallyAlignedWithGoal = ball.xPos > goal.xPos - GOAL_WIDTH / 2 && ball.xPos < goal.xPos + GOAL_WIDTH / 2 
  if (isBallAtLeftEdge) {
    ball.xPos = BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (isBallAtRightEdge) {
    ball.xPos = canvas.width - BALL_RADIUS
    ball.xVel = -ball.xVel * BALL_RESTITUTION
  } else if (!isCelebration && isBallAtTopEdge && !isBallHorizontallyAlignedWithGoal) {
    ball.yPos = GOAL_HEIGHT + BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
  } else if (isBottomEdgeEnabled && isBallAtBottomEdge) {
    isBottomEdgeEnabled = false
    ball.isBeingFlung = false
    ball.xVel = 0 // Reset velocity immediately to prevent accumulation
    ball.yVel = 0
    setTimeout(() => isBottomEdgeEnabled = true, 1100)
    setTimeout(
      () => {
        tries++
        ball = { 
          xPos: ball.spawn.xPos, 
          yPos: ball.spawn.yPos, 
          xVel: 0, 
          yVel: 0, 
          angle: 0,
          isBeingFlung: false, 
          spawn: ball.spawn 
        }
        key.isEnabled = true
        bonus.isEnabled = true
        cheatTaps = 0
        hasGotTrophy = false
        bonus.xPos = bonus.spawn.xPos
        bonus.yPos = bonus.spawn.yPos
      }, 
      1000
    )
    // ball.yPos = canvas.height - BALL_RADIUS
    // ball.yVel = -ball.yVel * BALL_RESTITUTION
    // let speed = Math.hypot(ball.xVel, ball.yVel)
    // if (!ball.isBeingFlung && speed < BALL_MIN_SPEED) {
    //   ball.xVel = 0
    //   ball.yVel = 0
    //   if (showTitle) {
    //     setTimeout(() => {
    //       hasFlung = true
    //       initializeLetterPositions()
    //     }, 1250)
    //   }
    // }
  } else if (isCelebration && ball.yPos <= camera.yPos) {
    ball.yPos = camera.yPos + BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
  } else if (isCelebration && ball.yPos >= camera.yPos + canvas.height - GOAL_HEIGHT) {
    ball.yPos = camera.yPos + canvas.height - GOAL_HEIGHT - BALL_RADIUS
    ball.yVel = -ball.yVel * BALL_RESTITUTION
    if (Math.abs(ball.yVel) < BALL_MIN_SPEED) {
      ball.xVel = 0 
      ball.yVel = 0
      function shelfTrophy() {
        if (hasGotTrophy && !hasAddedTrophyThisCelebration) {
          hasGotTrophy = false
          bonus.isEnabled = false
          hasAddedTrophyThisCelebration = true
          trophies.push(tries)
        }
      }
      setTimeout(shelfTrophy, 1000)
      if (hasFlung) {
        setTimeout(() => { dollars = []; hasCelebrated = true }, 500)
        setTimeout(() => generateDollars(), 1000)
        setTimeout(() => document.getElementById("continueBtn").hidden = false, 2000)
      }
    }
  }
}

// ai

function handleTouchstartToRotate() {
  let cannonHandle = getCannonHandle()
  if (isClose(touch1, cannonHandle, BALL_RADIUS)) {
    rotatingObstacle = cannon
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