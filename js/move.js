function moveBall() {
  ball.xPos += ball.xVel
  ball.yPos += ball.yVel 
  ball.angle += ball.xVel / BALL_RADIUS
  ball.xVel *= BALL_FRICTION
  ball.yVel *= BALL_FRICTION
  // if (isCelebration && hasGotTrophy && !hasAddedTrophyThisCelebration && ball.yVel > 0) {
  //   hasGotTrophy = false
  //   bonus.isEnabled = false
  //   hasAddedTrophyThisCelebration = true
  //   trophies.push(tries)
  // }
}

function moveObstacles() {
  updateSwapAnimation()
  // updateLetterSwapAnimation()
  if (hasGotTrophy) {
    bonus.xPos = ball.xPos
    bonus.yPos = ball.yPos
  }
}