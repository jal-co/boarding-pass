import { useEffect, useState } from 'react'
import { DialRoot, useDialKitController, useDialTimeline } from 'dialkit'
import type { TimelineConfig } from 'dialkit'
import { useReducedMotion } from 'motion/react'
import 'dialkit/styles.css'
import { BoardingPass } from './boarding-pass/BoardingPass'
import { airlines, cabins, type Airline, type Cabin } from './boarding-pass/airlines'

const tearDuration = 1.2
const choreography = {
  tear: { at: 0, duration: tearDuration, from: { progress: 0 }, to: { progress: 1 }, transition: { type: 'easing', duration: tearDuration, ease: [0, 0, 1, 1] } },
  release: { at: tearDuration, duration: .28, from: { detach: 0 }, to: { detach: 1 }, transition: { type: 'easing', duration: .28, ease: [.32, .72, 0, 1] } },
} satisfies TimelineConfig

export default function App() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const resize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const { values } = useDialKitController('Boarding pass', {
    airline: { type: 'select', options: Object.keys(airlines), default: 'Northline' },
    cabin: { type: 'select', options: Object.keys(cabins), default: 'Business' },
    passenger: 'Morgan/Alex',
    flightNumber: '216',
    date: '14MAY26',
    origin: 'SFO',
    originCity: 'San Francisco,CA',
    destination: 'JFK',
    destinationCity: 'New York JFK,NY',
    gate: 'B6',
    seat: '1C',
    zone: '2',
    boarding: '07:45AM',
    doorsClose: '08:15AM',
    departs: '08:30AM',
    arrives: '05:00PM',
    sequence: '413',
    priority: true,
    tearDistance: [120, 60, 240, 10],
    swing: [8, 0, 16, 1],
    fibers: [.5, 0, 1.5, .25],
    cornerRadius: [8, 4, 12, 2],
  }, { id: 'boarding-pass', persist: true })
  const timeline = useDialTimeline('Boarding pass', choreography, { id: 'boarding-pass-motion', autoplay: false, persist: false })
  const reducedMotion = useReducedMotion() ?? false
  const progress = Math.max(0, Math.min(1, timeline.tear.current.progress))
  const detach = Math.max(0, Math.min(1, timeline.release.current.detach))
  function tearTo(next: number) { timeline.pause(); timeline.seek(next * tearDuration) }
  function releaseStub() { if (reducedMotion) timeline.seek(timeline.duration); else timeline.play() }
  function keyboardTear() { if (progress < 1) releaseStub() }
  function reattach() { timeline.pause(); timeline.seek(0) }
  return <main className={dark ? 'page dark' : 'page'}>
    <div className="pass-stage" style={{ zoom: Math.min(1, (width - 64) / 704) }}>
        <BoardingPass
          airline={values.airline as Airline}
          cabin={values.cabin as Cabin}
          passenger={values.passenger}
          origin={values.origin}
          destination={values.destination}
          originCity={values.originCity}
          destinationCity={values.destinationCity}
          flightNumber={values.flightNumber}
          date={values.date}
          gate={values.gate}
          seat={values.seat}
          zone={values.zone}
          boarding={values.boarding}
          doorsClose={values.doorsClose}
          departs={values.departs}
          arrives={values.arrives}
          sequence={values.sequence}
          priority={values.priority}
          progress={progress}
          detach={detach}
          swing={values.swing}
          amplitude={values.fibers}
          radius={values.cornerRadius}
          tearDistance={values.tearDistance}
          reducedMotion={reducedMotion}
          onTear={tearTo}
          onRelease={releaseStub}
          onKeyboardTear={keyboardTear}
          onReattach={reattach}
        />
    </div>
    <nav className="page-actions" aria-label="Page controls"><button type="button" onClick={() => setDark(!dark)}>{dark ? 'Light mode' : 'Dark mode'}</button><a href="https://github.com/jal-co/boarding-pass">Source</a></nav>
    <DialRoot position="bottom-right" defaultOpen={false} theme={dark ? 'dark' : 'light'} productionEnabled />
  </main>
}
