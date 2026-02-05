function loopGame() {
  draw()
  moveBall()
  moveObstacles()
  handleCollision()
  setTimeout(loopGame, getMSPerFrame())
}