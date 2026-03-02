'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { IoCheckmarkCircle, IoCloseCircle, IoTime } from 'react-icons/io5'

interface AlertItem {
  id: string
  alert_name: string
  message: string
  screenshot_url: string
  timestamp: string
  status: string
  delivery_status: string
}

interface AlertModalProps {
  alert: AlertItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatTimestamp(ts: string): string {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return ts
  }
}

export default function AlertModal({ alert, open, onOpenChange }: AlertModalProps) {
  if (!alert) return null

  const isSuccess =
    (alert?.status ?? '').toLowerCase() === 'success' ||
    (alert?.status ?? '').toLowerCase() === 'sent'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-sm border-border bg-card text-foreground p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base font-semibold text-foreground truncate">
              {alert?.alert_name ?? 'Alert Details'}
            </DialogTitle>
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
        </DialogHeader>

        {/* Full-size screenshot */}
        {alert?.screenshot_url ? (
          <div className="px-4">
            <div className="rounded-sm overflow-hidden border border-border bg-secondary">
              <img
                src={alert.screenshot_url}
                alt={alert?.alert_name ?? 'Chart screenshot'}
                className="w-full h-auto max-h-[60vh] object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="px-4">
            <div className="rounded-sm border border-border bg-secondary flex items-center justify-center h-40 text-muted-foreground text-sm">
              No screenshot available
            </div>
          </div>
        )}

        {/* Details */}
        <div className="p-4 pt-3 space-y-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IoTime className="h-3.5 w-3.5" />
              {formatTimestamp(alert?.timestamp ?? '')}
            </span>
            <span>
              Delivery: <span className="text-foreground capitalize">{alert?.delivery_status ?? 'unknown'}</span>
            </span>
          </div>

          {alert?.message ? (
            <p className="text-sm text-foreground/80 leading-relaxed">
              {alert.message}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
