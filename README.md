# Boarding pass

A React boarding pass with a draggable, perforated stub. Paper bridges break as you pull; releasing a detached stub lets it settle beside the ticket. DialKit controls edit the ticket details and tear behavior.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. The bottom-right button opens DialKit. Drag the stub to tear it off, or focus it and press Enter or Space. Arrow keys tear incrementally. Reattach resets the ticket. Reduced-motion preferences are respected.

```sh
npm run build
npx playwright install chromium
npm test
```

## Use the component

`src/boarding-pass/` is self-contained apart from React and Motion. It has no dependency on DialKit or the application shell. Copy that folder into a React project with `motion` installed and import `BoardingPass` and `BoardingPassProps` from its index.

The component is controlled: `progress` is the tear amount from 0 to 1, and `detach` is the release amount from 0 to 1. `onTear`, `onRelease`, `onKeyboardTear`, and `onReattach` let the host own that state. `src/App.tsx` shows the wiring using DialKit's timeline and live controls.

The pass is 672×280px, plus its reset row. The example scales down on smaller screens. Ticket fields, paper edge irregularity, drag distance and corner radius are configurable.

## Assets and license

Code is [MIT licensed](LICENSE).

- The three marks are Logoipsum placeholders, not real airline identities. Northline, Daybreak and Waypoint are fictional labels used for this example. Logoipsum assets retain their own [license](https://logoipsum.com/license); see [THIRD_PARTY.md](THIRD_PARTY.md).
- IBM Plex Mono font files retain their SIL Open Font License, included alongside the files.
- Passenger details and the barcode are fictional. The barcode is a decorative pattern, not an encoded or valid boarding credential.
