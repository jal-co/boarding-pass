export const passWidth = 672
export const passHeight = 280
export const bodyWidth = 512
export const stubWidth = 160
export const notchRadius = 8
export const fiberOverlap = 3
export const tearStep = 1
export const perforationTop = 12
export const perforationPitch = 10
export const perforationCut = 6

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(seed: string) {
  let value = 2166136261
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return value
}

export function tearProfile(seed = 7): number[] {
  const random = seededRandom(seed)
  const count = passHeight / tearStep + 1
  const nibs = new Map<number, number>()
  return Array.from({ length: count }, (_, index) => {
    const y = index * tearStep
    const period = Math.floor((y - perforationTop) / perforationPitch)
    const within = y - perforationTop - period * perforationPitch
    if (within < perforationCut) return 0
    if (!nibs.has(period)) nibs.set(period, (random() - .5) * 2)
    return nibs.get(period) ?? 0
  })
}

function edgePoints(profile: number[], progress: number, amplitude: number, edge: number, from: number, to: number) {
  const front = progress * passHeight
  return profile.flatMap((offset, index) => {
    const y = index * tearStep
    if (y < Math.max(notchRadius, from) || y > Math.min(passHeight - notchRadius, to)) return []
    const x = y <= front ? edge + offset * amplitude : edge
    return [`${x.toFixed(2)}px ${y}px`]
  })
}

function notch(centerX: number, centerY: number, from: number, to: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const angle = from + (to - from) * index / 6
    return `${(centerX + Math.cos(angle) * notchRadius).toFixed(2)}px ${(centerY + Math.sin(angle) * notchRadius).toFixed(2)}px`
  })
}

export function bodyClip(profile: number[], progress: number, amplitude: number) {
  const top = notch(bodyWidth, 0, Math.PI, Math.PI / 2)
  const bottom = notch(bodyWidth, passHeight, -Math.PI / 2, -Math.PI)
  return `polygon(0px 0px, ${[...top, ...edgePoints(profile, progress, amplitude, bodyWidth, 0, passHeight), ...bottom].join(', ')}, 0px ${passHeight}px)`
}

const stubOuter = stubWidth + fiberOverlap

export function stubClip(profile: number[], progress: number, amplitude: number) {
  const top = notch(fiberOverlap, 0, 0, Math.PI / 2)
  const edge = edgePoints(profile, progress, amplitude, fiberOverlap, 0, passHeight)
  const bottom = notch(fiberOverlap, passHeight, -Math.PI / 2, 0)
  return `polygon(${stubOuter}px 0px, ${[...top, ...edge, ...bottom].join(', ')}, ${stubOuter}px ${passHeight}px)`
}

export const bridges = Array.from({ length: 26 }, (_, index) => ({
  y: perforationTop + index * perforationPitch + perforationCut,
  height: perforationPitch - perforationCut,
}))

export function brokenBridges(progress: number) {
  return Math.min(bridges.length, Math.floor(progress * bridges.length + 1e-6))
}

export function bridgePath(progress: number, angle: number) {
  const radians = angle * Math.PI / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return bridges.slice(brokenBridges(progress)).map(({ y, height }) => {
    const topX = bodyWidth + (passHeight - y) * sin
    const topY = passHeight + (y - passHeight) * cos
    const bottomX = bodyWidth + (passHeight - y - height) * sin
    const bottomY = passHeight + (y + height - passHeight) * cos
    return `M${bodyWidth - 1},${y} L${topX + 1},${topY} L${bottomX + 1},${bottomY} L${bodyWidth - 1},${y + height}Z`
  }).join(' ')
}

const pdf417Start = [8, 1, 1, 1, 1, 1, 1, 3]
const pdf417Stop = [7, 1, 1, 3, 1, 1, 1, 2, 1]

export function pdf417Path(seed: string, width: number, height: number, rows = 12) {
  const random = seededRandom(hash(seed))
  const rowHeight = height / rows
  const rects: string[] = []
  const guard = (pattern: number[], x: number) => {
    let cursor = x
    pattern.forEach((units, index) => {
      if (index % 2 === 0) rects.push(`M${cursor} 0h${units}v${height}h-${units}z`)
      cursor += units
    })
    return cursor
  }
  const dataStart = guard(pdf417Start, 0)
  const stopWidth = pdf417Stop.reduce((sum, units) => sum + units, 0)
  const dataEnd = width - stopWidth
  guard(pdf417Stop, dataEnd)
  const cell = 3
  const columns = Math.floor((dataEnd - dataStart - 2) / cell)
  for (let row = 0; row < rows; row++) {
    let x = dataStart + 2
    for (let column = 0; column < columns; column++) {
      if (random() < .5) rects.push(`M${x} ${(row * rowHeight).toFixed(2)}h${cell}v${rowHeight.toFixed(2)}h-${cell}z`)
      x += cell
    }
  }
  return rects.join('')
}
