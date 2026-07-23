/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ScannerApp from './ScannerApp'

// ── Hoisted mock data (must be defined before vi.mock calls) ────────────
const mockApi = vi.hoisted(() => ({
  getFacilities: vi.fn().mockResolvedValue([
    { name: 'AIIMS New Delhi' },
    { name: 'Fortis Hospital' },
  ]),
  getScannerStats: vi.fn().mockResolvedValue({
    total_scans: 15,
    today_scans: 3,
    unique_barcodes: 10,
    total_weight_kg: 42.5,
    category_breakdown: { yellow: 8, red: 4, white: 2, blue: 1 },
    recent_scans: [],
    system_status: 'connected',
    last_sync: '2026-07-21T10:00:00Z',
  }),
  getScanHistory: vi.fn().mockResolvedValue({
    items: [
      {
        barcode: 'BOON-A1B2-YE-210721-00001',
        waste_type: 'human_anatomical_waste',
        category: 'yellow',
        weight_kg: 2.5,
        source_facility: 'AIIMS New Delhi',
        department: 'Emergency',
        container_type: 'bag',
        scanned_by: 'Test User',
        scanned_at: '2026-07-21T09:30:00Z',
        status: 'logged',
      },
      {
        barcode: 'BOON-C3D4-RE-210721-00002',
        waste_type: 'iv_tubing',
        category: 'red',
        weight_kg: 1.2,
        source_facility: 'Fortis Hospital',
        department: 'ICU',
        container_type: 'bin',
        scanned_by: 'Test User',
        scanned_at: '2026-07-21T08:15:00Z',
        status: 'logged',
      },
    ],
    total: 2,
  }),
  logScan: vi.fn().mockResolvedValue({
    success: true,
    message: 'Waste item logged successfully',
    scan_entry: { barcode: 'BOON-TEST-001', status: 'logged' },
  }),
}))

vi.mock('../services/api', () => mockApi)

// ── Mock html5-qrcode (required for import, scanner lifecycle tested via E2E) ──
vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  })),
}))

// ── Mock navigator.mediaDevices ────────────────────────────────────────
const mockGetUserMedia = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: () => {} }],
  })
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: mockGetUserMedia },
    configurable: true,
    writable: true,
  })
})

// ── Helpers ──────────────────────────────────────────────────────────────
async function renderApp() {
  const result = render(<ScannerApp />)
  await waitFor(() => expect(screen.getByText('QR Code Scanner')).toBeInTheDocument())
  return result
}

async function clickTab(name: RegExp) {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name })) })
}

// ═══════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('ScannerApp', () => {
  // ── Rendering ────────────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders the header', async () => {
      await renderApp()
      expect(screen.getByText('QR Code Scanner')).toBeInTheDocument()
      expect(screen.getByText(/Scan, log, and track biomedical waste with camera/i)).toBeInTheDocument()
    })

    it('renders all 3 tab buttons', async () => {
      await renderApp()
      expect(screen.getByRole('button', { name: /camera scanner/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /manual entry/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /scan history/i })).toBeInTheDocument()
    })

    it('shows camera off overlay when not scanning', async () => {
      await renderApp()
      expect(screen.getByText('Camera is off')).toBeInTheDocument()
    })

    it('shows no QR code message initially in scan result panel', async () => {
      await renderApp()
      expect(screen.getByText('No QR code scanned yet')).toBeInTheDocument()
    })
  })

  // ── Stats ─────────────────────────────────────────────────────────
  describe('Stats Bar', () => {
    it('shows stats after API loads', async () => {
      await renderApp()
      await waitFor(() => { expect(screen.getByText('15')).toBeInTheDocument() })
      expect(screen.getByText('Total Scans')).toBeInTheDocument()
      expect(screen.getByText('42.5 kg')).toBeInTheDocument()
    })
  })

  // ── Tab Switching ─────────────────────────────────────────────────
  describe('Tab Switching', () => {
    it('switches to Manual Entry tab', async () => {
      await renderApp()
      await clickTab(/manual entry/i)
      await waitFor(() => { expect(screen.getByText('Manual Barcode Entry')).toBeInTheDocument() })
    })

    it('switches to Scan History tab', async () => {
      await renderApp()
      await clickTab(/scan history/i)
      await waitFor(() => { expect(screen.getByText('Scan & Log History')).toBeInTheDocument() })
    })
  })

  // ── Camera Permissions ───────────────────────────────────────────
  describe('Camera Permissions', () => {
    it('calls getUserMedia when Start is clicked', async () => {
      await renderApp()
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^start$/i })) })
      await waitFor(() => { expect(mockGetUserMedia).toHaveBeenCalled() })
    })

    it('requests environment-facing camera', async () => {
      await renderApp()
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^start$/i })) })
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({ video: expect.objectContaining({ facingMode: 'environment' }) }),
        )
      })
    })

    it('shows error when camera permission denied', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      await renderApp()
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^start$/i })) })
      await waitFor(() => { expect(screen.getByText(/Camera access denied/i)).toBeInTheDocument() })
    })
  })

  // ── Manual Entry ──────────────────────────────────────────────────
  describe('Manual Entry', () => {
    it('renders form fields', async () => {
      await renderApp()
      await clickTab(/manual entry/i)
      await waitFor(() => { expect(screen.getByText('Manual Barcode Entry')).toBeInTheDocument() })
      expect(screen.getByPlaceholderText('Enter or paste barcode...')).toBeInTheDocument()
    })

    it('submit button is disabled when barcode is empty', async () => {
      await renderApp()
      await clickTab(/manual entry/i)
      await waitFor(() => {
        const btn = screen.getByText('Log Scan to System').closest('button')
        expect(btn).toBeDisabled()
      })
    })

    it('calls api.logScan on submit', async () => {
      await renderApp()
      await clickTab(/manual entry/i)
      await waitFor(() => { expect(screen.getByText('Manual Barcode Entry')).toBeInTheDocument() })

      const input = screen.getByPlaceholderText('Enter or paste barcode...')
      await act(async () => { fireEvent.change(input, { target: { value: 'BOON-TEST-001' } }) })
      await act(async () => { fireEvent.click(screen.getByText('Log Scan to System')) })

      await waitFor(() => {
        expect(mockApi.logScan).toHaveBeenCalledWith(
          expect.objectContaining({ barcode: 'BOON-TEST-001' }),
        )
      })
    })

    it('shows success after submission', async () => {
      await renderApp()
      await clickTab(/manual entry/i)
      await waitFor(() => { expect(screen.getByText('Manual Barcode Entry')).toBeInTheDocument() })

      const input = screen.getByPlaceholderText('Enter or paste barcode...')
      await act(async () => { fireEvent.change(input, { target: { value: 'BOON-DONE-001' } }) })
      await act(async () => { fireEvent.click(screen.getByText('Log Scan to System')) })

      await waitFor(() => { expect(screen.getByText(/Logged: BOON-DONE-001/i)).toBeInTheDocument() })
    })

    it('shows error when api fails', async () => {
      mockApi.logScan.mockRejectedValueOnce(new Error('Backend unavailable'))
      await renderApp()
      await clickTab(/manual entry/i)
      await waitFor(() => { expect(screen.getByText('Manual Barcode Entry')).toBeInTheDocument() })

      const input = screen.getByPlaceholderText('Enter or paste barcode...')
      await act(async () => { fireEvent.change(input, { target: { value: 'BOON-FAIL-001' } }) })
      await act(async () => { fireEvent.click(screen.getByText('Log Scan to System')) })

      await waitFor(() => { expect(screen.getByText(/Backend unavailable/i)).toBeInTheDocument() })
    })
  })

  // ── Scan History ──────────────────────────────────────────────────
  describe('Scan History', () => {
    it('displays scan history data from API', async () => {
      await renderApp()
      await clickTab(/scan history/i)
      await waitFor(() => { expect(screen.getByText('Scan & Log History')).toBeInTheDocument() })
      expect(screen.getByText('BOON-A1B2-YE-210721-00001')).toBeInTheDocument()
    })

    it('shows total scan count in header', async () => {
      await renderApp()
      await clickTab(/scan history/i)
      await waitFor(() => { expect(screen.getByText('15 total scans')).toBeInTheDocument() })
    })
  })

  // ── Auto-log Toggle ───────────────────────────────────────────────
  describe('Auto-log Toggle', () => {
    it('renders auto-log checkbox', async () => {
      await renderApp()
      expect(screen.getByLabelText('Auto-log')).toBeInTheDocument()
    })

    it('is checked by default', async () => {
      await renderApp()
      const checkbox = screen.getByLabelText('Auto-log') as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    })

    it('can be unchecked', async () => {
      await renderApp()
      const checkbox = screen.getByLabelText('Auto-log') as HTMLInputElement
      await act(async () => { fireEvent.click(checkbox) })
      expect(checkbox.checked).toBe(false)
    })
  })

  // ── API Integration ───────────────────────────────────────────────
  describe('API Integration', () => {
    it('calls getFacilities on mount', async () => {
      await renderApp()
      expect(mockApi.getFacilities).toHaveBeenCalled()
    })

    it('calls getScannerStats on mount', async () => {
      await renderApp()
      expect(mockApi.getScannerStats).toHaveBeenCalled()
    })

    it('calls getScanHistory on mount', async () => {
      await renderApp()
      expect(mockApi.getScanHistory).toHaveBeenCalled()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// E2E CANDIDATES (requires real browser — Playwright tests)
//
// The following ScannerApp features require native browser APIs (camera,
// html5-qrcode lifecycle) and are better tested via Playwright/E2E:
//
// 1. Camera viewfinder starts/stops — detects "Scanning..." + "Stop Scanner"
// 2. QR code detected via camera → shows "QR Code Detected" text
// 3. Auto-log on QR detection → scan count increments
// 4. JSON payload extraction from QR data
// 5. Start scanner → switch tab → scanner stops
// ═══════════════════════════════════════════════════════════════════════
