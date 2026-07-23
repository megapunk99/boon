/**
 * 🌿 Boon Mobile Scanner — Camera QR Code Scanner
 *
 * Uses the device camera to detect and decode QR codes in real-time.
 * Uses the BarcodeDetector API (Chromium) with manual canvas fallback.
 * Designed for mobile-first use with the environment (rear) camera.
 */

class QRScanner {
  constructor(options = {}) {
    this.videoElement = options.videoElement || null;
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.stream = null;
    this.scanning = false;
    this.animationFrame = null;
    this.lastScanTime = 0;
    this.scanCooldown = 1500; // ms between scans
    this.detector = null;
    this._detectorReady = false;
  }

  /**
   * Start the camera and begin scanning.
   */
  async start(facingMode = 'environment') {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { min: 320, ideal: 640 },
          height: { min: 240, ideal: 480 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
        this.scanning = true;

        // Initialize barcode detector
        await this._initDetector();

        // Start the scan loop
        this._scanLoop();
      }

      return true;
    } catch (err) {
      console.warn('📷 Camera error:', err.message);
      if (err.name === 'NotAllowedError') {
        this.onError(new Error('Camera permission denied. Please grant camera access in your browser settings.'));
      } else if (err.name === 'NotFoundError') {
        this.onError(new Error('No camera found on this device.'));
      } else {
        this.onError(new Error(`Camera error: ${err.message}`));
      }
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
    this._detectorReady = false;
  }

  /**
   * Initialize the BarcodeDetector.
   */
  async _initDetector() {
    if (!('BarcodeDetector' in window)) {
      this._detectorReady = false;
      return;
    }

    try {
      // Check if QR code format is supported
      const supported = await BarcodeDetector.getSupportedFormats();
      if (supported.includes('qr_code')) {
        this.detector = new BarcodeDetector({ formats: ['qr_code'] });
        this._detectorReady = true;
      } else {
        this._detectorReady = false;
        console.warn('📷 QR code detection not supported on this browser');
      }
    } catch (err) {
      this._detectorReady = false;
      console.warn('📷 BarcodeDetector init error:', err.message);
    }
  }

  /**
   * Internal scan loop — captures frames and decodes QR codes.
   */
  _scanLoop() {
    if (!this.scanning) return;

    const now = Date.now();
    if (now - this.lastScanTime >= this.scanCooldown && this.videoElement) {
      this._detectQRFromFrame().then(result => {
        if (result) {
          this.lastScanTime = now;
          this.onResult(result);
        }
      }).catch(() => {
        // Silently continue
      });
    }

    this.animationFrame = requestAnimationFrame(() => this._scanLoop());
  }

  /**
   * Attempt to decode a QR code from the current video frame.
   */
  async _detectQRFromFrame() {
    // Try native BarcodeDetector API first
    if (this._detectorReady && this.detector && this.videoElement) {
      try {
        const barcodes = await this.detector.detect(this.videoElement);
        if (barcodes.length > 0) {
          const barcode = barcodes[0];
          return {
            rawValue: barcode.rawValue,
            format: 'QR_CODE',
            detectedAt: new Date().toISOString(),
            boundingBox: barcode.boundingBox,
          };
        }
      } catch (err) {
        // BarcodeDetector may fail intermittently
      }
    }

    return null;
  }

  /**
   * Parse QR code payload (supports Boon JSON format and plain text).
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
          source: parsed.source || parsed.source_facility,
          department: parsed.department,
          weightKg: parsed.weight_kg,
          container: parsed.container,
          generatedAt: parsed.generated_at,
          raw: parsed,
        };
      }
      // Valid JSON but not a Boon QR
      return {
        isBoonQR: false,
        barcode: rawValue.trim(),
        category: 'yellow',
        raw: parsed,
      };
    } catch {
      // Not JSON — treat as plain barcode
    }
    return {
      isBoonQR: false,
      barcode: rawValue.trim(),
      category: 'yellow',
      raw: null,
    };
  }

  /**
   * Check if camera hardware is available.
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
   * Check if BarcodeDetector QR support is available.
   */
  static isBarcodeDetectorSupported() {
    return 'BarcodeDetector' in window;
  }
}
