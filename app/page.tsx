'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { IoSettingsSharp, IoArrowForward, IoRefresh } from 'react-icons/io5'
import { MdSignalWifiStatusbar4Bar, MdSignalWifiStatusbarNotConnected } from 'react-icons/md'

import AlertFeed from './sections/AlertFeed'
import AlertModal from './sections/AlertModal'
import SettingsDrawer from './sections/SettingsDrawer'

// --- Types ---
interface AlertItem {
  id: string
  alert_name: string
  message: string
  screenshot_url: string
  timestamp: string
  status: string
  delivery_status: string
}

// --- Theme ---
const THEME_VARS = {
  '--background': '220 25% 7%',
  '--foreground': '220 15% 85%',
  '--card': '220 22% 10%',
  '--card-foreground': '220 15% 85%',
  '--primary': '220 80% 55%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '220 18% 16%',
  '--secondary-foreground': '220 15% 80%',
  '--accent': '160 70% 45%',
  '--accent-foreground': '0 0% 100%',
  '--destructive': '0 75% 55%',
  '--muted': '220 15% 20%',
  '--muted-foreground': '220 12% 55%',
  '--border': '220 18% 18%',
  '--input': '220 15% 24%',
  '--ring': '220 80% 55%',
  '--radius': '0.125rem',
} as React.CSSProperties

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Sample Data ---
const SAMPLE_ALERTS: AlertItem[] = [
  {
    id: '1',
    alert_name: 'BTC/USDT Golden Cross',
    message: 'The 50-day MA has crossed above the 200-day MA on the 4H chart. Bullish signal detected.',
    screenshot_url: 'https://placehold.co/800x450/1a1f2e/3b82f6?text=BTC+Golden+Cross',
    timestamp: '2026-03-02T14:32:00Z',
    status: 'success',
    delivery_status: 'delivered',
  },
  {
    id: '2',
    alert_name: 'ETH/USDT RSI Oversold',
    message: 'RSI dropped below 30 on the 1H timeframe. Potential reversal zone.',
    screenshot_url: 'https://placehold.co/800x450/1a1f2e/22c55e?text=ETH+RSI+Oversold',
    timestamp: '2026-03-02T13:15:00Z',
    status: 'success',
    delivery_status: 'delivered',
  },
  {
    id: '3',
    alert_name: 'SOL/USDT Support Break',
    message: 'Price broke below key support at $142. Bearish continuation likely.',
    screenshot_url: 'https://placehold.co/800x450/1a1f2e/ef4444?text=SOL+Support+Break',
    timestamp: '2026-03-02T11:48:00Z',
    status: 'failed',
    delivery_status: 'error',
  },
  {
    id: '4',
    alert_name: 'AAPL Earnings Gap Up',
    message: 'AAPL gapped up 4.2% after earnings beat. Volume spike confirmed.',
    screenshot_url: 'https://placehold.co/800x450/1a1f2e/a855f7?text=AAPL+Gap+Up',
    timestamp: '2026-03-02T09:30:00Z',
    status: 'success',
    delivery_status: 'delivered',
  },
]

// --- Constants ---
const AGENT_ID = '69a512382a5ce37e10b42d2b'

// --- Page ---
export default function Page() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [showSample, setShowSample] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load connection status from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tv_alert_bot_settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.botToken && parsed?.chatId) {
          setConnectionStatus('connected')
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const displayAlerts = showSample ? SAMPLE_ALERTS : alerts

  const handleSelectAlert = useCallback((alert: AlertItem) => {
    setSelectedAlert(alert)
    setModalOpen(true)
  }, [])

  const simulateAlert = async () => {
    setLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)

    const samplePayload = JSON.stringify({
      alert_name: 'BTC/USDT Golden Cross',
      screenshot_url: 'https://placehold.co/800x450/1a1f2e/3b82f6?text=BTC+Chart',
      triggered_at: new Date().toISOString(),
    })

    try {
      const result = await callAIAgent(
        `Process this TradingView alert webhook payload: ${samplePayload}`,
        AGENT_ID
      )

      if (result?.success) {
        const data = result?.response?.result
        const newAlert: AlertItem = {
          id: Date.now().toString(),
          alert_name: data?.alert_name ?? 'Unknown Alert',
          message: data?.message ?? result?.response?.message ?? '',
          screenshot_url: data?.screenshot_url ?? '',
          timestamp: data?.timestamp ?? new Date().toISOString(),
          status: data?.status ?? 'success',
          delivery_status: data?.delivery_status ?? 'pending',
        }
        setAlerts((prev) => [newAlert, ...prev])
      } else {
        setError(result?.response?.message ?? 'Agent call failed')
      }
    } catch (err) {
      setError('Failed to process alert. Please try again.')
    }

    setActiveAgentId(null)
    setLoading(false)
  }

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
              TradingView
              <IoArrowForward className="h-3 w-3 text-muted-foreground" />
              Telegram
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Sample Data Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-[11px] text-muted-foreground cursor-pointer">
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={showSample}
                onCheckedChange={setShowSample}
                className="scale-75"
              />
            </div>

            <Separator orientation="vertical" className="h-5 bg-border" />

            {/* Connection Status */}
            <Badge
              variant="outline"
              className={`rounded-sm text-[10px] px-2 py-0 font-medium flex items-center gap-1 border-border ${connectionStatus === 'connected' ? 'text-accent' : 'text-destructive'}`}
            >
              {connectionStatus === 'connected' ? (
                <MdSignalWifiStatusbar4Bar className="h-3 w-3" />
              ) : (
                <MdSignalWifiStatusbarNotConnected className="h-3 w-3" />
              )}
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </Badge>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
            >
              <IoSettingsSharp className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          {/* Simulate Button + Error */}
          <div className="flex items-center gap-2">
            <Button
              onClick={simulateAlert}
              disabled={loading}
              className="h-8 rounded-sm bg-primary text-primary-foreground text-xs font-medium px-4 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <IoRefresh className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IoRefresh className="h-3.5 w-3.5" />
                  Simulate Alert
                </>
              )}
            </Button>
            {error ? (
              <span className="text-[11px] text-destructive">{error}</span>
            ) : null}
          </div>

          {/* Alert Feed */}
          <div className="flex-1 overflow-hidden">
            <AlertFeed
              alerts={displayAlerts}
              onSelectAlert={handleSelectAlert}
              filterText={filterText}
              onFilterChange={setFilterText}
            />
          </div>
        </main>

        {/* Agent Status Footer */}
        <footer className="border-t border-border bg-card px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${activeAgentId ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-[10px] text-muted-foreground font-mono">
                Alert Processor Agent
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {activeAgentId ? 'Processing...' : 'Idle'}
            </span>
          </div>
        </footer>

        {/* Modal + Drawer */}
        <AlertModal
          alert={selectedAlert}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
        <SettingsDrawer
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          agentId={AGENT_ID}
          connectionStatus={connectionStatus}
          onConnectionChange={setConnectionStatus}
        />
      </div>
    </ErrorBoundary>
  )
}
