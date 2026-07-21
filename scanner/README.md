# 🌿 Boon Scanner — Biomedical Waste QR Logger

> ⚠️ **This standalone app has been integrated into the main Boon Intelligence Dashboard.**
> Visit **http://localhost:3000/qrcode** for the new QR Code Manager with full blockchain integration.
> The standalone server still serves a redirect page for legacy bookmarks.

The QR generator, barcode verifier, and scan history are now available directly in the 
[main React frontend](../frontend) at `/qrcode`, with additional features:

- **Blockchain registration** — Every QR automatically registers on the Sāthī Network
- **Real-time verification** — Blockchain-verified chain of custody
- **Unified dashboard** — Same interface as the rest of the Boon platform
- **Sāthī integration** — View waste items in the blockchain explorer

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│            Boon Intelligence Dashboard                   │
│  http://localhost:3000/qrcode  ← QR Code Manager         │
│  http://localhost:3000/sathi   ← Sāthī Network          │
│  http://localhost:3000/        ← Master Hub             │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────┐
│      Boon Backend (FastAPI on :8000)                     │
│  POST /scanner/generate-qr  (+ auto Sāthī registration)  │
│  GET  /scanner/verify/{barcode}                          │
│  GET  /scanner/history                                   │
└──────────────────────────────────────────────────────────┘
```

## Legacy Files

The original scanner source files (`js/`, `css/`, `sw.js`, `manifest.json`) 
are preserved in this directory for reference. The standalone app has been 
superseded by the integrated React version.

## License

MIT — Part of the [Boon](../README.md) project.
