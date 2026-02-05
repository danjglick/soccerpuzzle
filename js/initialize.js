function initialize() {
  canvas = document.getElementById("canvas")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext("2d")
  document.addEventListener("touchstart", handleTouchstart)
  document.addEventListener("touchmove", handleTouchmove, { passive: false })
  document.addEventListener("touchend", handleTouchend)
  document.addEventListener("wheel", (e) => e.preventDefault(), { passive: false })
  document.getElementById("continueBtn").addEventListener("click", handleContinueBtn)
  generateLevel()
  loopGame()
}