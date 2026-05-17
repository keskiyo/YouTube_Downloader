import { useEffect, useRef, useCallback } from 'react'

export interface SSEOptions<T> {
	onMessage: (data: T) => void
	onError?: (error: Event) => void
	onOpen?: () => void
	onClose?: () => void
	autoReconnect?: boolean
	reconnectInterval?: number
}

export function useSSE<T>(url: string | null, options: SSEOptions<T>) {
	const {
		onMessage,
		onError,
		onOpen,
		onClose,
		autoReconnect = true,
		reconnectInterval = 3000,
	} = options

	const eventSourceRef = useRef<EventSource | null>(null)
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isMountedRef = useRef(true)

	const connect = useCallback(() => {
		if (!url || !isMountedRef.current) return

		if (eventSourceRef.current) {
			eventSourceRef.current.close()
		}

		console.log('[SSE] Connecting to:', url)
		const eventSource = new EventSource(url)
		eventSourceRef.current = eventSource

		eventSource.onopen = () => {
			console.log('[SSE] Connected')
			onOpen?.()
		}

		eventSource.onmessage = event => {
			try {
				const data = JSON.parse(event.data) as T
				onMessage(data)
			} catch (err) {
				console.error('[SSE] Parse error:', err, 'Raw data:', event.data)
			}
		}

		eventSource.onerror = error => {
			console.error('[SSE] Error:', error)
			onError?.(error)

			if (autoReconnect && isMountedRef.current) {
				console.log(`[SSE] Reconnecting in ${reconnectInterval}ms...`)
				reconnectTimeoutRef.current = setTimeout(() => {
					if (isMountedRef.current) {
						connect()
					}
				}, reconnectInterval)
			}
		}
	}, [url, autoReconnect, reconnectInterval, onMessage, onError, onOpen])

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current)
			reconnectTimeoutRef.current = null
		}

		if (eventSourceRef.current) {
			eventSourceRef.current.close()
			eventSourceRef.current = null
		}

		onClose?.()
	}, [onClose])

	useEffect(() => {
		isMountedRef.current = true
		connect()

		return () => {
			isMountedRef.current = false
			disconnect()
		}
	}, [connect, disconnect])

	return { disconnect, reconnect: connect }
}