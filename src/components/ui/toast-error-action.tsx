'use client'

import * as React from 'react'
import { ToastAction } from './toast'

export function ToastErrorAction() {
  return (
    <ToastAction
      altText="Try again"
      onClick={() => window.location.reload()}
      className="bg-red-50 text-red-900 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-100 dark:hover:bg-red-900/75"
    >
      Try Again
    </ToastAction>
  )
} 