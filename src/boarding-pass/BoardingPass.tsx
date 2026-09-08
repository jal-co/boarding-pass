import { useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { airlines, cabins, type Airline, type Cabin } from './airlines'
import { bodyClip, bridgePath, brokenBridges, fiberOverlap, passHeight, pdf417Path, stubClip, tearProfile } from './tear'
import './boarding-pass.css'

export type BoardingPassProps = {
  airline: Airline
  cabin: Cabin
  passenger: string
  origin: string
  destination: string
  originCity: string
  destinationCity: string
  flightNumber: string
  date: string
  gate: string
  seat: string
  zone: string
  boarding: string
  doorsClose: string
  departs: string
  arrives: string
  sequence: string
  priority: boolean
  progress: number
  detach: number
  swing: number
  amplitude: number
  radius: number
  tearDistance: number
  reducedMotion: boolean
  labelStyle?: CSSProperties
  valueStyle?: CSSProperties
  bigStyle?: CSSProperties
  heroStyle?: CSSProperties
  onTear: (progress: number) => void
  onRelease: () => void
  onKeyboardTear: () => void
  onReattach: () => void
}

const restOffset = { x: 24, y: 8, angle: 2 }

function Field({ label, value, labelStyle, valueStyle, className }: { label: string; value: ReactNode; labelStyle?: CSSProperties; valueStyle?: CSSProperties; className?: string }) {
  return <div className={className ? `pass-field ${className}` : 'pass-field'}><span className="pass-label" style={labelStyle}>{label}</span><span className="pass-value" style={valueStyle}>{value}</span></div>
}

function RouteArrow() {
  return <svg className="pass-route-arrow" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="12" /><path d="M6 12h10.5M12.5 7.5 17 12l-4.5 4.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function BoardingPass({
  airline, cabin, passenger, origin, destination, originCity, destinationCity, flightNumber, date, gate, seat, zone, boarding, doorsClose, departs, arrives, sequence, priority,
  progress, detach, swing, amplitude, radius, tearDistance, reducedMotion,
  labelStyle, valueStyle, bigStyle, heroStyle, onTear, onRelease, onKeyboardTear, onReattach,
}: BoardingPassProps) {
  const statusId = useId()
  const carrier = airlines[airline]
  const group = cabins[cabin].note === 'Zone' ? zone : 'PRI'
  const profile = useMemo(() => tearProfile(), [])
  const pdf417 = useMemo(() => pdf417Path(`${passenger}/${carrier.code}${flightNumber}/${seat}/${date}`, 160, 56, 14), [passenger, carrier.code, flightNumber, seat, date])
  const [hand, setHand] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<{ startX: number; startY: number; startProgress: number; peak: number; scale: number; anchorX?: number; anchorY?: number } | undefined>(undefined)
  const torn = progress >= 1
  const release = detach
  const angle = Math.min(swing, 4) * progress * (1 - release) + restOffset.angle * release
  const lift = progress * .2 + release * .3
  const settle = { type: 'spring', duration: .28, bounce: 0 } as const
  const immediate = { duration: 0 }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const state = gesture.current
    if (!state) return
    const dx = (event.clientX - state.startX) / state.scale
    const dy = (event.clientY - state.startY) / state.scale
    if (state.anchorX === undefined || state.anchorY === undefined) {
      const distance = Math.max(0, dx * .65 + dy * .35 - 4)
      const next = Math.min(1, Math.max(state.peak, state.startProgress + distance / tearDistance))
      state.peak = next
      if (next !== progress) onTear(next)
      if (next >= 1) {
        state.anchorX = event.clientX
        state.anchorY = event.clientY
      }
      return
    }
    setHand({ x: (event.clientX - state.anchorX) / state.scale, y: (event.clientY - state.anchorY) / state.scale })
  }
  function begin(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || gesture.current) return
    const layout = event.currentTarget.closest('.boarding-pass-layout')
    if (!(layout instanceof HTMLElement)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = {
      startX: event.clientX, startY: event.clientY, startProgress: progress, peak: progress,
      scale: layout.getBoundingClientRect().width / layout.offsetWidth,
      anchorX: torn ? event.clientX : undefined, anchorY: torn ? event.clientY : undefined,
    }
    setDragging(true)
  }
  function end(event: PointerEvent<HTMLButtonElement>) {
    if (!gesture.current) return
    const completed = gesture.current.peak >= 1
    gesture.current = undefined
    if (completed) onRelease()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
    setHand({ x: 0, y: 0 })
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (!torn) onTear(Math.min(1, progress + .1))
    }
  }
  const status = torn ? (detach >= 1 ? 'Stub torn off' : 'Stub coming free') : progress > 0 ? `Stub ${Math.round(progress * 100)}% torn` : 'Stub attached'
  const logo = <span className="pass-logo" style={{ '--pass-logo': `url("${carrier.logo}")` } as CSSProperties} role="img" aria-label={carrier.name} />
  const face = (
    <div className="pass-stub-face">
      <div className="pass-stub-brand" data-face="pass-stub-brand">{logo}</div>
      <div className="pass-stub-name" data-face="pass-stub-name"><span className="pass-value" style={valueStyle}>{passenger}</span><span className="pass-label" style={labelStyle}>{date}</span></div>
      <div className="pass-stub-route" data-face="pass-stub-route">
        <span className="pass-label" style={labelStyle}>Flight {flightNumber}</span>
        <span className="pass-code" style={bigStyle}>{origin}</span>
        <span className="pass-label pass-city" style={labelStyle}>{originCity}</span>
        <RouteArrow />
        <span className="pass-code pass-code-end" style={bigStyle}>{destination}</span>
        <span className="pass-label pass-city pass-city-end" style={labelStyle}>{destinationCity}</span>
      </div>
      <div className="pass-stub-fields" data-face="pass-stub-fields">
        <Field label="Seat" value={seat} labelStyle={labelStyle} valueStyle={bigStyle} />
        <Field label="Gate" value={gate} labelStyle={labelStyle} valueStyle={bigStyle} />
        <Field label="Group" value={group} labelStyle={labelStyle} valueStyle={valueStyle} className="pass-field-end pass-field-low" />
      </div>
      <span className="pass-perforation pass-perforation-stub" aria-hidden="true" />
    </div>
  )
  return (
    <div className="boarding-pass" data-broken-bridges={brokenBridges(progress)} data-tear-progress={progress.toFixed(2)} data-detached={detach >= 1} data-reduced-motion={reducedMotion}>
      <div className="boarding-pass-layout" style={{ '--pass-radius': `${radius}px`, '--stub-lift': lift } as CSSProperties}>
        <div className="pass-piece pass-body-shadow">
          <div className="pass-body" style={{ clipPath: bodyClip(profile, progress, amplitude) }}>
            <div data-pass-region="pass-brand"><div className="pass-brand">{logo}</div></div>
            <div data-pass-region="pass-title"><div className="pass-title"><span className="pass-label" style={labelStyle}>Boarding pass</span></div></div>
            <div data-pass-region="pass-barcode">
              <div className="pass-barcode-column">
                <span className="pass-label" style={labelStyle}>{priority ? 'Priority' : `Seq ${sequence}`}</span>
                <svg className="pass-barcode" viewBox="0 0 160 56" width="160" height="56" role="img" aria-label="Boarding barcode"><path d={pdf417} /></svg>
              </div>
            </div>
            <div data-pass-region="pass-passenger">
              <div className="pass-passenger">
                <Field label="Passenger" value={passenger} labelStyle={labelStyle} valueStyle={valueStyle} />
                <Field label="Date" value={date} labelStyle={labelStyle} valueStyle={valueStyle} />
              </div>
            </div>
            <div data-pass-region="pass-fields">
              <div className="pass-fields">
                <Field label="Gate" value={gate} labelStyle={labelStyle} valueStyle={bigStyle} />
                <Field label="Group" value={group} labelStyle={labelStyle} valueStyle={bigStyle} />
                <Field label="Seat" value={seat} labelStyle={labelStyle} valueStyle={bigStyle} className="pass-field-end" />
              </div>
            </div>
            <div data-pass-region="pass-route">
              <div className="pass-route">
                <span className="pass-label" style={labelStyle}>Flight {flightNumber}</span>
                <span className="pass-code" style={heroStyle}>{origin}</span>
                <RouteArrow />
                <span className="pass-code" style={heroStyle}>{destination}</span>
                <span className="pass-label pass-city" style={labelStyle}>{originCity}</span>
                <span className="pass-label pass-city pass-city-end" style={labelStyle}>{destinationCity}</span>
              </div>
            </div>
            <div data-pass-region="pass-times">
              <div className="pass-times">
                <Field label="Boarding" value={boarding} labelStyle={labelStyle} valueStyle={valueStyle} />
                <span className="pass-times-arrow" aria-hidden="true">→</span>
                <Field label="Doors close" value={doorsClose} labelStyle={labelStyle} valueStyle={valueStyle} />
                <span className="pass-times-arrow" aria-hidden="true">→</span>
                <Field label="Departs" value={departs} labelStyle={labelStyle} valueStyle={valueStyle} />
                <span className="pass-times-arrow" aria-hidden="true">→</span>
                <Field label="Arrives" value={arrives} labelStyle={labelStyle} valueStyle={valueStyle} />
              </div>
            </div>
            <div data-pass-region="pass-footer"><div className="pass-footer"><span className="pass-label" style={labelStyle}>Subject to change</span><span className="pass-label" style={labelStyle}>Seq {sequence} · {carrier.code}{flightNumber}/{date}/{origin}-{destination}</span></div></div>
            <span className="pass-rule pass-rule-1" aria-hidden="true" />
            <span className="pass-rule pass-rule-2" aria-hidden="true" />
            <span className="pass-rule pass-rule-3" aria-hidden="true" />
            <span className="pass-perforation pass-perforation-body" aria-hidden="true" />
          </div>
        </div>
        <svg className="pass-bridges" viewBox="0 0 672 280" width="672" height="280" aria-hidden="true"><path d={bridgePath(progress, angle)} /></svg>
        <motion.div className="pass-hand" data-dragging={dragging} initial={false} animate={{ x: hand.x, y: hand.y }} transition={dragging || reducedMotion ? immediate : settle}>
          <div className="pass-piece pass-stub-shadow">
            <button
              type="button"
              className="pass-stub"
              aria-label="Tear off stub"
              aria-describedby={statusId}
              data-torn={torn}
              style={{ transform: `translate(${restOffset.x * release}px, ${restOffset.y * release}px) rotate(${angle}deg)`, transformOrigin: `${fiberOverlap}px ${passHeight}px` }}
              onPointerDown={begin}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onLostPointerCapture={end}
              onKeyDown={keyboard}
              onClick={event => { if (event.detail === 0) onKeyboardTear() }}
            >
              <div className="pass-stub-paper" style={{ clipPath: stubClip(profile, progress, amplitude) }}>{face}</div>
            </button>
          </div>
        </motion.div>
        <p id={statusId} className="pass-status" aria-live="polite">{status}</p>
        <div data-pass-region="pass-actions"><div className="pass-actions"><button className="pass-reset" type="button" onClick={onReattach} disabled={progress === 0}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></svg>Reattach</button></div></div>
      </div>
    </div>
  )
}
