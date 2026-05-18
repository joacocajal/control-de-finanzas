'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAudioRecorderReturn {
  isRecording: boolean
  audioBlob: Blob | null
  audioDuration: number
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  clearRecording: () => void
}

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ''
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setAudioDuration(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : undefined
      const recorder = new MediaRecorder(stream, options)

      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      recorder.start(100)
      mediaRecorderRef.current = recorder
      startTimeRef.current = Date.now()
      setIsRecording(true)

      intervalRef.current = setInterval(() => {
        setAudioDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado'
          : 'No se pudo acceder al micrófono'
      setError(msg)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRecording])

  const clearRecording = useCallback(() => {
    setAudioBlob(null)
    setAudioDuration(0)
    setError(null)
  }, [])

  return {
    isRecording,
    audioBlob,
    audioDuration,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  }
}
