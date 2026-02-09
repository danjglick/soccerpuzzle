function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.translate(-camera.xPos, -camera.yPos)
  //drawMenu()
  //drawStands()
  drawSky()
  drawDollars()
  drawTrophies()
  drawGoal()
  if (!areObstaclesHidden) {
    drawCannon()
    drawPuddle()
    drawWall()
    drawWallendA()
    drawWallendB()
    drawWormhole()
    drawKey()
    //drawEnemies()
    drawTwins()
    drawMystery()
  }
  if (!isBallHidden) drawBall()
  drawBonus()
  //drawSelectionElectricity()
  //drawSwapAnimationElectricity()
  //drawLetterSelectionElectricity()
  //drawLetterSwapAnimationElectricity()
  //drawLetterSelectionBorder()
  //drawSwappableBorders()
  drawSelectionBorder()
  ctx.restore()
}

function drawSky() {
  ctx.fillStyle = "blue" // "007fff"
  ctx.fillRect(0, -canvas.height, canvas.width, GOAL_HEIGHT * 3.3)
}

function drawStands() {
  ctx.fillStyle = "black"
  ctx.fillRect(0, -canvas.height + GOAL_HEIGHT * 3.3, canvas.width, canvas.height - GOAL_HEIGHT * 2.3)
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
    //
    // Draw teal electric border around rectangle if "play" is spelled correctly
    if (isPlaySpelledCorrectly()) {
      drawPlayBorder()
    }
  }
}

function drawTrophies() {
  let startX = TROPHY_SIZE * 1.4
  let startY = -canvas.height * .85
  let spacing = TROPHY_SIZE * 2.5
  for (let i = 0; i < trophies.length; i++) {
    let x = startX + i * spacing
    let y = startY
    let trophyType = "gold"
    if (trophies[i] === 1) trophyType = "silver"
    if (trophies[i] >= 2) trophyType = "bronze"
    drawTrophy(x, y, trophyType)      
  }
}

function drawBall() {
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
  drawCannonSightline()
  let color = "#c04667"
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

function drawCannonSightline() {
  if (!cannon.isEnabled) return
  
  ctx.save()
  
  // Calculate the direction vector from the cannon angle
  // Use diagonal distance to ensure it reaches the edge of the screen
  //let sightlineLength = Math.sqrt(canvas.width ** 2 + canvas.height ** 2)
  let sightlineLength = BALL_RADIUS * 2.7
  let startX = cannon.xPos
  let startY = cannon.yPos
  let endX = startX + Math.sin(cannon.angle) * sightlineLength
  let endY = startY - Math.cos(cannon.angle) * sightlineLength
  
  // Draw dashed line for sightline
  ctx.strokeStyle = "rgba(192, 70, 103, 0.5)" // Semi-transparent cannon color
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5]) // Dashed pattern
  ctx.lineCap = "round"
  
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  
  ctx.setLineDash([]) // Reset dash pattern
  ctx.restore()
}

function drawPuddle() {
  ctx.beginPath()
  ctx.arc(puddle.xPos, puddle.yPos, BALL_RADIUS * .75, 0, 2 * Math.PI)
  ctx.fillStyle = "#305CDE"
  ctx.fill()
}

function drawWall() {
  if (!wallendA.isEnabled || !wallendB.isEnabled) return
  let color = "#654321"
  let ends = getWallEnds()
  // Draw only the line between the two ends
  ctx.beginPath()
  ctx.moveTo(ends.a.xPos, ends.a.yPos)
  ctx.lineTo(ends.b.xPos, ends.b.yPos)
  ctx.lineWidth = BALL_RADIUS / 4
  ctx.strokeStyle = color
  ctx.stroke()
}

function drawWallendA() {
  if (!wallendA.isEnabled) return
  let color = "#654321"
  ctx.beginPath()
  ctx.arc(wallendA.xPos, wallendA.yPos, BALL_RADIUS * .375, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

function drawWallendB() {
  if (!wallendB.isEnabled) return
  let color = "#654321"
  ctx.beginPath()
  ctx.arc(wallendB.xPos, wallendB.yPos, BALL_RADIUS * .375, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

function drawWormhole() {
  let color = "#572991"
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

function drawTwins() {
  const tri1 = { x: twinA.xPos, y: twinA.yPos };
  const tri2 = { x: twinB.xPos, y: twinB.yPos };
  const height = BALL_RADIUS * 1.4
  const base = BALL_RADIUS * 1.1
  function drawTriangleAt(center, target) {
    const angle = Math.atan2(target.y - center.y, target.x - center.x);
    ctx.save();
    // 2. Move origin to this triangle's center
    ctx.translate(center.x, center.y);
    // 3. Rotate context (subtracting 90 deg if the tip is drawn at 0,0)
    ctx.rotate(angle - Math.PI / 2)
    // 4. Draw the sharp isosceles triangle
    ctx.beginPath()
    ctx.moveTo(0, height) // Tip pointing toward the target
    ctx.lineTo(-base / 2, 0) // Bottom left
    ctx.lineTo(base / 2, 0) // Bottom right
    ctx.closePath();
    //
    ctx.fillStyle = "#477b50"
    ctx.fill();
    ctx.restore();
  }
  drawTriangleAt(tri1, tri2);
  drawTriangleAt(tri2, tri1);
}

function drawMystery() {
  ctx.font = "bold 45px Arial"
  ctx.fillStyle = "#d9bb9b"
  ctx.fillText("?", mystery.xPos, mystery.yPos)
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
    //
    ctx.restore()
    //
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
    // Determine trophy type based on tries
    let trophyType = "gold"
    if (tries === 1) {
      trophyType = "silver"
    } else if (tries === 2) {
      trophyType = "bronze"
    } else if (tries > 2) {
      return
    }
    drawTrophy(bonus.xPos, bonus.yPos, trophyType)
  }
}

function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let enemy = enemies[i]
    ctx.beginPath()
    ctx.moveTo(enemy.xPos + BALL_RADIUS / 2, enemy.yPos + BALL_RADIUS / 2)
    ctx.lineTo(enemy.xPos - BALL_RADIUS / 2, enemy.yPos - BALL_RADIUS / 2)
    ctx.moveTo(enemy.xPos - BALL_RADIUS / 2, enemy.yPos + BALL_RADIUS / 2)
    ctx.lineTo(enemy.xPos + BALL_RADIUS / 2, enemy.yPos - BALL_RADIUS / 2)
    ctx.lineWidth = 5
    ctx.strokeStyle = "maroon"
    ctx.stroke()
  }
}

function drawDollars() {
  for (let i = 0; i < dollars.length; i++) {
    let dollar = dollars[i]
    if (dollar.isEnabled) {
      ctx.font = "bold 50px serif"
      ctx.fillStyle = "green"
      ctx.fillText("$", dollar.xPos, dollar.yPos)
    }
  }
}

function drawSelectionBorder() {
  if (!selectedObstacle) return
  ctx.beginPath()
  ctx.arc(selectedObstacle.xPos, selectedObstacle.yPos, BALL_RADIUS * 1.3, 0, 2 * Math.PI)
  ctx.strokeStyle = "grey"
  ctx.lineWidth = 4
  ctx.stroke()
}

// ai

function drawElectricityLine(fromX, fromY, toX, toY) {
  ctx.save()
  //
  // Calculate distance and direction
  let dx = toX - fromX
  let dy = toY - fromY
  let distance = Math.hypot(dx, dy)
  //
  if (distance < 1) {
    ctx.restore()
    return
  }
  //
  // Normalize direction
  let nx = dx / distance
  let ny = dy / distance
  // Perpendicular direction for offsets
  let px = -ny
  let py = nx
  //
  // Time-based animation for electricity flicker
  let time = Date.now() * 0.01
  //
  // Draw glow effect (outer layer)
  ctx.strokeStyle = "rgba(77, 208, 225, 0.3)"
  ctx.lineWidth = 8
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
  //
  // Draw main electricity line with jagged segments
  let segments = Math.max(5, Math.floor(distance / 30))
  //
  // Draw multiple electricity arcs for effect
  for (let arc = 0; arc < 3; arc++) {
    ctx.strokeStyle = arc === 0 ? "#4dd0e1" : "rgba(150, 230, 240, 0.6)"
    ctx.lineWidth = arc === 0 ? 2 : 1
    //
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    //
    for (let i = 1; i < segments; i++) {
      let t = i / segments
      // Base position along the line
      let baseX = fromX + dx * t
      let baseY = fromY + dy * t
      //
      // Add random offset perpendicular to the line (electricity jitter)
      // Use time and position to create animated noise
      let noise1 = Math.sin(time + i * 3.7 + arc * 2.1) * 0.5 + Math.sin(time * 1.3 + i * 2.3) * 0.5
      let noise2 = Math.cos(time * 0.8 + i * 4.1 + arc * 1.7) * 0.5 + Math.cos(time * 1.7 + i * 1.9) * 0.5
      let offset = (noise1 + noise2) * 12 * (1 - Math.abs(t - 0.5) * 2) // Stronger in middle
      //
      let jitterX = baseX + px * offset
      let jitterY = baseY + py * offset
      //
      ctx.lineTo(jitterX, jitterY)
    }
    //
    ctx.lineTo(toX, toY)
    ctx.stroke()
  }
  //
  // Draw bright core
  ctx.strokeStyle = "#aae6f0"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()
  //
  // Add small spark effects at both ends
  let sparkCount = 3
  for (let i = 0; i < sparkCount; i++) {
    let sparkAngle = time * 2 + i * (Math.PI * 2 / sparkCount)
    let sparkLen = 8 + Math.sin(time * 3 + i) * 4
    //
    ctx.strokeStyle = "rgba(150, 230, 240, 0.8)"
    ctx.lineWidth = 1
    //
    // Spark at from end
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(
      fromX + Math.cos(sparkAngle) * sparkLen,
      fromY + Math.sin(sparkAngle) * sparkLen
    )
    ctx.stroke()
    //
    // Spark at to end
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
      toX + Math.cos(sparkAngle + Math.PI) * sparkLen,
      toY + Math.sin(sparkAngle + Math.PI) * sparkLen
    )
    ctx.stroke()
  }
  //
  ctx.restore()
}

function drawSelectionElectricity() {
  if (!selectedObstacle || !selectedObstacle.isEnabled || isBallHidden) return
  //
  let ballX = ball.xPos
  let ballY = ball.yPos
  let spriteX = selectedObstacle.xPos
  let spriteY = selectedObstacle.yPos
  //
  drawElectricityLine(spriteX, spriteY, ballX, ballY)
}

function drawSwapAnimationElectricity() {
  if (!swapAnimation || isBallHidden) return
  //
  let ballX = ball.xPos
  let ballY = ball.yPos
  //
  // Draw electricity to obstacleA
  if (swapAnimation.obstacleA && swapAnimation.obstacleA.isEnabled) {
    let aX = swapAnimation.obstacleA.xPos
    let aY = swapAnimation.obstacleA.yPos
    drawElectricityLine(aX, aY, ballX, ballY)
  }
  //
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
  //
  let time = Date.now() * 0.01
  //
  for (let obstacle of swappableObstacles) {
    // Skip the selected obstacle (it has its own green border)
    if (obstacle === selectedObstacle || !obstacle.isEnabled) continue
    //
    ctx.save()
    //
    // Pulsing teal electricity border
    let pulse = 1
    let radius = BALL_RADIUS * 1.3
    //
    // Draw multiple layers for electricity effect
    for (let layer = 0; layer < 3; layer++) {
      let opacity = layer === 0 ? 0.3 * pulse : (layer === 1 ? 0.6 * pulse : 0.8 * pulse)
      let lineWidth = layer === 0 ? 6 : (layer === 1 ? 3 : 1)
      //
      ctx.strokeStyle = layer === 0 
        ? `rgba(77, 208, 225, ${opacity})`
        : layer === 1
        ? `rgba(150, 230, 240, ${opacity})`
        : `rgba(170, 235, 245, ${opacity})`
      ctx.lineWidth = lineWidth
      ctx.lineCap = "round"
      //
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
    //
    // Add spark effects around the border
    let sparkCount = 6
    for (let i = 0; i < sparkCount; i++) {
      let sparkAngle = (i / sparkCount) * Math.PI * 2 + time * 2
      let sparkLen = 5 + Math.sin(time * 3 + i) * 3
      let sparkX = obstacle.xPos + Math.cos(sparkAngle) * radius
      let sparkY = obstacle.yPos + Math.sin(sparkAngle) * radius
      //
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
    //
    ctx.restore()
  }
}

function getCircleBorderPoint(letterX, letterY, targetX, targetY) {
  // Calculate circle radius
  let radius = LETTER_SQUARE_SIZE / 2
  //
  // Find intersection point of line from target (ball) to letter center with circle border
  let dx = letterX - targetX
  let dy = letterY - targetY
  let distance = Math.hypot(dx, dy)
  //
  // If target is inside or at center, return point on circle in direction of target
  if (distance < radius || distance === 0) {
    // Return point on circle in the direction from center to target
    let angle = Math.atan2(targetY - letterY, targetX - letterX)
    return {
      x: letterX + Math.cos(angle) * radius,
      y: letterY + Math.sin(angle) * radius
    }
  }
  //
  // Calculate intersection with circle
  // Normalize direction vector
  let nx = dx / distance
  let ny = dy / distance
  //
  // Point on circle in direction from target to letter center
  return {
    x: letterX - nx * radius,
    y: letterY - ny * radius
  }
}

function drawLetterSelectionBorder() {
  if (!selectedLetter || !hasFlung) return
  //
  let letterX = selectedLetter.xPos
  let letterY = selectedLetter.yPos
  let radius = LETTER_SQUARE_SIZE / 2
  //
  ctx.save()
  //
  let time = Date.now() * 0.01
  //
  // Draw multiple layers for electricity effect
  for (let layer = 0; layer < 3; layer++) {
    let opacity = layer === 0 ? 0.3 : (layer === 1 ? 0.6 : 0.8)
    let lineWidth = layer === 0 ? 6 : (layer === 1 ? 3 : 1)
    //
    ctx.strokeStyle = layer === 0 
      ? `rgba(77, 208, 225, ${opacity})`
      : layer === 1
      ? `rgba(150, 230, 240, ${opacity})`
      : `rgba(170, 235, 245, ${opacity})`
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    //
    // Create jagged border effect around the circle
    let segments = 32
    ctx.beginPath()
    //
    for (let i = 0; i <= segments; i++) {
      let angle = (i / segments) * Math.PI * 2
      let jitter = Math.sin(time * 2 + i * 0.5) * 2 + Math.cos(time * 1.5 + i * 0.7) * 2
      let r = radius + jitter * (layer === 0 ? 1 : 0.5)
      let x = letterX + Math.cos(angle) * r
      let y = letterY + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    //
    ctx.closePath()
    ctx.stroke()
  }
  //
  // Add spark effects around the circle
  let sparkCount = 8
  for (let i = 0; i < sparkCount; i++) {
    let sparkAngle = (i / sparkCount) * Math.PI * 2 + time * 2
    let sparkLen = 5 + Math.sin(time * 3 + i) * 3
    let sparkX = letterX + Math.cos(sparkAngle) * radius
    let sparkY = letterY + Math.sin(sparkAngle) * radius
    //
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
  //
  ctx.restore()
}

function drawLetterSelectionElectricity() {
  if (!selectedLetter || !hasFlung) return
  //
  let ballX = ball.xPos
  let ballY = ball.yPos
  let letterX = selectedLetter.xPos
  let letterY = selectedLetter.yPos
  //
  // Get the point on the circle border closest to the ball
  let borderPoint = getCircleBorderPoint(letterX, letterY, ballX, ballY)
  //
  drawElectricityLine(borderPoint.x, borderPoint.y, ballX, ballY)
}

function drawLetterSwapAnimationElectricity() {
  if (!letterSwapAnimation || !hasFlung) return
  //
  let ballX = ball.xPos
  let ballY = ball.yPos
  //
  // Draw electricity to letterA
  if (letterSwapAnimation.letterA) {
    let aX = letterSwapAnimation.letterA.xPos
    let aY = letterSwapAnimation.letterA.yPos
    let borderPoint = getCircleBorderPoint(aX, aY, ballX, ballY)
    drawElectricityLine(borderPoint.x, borderPoint.y, ballX, ballY)
  }
  //
  // Draw electricity to letterB
  if (letterSwapAnimation.letterB) {
    let bX = letterSwapAnimation.letterB.xPos
    let bY = letterSwapAnimation.letterB.yPos
    let borderPoint = getCircleBorderPoint(bX, bY, ballX, ballY)
    drawElectricityLine(borderPoint.x, borderPoint.y, ballX, ballY)
  }
}

function drawTrophy(x, y, trophyType = "gold") {
  ctx.save()
  // Use TROPHY_SIZE as the base radius for scaling
  let radius = TROPHY_SIZE
  // Scale factor to make trophy appear as large as a circle with the same radius
  let scale = 1.6
  let scaledRadius = radius * scale
  // Determine colors based on trophy type
  let gradient, strokeColor, starFill, starStroke
  if (trophyType === "silver") {
    gradient = ctx.createLinearGradient(x, y - scaledRadius, x, y + scaledRadius)
    gradient.addColorStop(0, "#e8e8e8") // Lighter silver at top
    gradient.addColorStop(0.5, "#c0c0c0") // Silver in middle
    gradient.addColorStop(1, "#a0a0a0") // Darker silver at bottom
    strokeColor = "#808080" // Dark silver for outline
    starFill = "#c0c0c0"
    starStroke = "#a0a0a0"
  } else if (trophyType === "bronze") {
    gradient = ctx.createLinearGradient(x, y - scaledRadius, x, y + scaledRadius)
    gradient.addColorStop(0, "#cd7f32") // Lighter bronze at top
    gradient.addColorStop(0.5, "#b87333") // Bronze in middle
    gradient.addColorStop(1, "#8b4513") // Darker bronze at bottom
    strokeColor = "#654321" // Dark bronze for outline
    starFill = "#b87333"
    starStroke = "#8b4513"
  } else {
    // Gold (default)
    gradient = ctx.createLinearGradient(x, y - scaledRadius, x, y + scaledRadius)
    gradient.addColorStop(0, "#ffed4e") // Lighter gold at top
    gradient.addColorStop(0.5, "#ffd700") // Gold in middle
    gradient.addColorStop(1, "#daa520") // Darker gold at bottom
    strokeColor = "#b8860b" // Dark gold for outline
    starFill = "#ffd700"
    starStroke = "#ffaa00"
  }
  ctx.fillStyle = gradient
  ctx.strokeStyle = strokeColor
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
  //
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
  ctx.fillStyle = starFill
  ctx.strokeStyle = starStroke
  ctx.lineWidth = Math.max(1, radius * 0.05)
  ctx.beginPath()
  let starX = x
  let starY = y - scaledRadius * 0.4
  let starOuterRadius = scaledRadius * 0.15
  let starInnerRadius = starOuterRadius * 0.5
  let starPoints = 5
  //
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
  //
  ctx.restore()
}

function drawPlayBorder() {
  // Calculate the bounding rectangle from all letters (for touch detection)
  let sortedLetters = [...swappableLetters].sort((a, b) => a.xPos - b.xPos)
  let leftX = sortedLetters[0].xPos - LETTER_SQUARE_SIZE / 2
  let rightX = sortedLetters[3].xPos + LETTER_SQUARE_SIZE / 2
  let topY = sortedLetters[0].yPos - LETTER_SQUARE_SIZE / 2
  let bottomY = sortedLetters[0].yPos + LETTER_SQUARE_SIZE / 2
  //
  let rectWidth = rightX - leftX
  let rectHeight = bottomY - topY
  //
  ctx.save()
  //
  let time = Date.now() * 0.01
  //
  // Draw multiple layers for electricity effect around the bounding rectangle
  for (let layer = 0; layer < 3; layer++) {
    let opacity = layer === 0 ? 0.3 : (layer === 1 ? 0.6 : 0.8)
    let lineWidth = layer === 0 ? 6 : (layer === 1 ? 3 : 1)
    //
    ctx.strokeStyle = layer === 0 
      ? `rgba(77, 208, 225, ${opacity})`
      : layer === 1
      ? `rgba(150, 230, 240, ${opacity})`
      : `rgba(170, 235, 245, ${opacity})`
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    //
    // Create jagged border effect
    let segments = 32
    ctx.beginPath()
    //
    // Top edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let x = leftX + rectWidth * t
      let jitter = Math.sin(time * 2 + i * 0.5) * 2 + Math.cos(time * 1.5 + i * 0.7) * 2
      let y = topY + jitter * (layer === 0 ? 1 : 0.5)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    //
    // Right edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let y = topY + rectHeight * t
      let jitter = Math.sin(time * 2 + (segments / 4 + i) * 0.5) * 2 + Math.cos(time * 1.5 + (segments / 4 + i) * 0.7) * 2
      let x = rightX + jitter * (layer === 0 ? 1 : 0.5)
      ctx.lineTo(x, y)
    }
    //
    // Bottom edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let x = rightX - rectWidth * t
      let jitter = Math.sin(time * 2 + (segments / 2 + i) * 0.5) * 2 + Math.cos(time * 1.5 + (segments / 2 + i) * 0.7) * 2
      let y = bottomY + jitter * (layer === 0 ? 1 : 0.5)
      ctx.lineTo(x, y)
    }
    //
    // Left edge
    for (let i = 0; i <= segments / 4; i++) {
      let t = i / (segments / 4)
      let y = bottomY - rectHeight * t
      let jitter = Math.sin(time * 2 + (segments * 3 / 4 + i) * 0.5) * 2 + Math.cos(time * 1.5 + (segments * 3 / 4 + i) * 0.7) * 2
      let x = leftX + jitter * (layer === 0 ? 1 : 0.5)
      ctx.lineTo(x, y)
    }
    //
    ctx.closePath()
    ctx.stroke()
  }
  //
  ctx.restore()
}