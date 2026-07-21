/**
 * 🌿 Boon Scanner — Camera QR Code Scanner
 *
 * Uses the device camera to detect and decode QR codes in real-time.
 * Falls back to a manual barcode input if camera is unavailable.
 */

/**
 * Scanner class that manages camera streaming and QR code detection.
 */
export class QRScanner {
  constructor(options = {}) {
    this.videoElement = options.videoElement || null;
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.stream = null;
    this.scanning = false;
    this.animationFrame = null;
    this.lastScanTime = 0;
    this.scanCooldown = 2000; // ms between scans to avoid duplicate reads
  }

  /**
   * Start the camera and begin scanning.
   */
  async start(facingMode = 'environment') {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
        this.scanning = true;
        this._scanLoop();
      }

      return true;
    } catch (err) {
      console.warn('Camera access error:', err.message);
      this.onError(new Error('Camera access denied. Please grant camera permissions or use manual entry.'));
      return false;
    }
  }

  /**
   * Stop the camera and scanning.
   */
  stop() {
    this.scanning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Internal scan loop - captures frames and attempts QR detection.
   */
  async _scanLoop() {
    if (!this.scanning) return;

    try {
      const now = Date.now();
      if (now - this.lastScanTime >= this.scanCooldown && this.videoElement) {
        // Try to detect QR code from video frame
        const result = await this._detectQRFromFrame();
        if (result) {
          this.lastScanTime = now;
          this.onResult(result);
        }
      }
    } catch (err) {
      // Silently continue - scanning is best-effort
    }

    this.animationFrame = requestAnimationFrame(() => this._scanLoop());
  }

  /**
   * Attempt to decode a QR code from the current video frame.
   * Uses the built-in BarcodeDetector API when available (Chrome, Edge).
   */
  async _detectQRFromFrame() {
    // Use BarcodeDetector API (available in Chromium-based browsers)
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(this.videoElement);
        if (barcodes.length > 0) {
          const barcode = barcodes[0];
          return {
            rawValue: barcode.rawValue,
            format: 'QR_CODE',
            detectedAt: new Date().toISOString(),
          };
        }
      } catch (err) {
        // BarcodeDetector may fail on some devices
      }
    }

    return null;
  }

  /**
   * Attempt to parse a QR code payload (assumes JSON for Boon QR codes).
   */
  parseQRPayload(rawValue) {
    try {
      const parsed = JSON.parse(rawValue);
      if (parsed.type === 'biomedical_waste' && parsed.barcode) {
        return {
          isBoonQR: true,
          barcode: parsed.barcode,
          wasteType: parsed.waste_type,
          category: parsed.category,
          source: parsed.source,
          department: parsed.department,
          weightKg: parsed.weight_kg,
          container: parsed.container,
          generatedAt: parsed.generated_at,
          raw: parsed,
        };
      }
    } catch {
      // Not JSON - treat as plain barcode
    }
    return {
      isBoonQR: false,
      barcode: rawValue.trim(),
      raw: rawValue,
    };
  }

  /**
   * Check if camera is available.
   */
  static async isCameraAvailable() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(d => d.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  /**
   * Check if BarcodeDetector is supported.
   */
  static isBarcodeDetectorSupported() {
    return 'BarcodeDetector' in window;
  }
}
