# Worst Captcha Contest

> Built for **Kilo Virtual Hackathon — Worst Captcha Contest**
>
> Written using [Kilo CLI](https://kilo.ai) powered by **Xiaomi MiMo-V2-Pro**

The most annoying captcha ever: tilt your phone to match 10 random angles, holding steady for 500ms per target. Because proving you're human should be *physically* demanding.

## How It Works

1. Open the page on a mobile device
2. Grant accelerometer permission (iOS 13+)
3. Tilt your phone to match the target angle shown on the bubble level
4. Hold within ±2° for 500ms to lock it in
5. Repeat for 10 consecutive angles — miss one and you restart from scratch
6. Run out of time? Start over.

Desktop users get a QR code to scan with their phone. No phone, no verification.

## Round Modifiers

After the first clean round, each new angle has a **40% chance** of getting a random modifier that makes it harder and funnier:

| Modifier | Effect |
|---|---|
| **Drunken** | The canvas wobbles and skews, green screen glow pulses. Good luck reading the level. |
| **Rainbow** | Every canvas color shifts through the rainbow cycle, including the page background. |
| **Epileptic** | Rapid invert/white-black flashing at 300ms intervals. You were warned. |
| **50-50** | Two identical target zones appear — one is real, one is fake. Pick the wrong one and you lose. |
| **Three Spheres** | Two ghost bubbles identical to the real one float around. Which one is yours? |

## Bonus Rounds

After completing the initial 10 rounds, **+5 bonus rounds** are added automatically. During bonus rounds, the game **forces untried modifiers** so you experience every type of pain. The game keeps adding +5 rounds in blocks of 10 until you've tried all 5 modifiers at least once.

A popup appears each time bonus rounds trigger:
> _"Not sure if you are a human + 5 rounds bozo"_

## Failure Screen

Fail a round and you're greeted with:
- **35 flying emojis** raining from top to bottom across the entire screen
- An animated bouncing **"SKILL ISSUE?"** message
- A "Try Again" button to manually restart (no auto-restart)

## Features

- **Canvas-rendered bubble level** with smooth 60fps animation
- **500ms hold requirement** — no sweeping through angles allowed
- **Progressive difficulty** — rounds 1–3: 5s, rounds 4–9: 4s, round 10: 2s
- **5 round modifiers** with 40% activation chance
- **Bonus rounds** that force untried modifiers
- **Epilepsy warning** on the start screen
- **iOS 13+ permission handling** — properly requests DeviceOrientation access
- **QR code fallback** for desktop users
- **Zero dependencies** — vanilla HTML/CSS/JS, no build step
- **iframe embeddable** — fires `postMessage` and `CustomEvent` on success

## Usage

Serve the directory with any static server:

```bash
npx serve .
```

Open the URL on a mobile device.

### Integration

Embed in an iframe and listen for success:

```js
window.addEventListener('message', (e) => {
  if (e.data.type === 'captcha-success') {
    console.log('User is (probably) human');
  }
});
```

Or listen for the custom event on the same page:

```js
document.addEventListener('captcha:success', () => {
  console.log('Verified');
});
```

## License

MIT
