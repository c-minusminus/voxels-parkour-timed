function rayBoxIntersection(
    ox: number, oy: number, oz: number,
    dx: number, dy: number, dz: number,
    minX: number, minY: number, minZ: number,
    maxX: number, maxY: number, maxZ: number
): number[] | null {

    let tmin = -Infinity
    let tmax = Infinity

    // X slab
    if (dx !== 0) {
        let tx1 = (minX - ox) / dx
        let tx2 = (maxX - ox) / dx
        if (tx1 > tx2) { let t = tx1; tx1 = tx2; tx2 = t }
        if (tx1 > tmin) tmin = tx1
        if (tx2 < tmax) tmax = tx2
        if (tmax < tmin) return null
    } else if (ox < minX || ox > maxX) {
        return null
    }

    // Y slab
    if (dy !== 0) {
        let ty1 = (minY - oy) / dy
        let ty2 = (maxY - oy) / dy
        if (ty1 > ty2) { let t = ty1; ty1 = ty2; ty2 = t }
        if (ty1 > tmin) tmin = ty1
        if (ty2 < tmax) tmax = ty2
        if (tmax < tmin) return null
    } else if (oy < minY || oy > maxY) {
        return null
    }

    // Z slab
    if (dz !== 0) {
        let tz1 = (minZ - oz) / dz
        let tz2 = (maxZ - oz) / dz
        if (tz1 > tz2) { let t = tz1; tz1 = tz2; tz2 = t }
        if (tz1 > tmin) tmin = tz1
        if (tz2 < tmax) tmax = tz2
        if (tmax < tmin) return null
    } else if (oz < minZ || oz > maxZ) {
        return null
    }

    // return as [tEntry, tExit] to avoid object allocation
    rayBoxIntersectionReturn[0] = tmin
    rayBoxIntersectionReturn[1] = tmax
    return rayBoxIntersectionReturn
}

function computeHitUV(
    dist: number,
    x: number, y: number, z: number,
    ox: number, oy: number, oz: number,
    dx: number, dy: number, dz: number,
    face: number, voxelType: number
): number[] {

    // Compute exact hit point
    const hx = ox + dx * dist
    const hy = oy + dy * dist
    const hz = oz + dz * dist

    let u = 0
    let v = 0

    switch (face) {
        case 0: // -X
        case 1: // +X
            u = hz - z
            v = hy - y
            break

        case 2: // -Y
        case 3: // +Y
            u = hx - x
            v = hz - z
            break

        case 4: // -Z
        case 5: // +Z
            u = hx - x
            v = hy - y
            break
    }

    // Clamp to [0,1]
    if (u < 0) u = 0
    if (u > 1) u = 1
    if (v < 0) v = 0
    if (v > 1) v = 1

    traceRayReturn[0] = face
    traceRayReturn[1] = dist
    traceRayReturn[2] = u
    traceRayReturn[3] = v
    traceRayReturn[4] = voxelType
    traceRayReturn[5] = x
    traceRayReturn[6] = y
    traceRayReturn[7] = z

    return traceRayReturn
}

function traceRay(
    ox: number, oy: number, oz: number,
    dx: number, dy: number, dz: number,
    maxDist: number
): number[] {

    // --- 1. Slab intersection (fast reject) ---
    const slab = rayBoxIntersection(
        ox, oy, oz,
        dx, dy, dz,
        0, 0, 0,
        sizeX, sizeY, sizeZ
    )
    if (!slab) return traceRayNoReturn

    const tEntry = slab[0]
    const tExit = slab[1]

    if (tExit < 0) return traceRayNoReturn

    const startT = tEntry > 0 ? tEntry : 0
    const limitT = tExit < maxDist ? tExit : maxDist
    if (startT > limitT) return traceRayNoReturn

    const oX = ox
    const oY = oy
    const oZ = oz

    // --- 2. Move origin to entry point ---
    ox += dx * startT
    oy += dy * startT
    oz += dz * startT

    // --- 3. Compute starting voxel ---
    let x = ox | 0
    let an = ox - x
    if ((an < 0 ? -an : an) < 1e-12 && dx < 0) x--
    let y = oy | 0
    an = oy - y
    if ((an < 0 ? -an : an) < 1e-12 && dy < 0) y--
    let z = oz | 0
    an = oz - z
    if ((an < 0 ? -an : an) < 1e-12 && dz < 0) z--

    if (x < 0) x = 0
    if (y < 0) y = 0
    if (z < 0) z = 0
    if (x >= sizeX) x = sizeX - 1
    if (y >= sizeY) y = sizeY - 1
    if (z >= sizeZ) z = sizeZ - 1

    const stepX = dx > 0 ? 1 : -1
    const stepY = dy > 0 ? 1 : -1
    const stepZ = dz > 0 ? 1 : -1

    const invDx = dx !== 0 ? 1 / dx : 1e9
    const invDy = dy !== 0 ? 1 / dy : 1e9
    const invDz = dz !== 0 ? 1 / dz : 1e9

    const nextX = stepX > 0 ? x + 1 : x
    let tMaxX = (nextX - ox) * invDx
    const nextY = stepY > 0 ? y + 1 : y
    let tMaxY = (nextY - oy) * invDy
    const nextZ = stepZ > 0 ? z + 1 : z
    let tMaxZ = (nextZ - oz) * invDz


    const tDeltaX = invDx < 0 ? -invDx : invDx
    const tDeltaY = invDy < 0 ? -invDy : invDy
    const tDeltaZ = invDz < 0 ? -invDz : invDz

    let idx = x + y * sizeX + z * XY

    // --- 4. Check voxel at entry point ---
    if (startT > 0 && voxels[idx] != 0) {
        let face = -1
        const EPS = 1e-6

        an = ox - sizeX
        if ((ox < 0 ? -ox : ox) < EPS && dx > 0) face = 1   // -X
        if ((an < 0 ? -an : an) < EPS && dx < 0) face = 0   // +X

        an = oy - sizeY
        if ((oy < 0 ? -oy : oy) < EPS && dy > 0) face = 3   // -Y
        if ((an < 0 ? -an : an) < EPS && dy < 0) face = 2   // +Y

        an = oz - sizeZ
        if ((oz < 0 ? -oz : oz) < EPS && dz > 0) face = 5   // -Z
        if ((an < 0 ? -an : an) < EPS && dz < 0) face = 4   // +Z

        return computeHitUV(startT, x, y, z, oX, oY, oZ, dx, dy, dz, face, voxels[idx])
    }

    let tLocal = 0

    // --- 5. Main DDA loop ---
    let face = -1

    while (startT + tLocal <= limitT) {

        if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
            face = (stepX > 0) ? 1 : 0
            x += stepX
            idx += stepX
            tLocal = tMaxX
            tMaxX += tDeltaX
        } else if (tMaxY <= tMaxZ) {
            face = (stepY > 0) ? 3 : 2
            y += stepY
            idx += stepY * X
            tLocal = tMaxY
            tMaxY += tDeltaY
        } else {
            face = (stepZ > 0) ? 5 : 4
            z += stepZ
            idx += stepZ * XY
            tLocal = tMaxZ
            tMaxZ += tDeltaZ
        }

        if (x < 0 || y < 0 || z < 0 || x >= sizeX || y >= sizeY || z >= sizeZ) return [-1]

        if (voxels[idx] != 0) {
            return computeHitUV(startT + tLocal, x, y, z, oX, oY, oZ, dx, dy, dz, face, voxels[idx])
        }
    }

    return traceRayNoReturn
}