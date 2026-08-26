class Player {
    x: number
    y: number
    z: number
    yaw: number
    pitch: number
    fov: number
    moveSpeed: number
    turnSpeed: number
    limit: number
    vy: number
    va: number
    onLand: boolean
    minW: number // negative W
    minH: number // negative H
    minL: number // negative L
    maxW: number // positive W
    maxH: number // positive H
    maxL: number // positive L

    constructor() {
        this.x = 2.5
        this.y = 2.5
        this.z = 3.5
        this.yaw = 0.001
        this.pitch = -0.3
        this.fov = 1.0
        this.moveSpeed = 4
        this.turnSpeed = 1.5
        this.limit = Math.PI / 2 - 0.01
        this.vy = 0
        this.va = 1
        this.onLand = false

        this.minW = 0.4
        this.minH = 1.1
        this.minL = 0.4
        this.maxW = 0.4
        this.maxH = 0.4
        this.maxL = 0.4
    }

    computeBasis() {
        const cp = Math.cos(this.pitch)
        const sp = Math.sin(this.pitch)
        const cy = Math.cos(this.yaw)
        const sy = Math.sin(this.yaw)

        // forward (normalized)
        fVec[0] = cp * cy
        fVec[1] = sp
        fVec[2] = cp * sy

        // right (normalized, horizontal)
        rVec[0] = -fVec[2]
        rVec[1] = 0
        rVec[2] = fVec[0]
        const rl = Math.sqrt(rVec[0] * rVec[0] + rVec[2] * rVec[2])
        rVec[0] /= rl
        rVec[2] /= rl

        // up = r × f (normalized automatically if r,f are)
        uVec[0] = rVec[1] * fVec[2] - rVec[2] * fVec[1]
        uVec[1] = rVec[2] * fVec[0] - rVec[0] * fVec[2]
        uVec[2] = rVec[0] * fVec[1] - rVec[1] * fVec[0]
    }

    forward(): number[] {
        const fx = Math.cos(this.pitch) * Math.cos(this.yaw)
        const fy = Math.sin(this.pitch)
        const fz = Math.cos(this.pitch) * Math.sin(this.yaw)
        
        fVec[0] = fx
        fVec[1] = fy
        fVec[2] = fz

        return fVec
    }

    right(): number[] {
        const f = this.forward().slice()

        rVec[0] = -f[2]
        rVec[1] = 0
        rVec[2] = f[0]

        return rVec
    }

    up(): number[] {
        const f = this.forward().slice()
        const r = this.right().slice()

        uVec[0] = r[1] * f[2] - r[2] * f[1]
        uVec[1] = r[2] * f[0] - r[0] * f[2]
        uVec[2] = r[0] * f[1] - r[1] * f[0]

        return uVec
    }

    update(dt: number) {
        const ax = this.x - this.minW
        const ay = this.y - this.minH
        const az = this.z - this.minL
        const bx = this.x + this.maxW
        const by = this.y + this.maxH
        const bz = this.z + this.maxL


        //this.onLand = isOnGround(ax, ay, az, bx, bz)
        // --- direction vectors ---
        const cf = Math.cos(this.pitch)
        const sf = Math.sin(this.pitch)


        const cy = Math.cos(this.yaw)
        const sy = Math.sin(this.yaw)

        let fx = cy
        let fz = sy

        

        // right = normalize(cross(forward, up(0,1,0)))
        let rx = -Math.sin(this.yaw)
        let rz = Math.cos(this.yaw)
        let ry = 10

        
        
        
        // --- movement input ---
        const move = this.moveSpeed * dt
        const turn = this.turnSpeed * dt

        let dx = 0, dy = 0, dz = 0

        if (Con.Walk.U) { dx += fx; dz += fz }
        if (Con.Walk.D) { dx -= fx; dz -= fz }
        if (Con.Walk.L) { dx -= rx; dz -= rz }
        if (Con.Walk.R) { dx += rx; dz += rz }
        if (Con.Other.A && this.onLand) this.vy = 1.8

        
        this.vy -= this.va * move
        dy = this.vy
        
        dx *= move
        dy *= move
        dz *= move




        // no movement -> early out
        if (!(dx === 0 && dy === 0 && dz === 0)) {
            const x = this.x, y = this.y, z = this.z

            const t = hitboxDirT(
                ax, ay, az,
                bx, by, bz,
                dx, dy, dz
            )

            this.x = x + t[0] * dx
            this.y = y + t[1] * dy
            this.z = z + t[2] * dz

            // --- vertical collision handling ---
            if (dy !== 0) {
                if (t[3] & 2) {        // hit Y axis
                    if (dy < 0) this.onLand = true
                    this.vy = 0
                } else {
                    // moved vertically but no collision
                    this.onLand = false
                }
            }
        }

        // Clamp player inside world bounds
        if (this.x - this.minW < 0) this.x = this.minW
        if (this.y - this.minH < 0) this.y = this.minH
        if (this.z - this.minL < 0) this.z = this.minL

        if (this.x + this.maxW > sizeX) this.x = sizeX - this.maxW
        //if (this.y + this.maxH > sizeY) this.y = sizeY - this.maxH // dont clamp +Y bc its parkour
        if (this.z + this.maxL > sizeZ) this.z = sizeZ - this.maxL





        if (Con.Turn.L) this.yaw -= turn
        if (Con.Turn.R) this.yaw += turn
        if (Con.Turn.U) this.pitch += turn
        if (Con.Turn.D) this.pitch -= turn

        const limit = this.limit
        if (this.pitch > limit) this.pitch = limit
        if (this.pitch < -limit) this.pitch = -limit
    }
}
const player = new Player()
const fov = player.fov