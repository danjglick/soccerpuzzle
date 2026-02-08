function loopGame() {
  moveBall()
  moveObstacles()
  handleCollision()
  draw()
  setTimeout(loopGame, getMSPerFrame())
}