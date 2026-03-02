'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { IoCheckmarkCircle, IoCloseCircle, IoSearch, IoAlertCircle, IoTime } from 'react-icons/io5'

interface AlertItem {
  id: string
  alert_name: string
  message: string
  screenshot_url: string
  timestamp: string
  status: string
  delivery_status: string
}

interface AlertFeedProps {
  alerts: AlertItem[]
  onSelectAlert: (alert: AlertItem) => void
  filterText: string
  onFilterChange: (text: string) => void
}

function formatTimestamp(ts: string): string {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ts
  }
}

export default function AlertFeed({ alerts, onSelectAlert, filterText, onFilterChange }: AlertFeedProps) {
  const filteredAlerts = Array.isArray(alerts)
    ? alerts.filter((a) =>
        (a?.alert_name ?? '').toLowerCase().includes((filterText ?? '').toLowerCase())
      )
    : []

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-1">
        <div className="relative flex-1">
          <IoSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter alerts..."
            value={filterText}
            onChange={(e) => onFilterChange(e.target.value)}
            className="pl-8 h-8 text-sm rounded-sm bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Alert List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-1 pb-2">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <IoAlertCircle className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">No alerts yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                  Configure your TradingView webhook to point to this app, or click &quot;Simulate Alert&quot; to test.
                </p>
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSuccess =
                (alert?.status ?? '').toLowerCase() === 'success' ||
                (alert?.status ?? '').toLowerCase() === 'sent'

              return (
                <Card
                  key={alert?.id ?? Math.random().toString()}
                  className="rounded-sm border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => onSelectAlert(alert)}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Top row: name + status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground truncate flex-1">
                        {alert?.alert_name ?? 'Unknown Alert'}
                      </span>
                      <Badge
                        variant={isSuccess ? 'default' : 'destructive'}
                        className={`rounded-sm text-[10px] px-1.5 py-0 font-medium flex items-center gap-1 shrink-0 ${isSuccess ? 'bg-accent text-accent-foreground' : ''}`}
                      >
                        {isSuccess ? (
                          <IoCheckmarkCircle className="h-3 w-3" />
                        ) : (
                          <IoCloseCircle className="h-3 w-3" />
                        )}
                        {isSuccess ? 'Sent' : 'Failed'}
                      </Badge>
                    </div>

                    {/* Screenshot thumbnail */}
                    {alert?.screenshot_url ? (
                      <div className="rounded-sm overflow-hidden border border-border">
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={alert.screenshot_url}
                            alt={alert?.alert_name ?? 'Chart screenshot'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </AspectRatio>
                      </div>
                    ) : null}

                    {/* Bottom row: timestamp + delivery */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IoTime className="h-3 w-3" />
                        {formatTimestamp(alert?.timestamp ?? '')}
                      </span>
                      <span className="capitalize">
                        {alert?.delivery_status ?? 'unknown'}
                      </span>
                    </div>

                    {/* Message preview */}
                    {alert?.message ? (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {alert.message}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
