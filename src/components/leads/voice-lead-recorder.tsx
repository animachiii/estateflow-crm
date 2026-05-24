'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Square, RotateCcw, Send, Loader2 } from 'lucide-react';
import { createLeadFromVoiceNote } from '@/app/actions/voice-leads';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MAX_SECONDS = 20;

function getExtension(mimeType: string) {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mpeg')) return 'mp3';
  return 'webm';
}

export function VoiceLeadRecorder() {
  const router = useRouter();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  function clearTimers() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (stopRef.current) window.clearTimeout(stopRef.current);
    timerRef.current = null;
    stopRef.current = null;
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function resetRecording() {
    clearTimers();
    stopTracks();
    recorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setIsSaving(false);
    setSeconds(0);
    setAudioBlob(null);
    setTranscript(null);
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  async function startRecording() {
    try {
      resetRecording();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        clearTimers();
        stopTracks();
      };

      recorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setSeconds((current) => Math.min(current + 1, MAX_SECONDS));
      }, 1000);
      stopRef.current = window.setTimeout(() => stopRecording(), MAX_SECONDS * 1000);
    } catch {
      setError('Microphone permission is needed to record a lead.');
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function submitRecording() {
    if (!audioBlob) {
      setError('Record a voice note first.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setTranscript(null);

    const formData = new FormData();
    const extension = getExtension(audioBlob.type);
    formData.append('audio', audioBlob, `voice-lead.${extension}`);

    const result = await createLeadFromVoiceNote(formData);
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      setTranscript(result.transcript || null);
      return;
    }

    if (result.leadId) {
      router.push(`/leads/${result.leadId}`);
    }
  }

  const progress = Math.min((seconds / MAX_SECONDS) * 100, 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Voice Lead</h1>
              <p className="text-sm text-gray-500 mt-1">Record up to 20 seconds.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums text-gray-900">{seconds}s</div>
              <div className="text-xs text-gray-400">/{MAX_SECONDS}s</div>
            </div>
          </div>

          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSaving}
              className={[
                'h-28 w-28 rounded-full flex items-center justify-center transition shadow-sm',
                isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700',
              ].join(' ')}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <Square className="h-9 w-9" /> : <Mic className="h-10 w-10" />}
            </button>

            {audioUrl && (
              <audio controls src={audioUrl} className="w-full max-w-sm" />
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          {transcript && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Transcript</div>
              {transcript}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={resetRecording} disabled={isRecording || isSaving}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button type="button" onClick={submitRecording} disabled={!audioBlob || isRecording || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSaving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
