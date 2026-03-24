# Tilt Captcha

> Built for **Kilo Virtual Hackathon 🚨 Worst Captcha Contest**
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

Desktop users get a QR code to scan with their phone. No phone, no verification. Because if you are a human, you must have a phone.

## Features

- **Canvas-rendered bubble level** with smooth 60fps animation
- **500ms hold requirement** — no sweeping through angles allowed
- **Progressive difficulty** — rounds 1–3: 5s, rounds 4–9: 4s, round 10: 2s
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
