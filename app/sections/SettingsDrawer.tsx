'use client'

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { copyToClipboard } from '@/lib/clipboard'
import { callAIAgent } from '@/lib/aiAgent'
import { IoCopy, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5'

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  connectionStatus: 'connected' | 'disconnected'
  onConnectionChange: (status: 'connected' | 'disconnected') => void
}

const STORAGE_KEY = 'tv_alert_bot_settings'

interface SettingsData {
  webhookUrl: string
  botToken: string
  chatId: string
}

function loadSettings(): SettingsData {
  if (typeof window === 'undefined') {
    return { webhookUrl: 'https://your-app.com/api/webhook', botToken: '', chatId: '' }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        webhookUrl: parsed?.webhookUrl ?? 'https://your-app.com/api/webhook',
        botToken: parsed?.botToken ?? '',
        chatId: parsed?.chatId ?? '',
      }
    }
  } catch {
    // ignore
  }
  return { webhookUrl: 'https://your-app.com/api/webhook', botToken: '', chatId: '' }
}

export default function SettingsDrawer({
  open,
  onOpenChange,
  agentId,
  connectionStatus,
  onConnectionChange,
}: SettingsDrawerProps) {
  const [settings, setSettings] = useState<SettingsData>(loadSettings)
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSettings(loadSettings())
      setTestResult(null)
    }
  }, [open])

  const handleCopyWebhook = async () => {
    const success = await copyToClipboard(settings.webhookUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTestConnection = async () => {
    if (!settings.botToken || !settings.chatId) {
      setTestResult('Please enter both Bot Token and Chat ID')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const result = await callAIAgent(
        `Test Telegram connection with bot token and chat ID. Send a test message saying "TradingView Alert Bot connected successfully!" to chat ${settings.chatId}`,
        agentId
      )
      if (result?.success) {
        setTestResult('Connection test sent successfully')
        onConnectionChange('connected')
      } else {
        setTestResult(result?.response?.message ?? 'Connection test failed')
        onConnectionChange('disconnected')
      }
    } catch {
      setTestResult('Connection test failed — check your credentials')
      onConnectionChange('disconnected')
    }
    setTesting(false)
  }

  const handleSave = () => {
    setSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      if (settings.botToken && settings.chatId) {
        onConnectionChange('connected')
      }
    } catch {
      // ignore
    }
    setTimeout(() => {
      setSaving(false)
    }, 500)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="rounded-sm border-border bg-card text-foreground w-[360px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-foreground text-base font-semibold">Settings</SheetTitle>
          <SheetDescription className="text-muted-foreground text-xs">
            Configure your TradingView webhook and Telegram delivery.
          </SheetDescription>
        </SheetHeader>

        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-accent' : 'bg-destructive'}`}
          />
          <span className="text-xs text-muted-foreground capitalize">{connectionStatus}</span>
        </div>

        <Separator className="bg-border mb-4" />

        {/* Webhook Section */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-foreground">Webhook URL</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Set this URL as the webhook endpoint in your TradingView alert.
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={settings.webhookUrl}
              className="h-8 text-xs rounded-sm bg-input border-border text-foreground font-mono flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-sm border-border text-foreground shrink-0"
              onClick={handleCopyWebhook}
            >
              {copied ? (
                <IoCheckmarkCircle className="h-3.5 w-3.5 text-accent" />
              ) : (
                <IoCopy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <Separator className="bg-border mb-4" />

        {/* Telegram Section */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-foreground">Telegram Configuration</h3>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Bot Token</Label>
            <Input
              type="password"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v..."
              value={settings.botToken}
              onChange={(e) => setSettings((prev) => ({ ...prev, botToken: e.target.value }))}
              className="h-8 text-xs rounded-sm bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Chat ID</Label>
            <Input
              placeholder="-1001234567890"
              value={settings.chatId}
              onChange={(e) => setSettings((prev) => ({ ...prev, chatId: e.target.value }))}
              className="h-8 text-xs rounded-sm bg-input border-border text-foreground"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 rounded-sm border-border text-foreground text-xs"
            onClick={handleTestConnection}
            disabled={testing || !settings.botToken || !settings.chatId}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          {testResult ? (
            <p
              className={`text-[11px] leading-relaxed ${testResult.includes('success') ? 'text-accent' : 'text-destructive'}`}
            >
              {testResult}
            </p>
          ) : null}
        </div>

        <Separator className="bg-border mb-4" />

        {/* Save Button */}
        <Button
          className="w-full h-9 rounded-sm bg-primary text-primary-foreground text-sm font-medium"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
