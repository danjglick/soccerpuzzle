function moveBall() {
  ball.xPos += ball.xVel
  ball.yPos += ball.yVel 
  ball.angle += ball.xVel / BALL_RADIUS
  // if (isCelebration && hasGotTrophy && !hasAddedTrophyThisCelebration && ball.yVel > 0) {
  //   hasGotTrophy = false
  //   bonus.isEnabled = false
  //   hasAddedTrophyThisCelebration = true
  //   trophies.push(tries)
  // }
  goal.xPos += goal.xVel
  if (goal.xPos > canvas.width - GOAL_WIDTH / 2 || goal.xPos < 0 + GOAL_WIDTH / 2) {
    goal.xVel = -goal.xVel
  }
}

function moveObstacles() {
  updateSwapAnimation()
  // updateLetterSwapAnimation()
  if (hasGotTrophy) {
    bonus.xPos = ball.xPos
    bonus.yPos = ball.yPos
  }
}