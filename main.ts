namespace userconfig {
    export const ARCADE_SCREEN_WIDTH = 100
    export const ARCADE_SCREEN_HEIGHT = 100
}

const screenW = userconfig.ARCADE_SCREEN_WIDTH
const screenH = userconfig.ARCADE_SCREEN_HEIGHT

const timeX = (screenW - 29)/2

const bestTime = isNaN(settings.readNumber("b")) ? 3600 : settings.readNumber("b")

varsInit()
let timeSinceStart = -1
let lastTime = game.runtime()
game.onPaint(function () {
    const now = game.runtime()
    const dt = Math.clamp(0, 0.15, (now - lastTime) / 1000)
    lastTime = now

    stats.setStat((1000/dt|0)/1000 + "")

    Con.update()

    if (Con.any && timeSinceStart == -1) timeSinceStart = 0

    if (Con.Other.B)
        if (game.ask("Delete best?"))
            if (game.ask("You sure?"))
                if (game.ask("Actually?")) {
                    settings.remove("b")
                    game.reset()
                }
    

    player.update(dt)
    player.computeBasis()
    const f = fVec
    const r = rVec
    const u = uVec

    for (let py = 0; py < screenH; ++py) {
        for (let px = 0; px < screenW; ++px) {

            // Compute ray direction (reuses rayDir buffer)
            let sx = sxTable[px]
            let sy = syTable[py]

            sx *= fov
            sy *= fov

            // write into reusable buffer (no allocation)
            renderX = f[0] + r[0] * sx + u[0] * sy
            renderY = f[1] + r[1] * sx + u[1] * sy
            renderZ = f[2] + r[2] * sx + u[2] * sy

            // Trace ray → [face, dist, u, v]
            const hit = traceRay(
                player.x, player.y, player.z,
                renderX, renderY, renderZ,
                30
            )


            const face = hit[0]
            if (face > -1) {
                const dist = hit[1]
                const uCoord = hit[2]
                const vCoord = hit[3]
                const voxel = hit[4]

                const tex = textures[voxel][face]

                const base = voxel * 6 + face
                const texw = texW[base]
                const texh = texH[base]

                const tx = (uCoord * (texw + 1)) | 0
                const ty = (vCoord * (texh + 1)) | 0

                const col = texData[voxel][face][tx + ty * (texw + 1)]

                screen.setPixel(px, py, col)
            }
        }
    }

    if (
        (player.x | 0) == 4 &&
        (player.y | 0) == 19 &&
        (player.z | 0) == 11
    ) gameOver(true, "time: " + (timeSinceStart * 100 | 0) / 100)
    

    if (timeSinceStart != -1) {
        timeSinceStart += dt
        
        if (showTime((timeSinceStart * 100 | 0) / 100)) screen.drawImage(time, timeX, 0)
        else gameOver(false, "took too long! (1 hour)")
    } else {
        showTime((bestTime * 100 | 0) / 100)
        screen.drawImage(time, timeX, 0)
    }
})




const numbers = [
    img`
        1 1 1
        1 f 1
        1 f 1
        1 f 1
        1 1 1
    `, img`
        f f 1
        f f 1
        f f 1
        f f 1
        f f 1
    `, img`
        1 1 1
        f f 1
        1 1 1
        1 f f
        1 1 1
    `, img`
        1 1 1
        f f 1
        1 1 1
        f f 1
        1 1 1
    `, img`
        1 f 1
        1 f 1
        1 1 1
        f f 1
        f f 1
    `, img`
        1 1 1
        1 f f
        1 1 1
        f f 1
        1 1 1
    `, img`
        1 1 1
        1 f f
        1 1 1
        1 f 1
        1 1 1
    `, img`
        1 1 1
        f f 1
        f f 1
        f f 1
        f f 1
    `, img`
        1 1 1
        1 f 1
        1 1 1
        1 f 1
        1 1 1
    `, img`
        1 1 1
        1 f 1
        1 1 1
        f f 1
        1 1 1
    `
]

const time = image.create(29, 7)
time.fill(0xF)
time.setPixel(9, 2, 0x1)
time.setPixel(9, 4, 0x1)
time.setPixel(19, 5, 0x1)


function showTime(timeInSeconds: number): boolean {
    const isOutOfBounds = timeInSeconds >= 3600 || timeInSeconds < 0
    if (isOutOfBounds) timeInSeconds = 0

    const mins = (timeInSeconds / 60) | 0
    time.drawImage(numbers[(mins / 10) | 0], 1, 1)
    time.drawImage(numbers[mins % 10], 5, 1)

    const secs = (timeInSeconds % 60) | 0
    time.drawImage(numbers[(secs / 10) | 0], 11, 1)
    time.drawImage(numbers[secs % 10], 15, 1)

    const decs = ((timeInSeconds * 100 + 0.5) % 100) | 0
    time.drawImage(numbers[(decs / 10) | 0], 21, 1)
    time.drawImage(numbers[decs % 10], 25, 1)

    return !isOutOfBounds
}



function gameOver(win: boolean, message: string) {
    if (win) settings.writeNumber("b", Math.min(bestTime, timeSinceStart))
    game.setGameOverMessage(win, message)
    game.gameOver(win)
}