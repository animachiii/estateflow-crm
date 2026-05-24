'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Square, RotateCcw, Send, Loader2, Sparkles } from 'lucide-react';
import { createLeadFromVoiceDraft, extractLeadFromVoiceNote, type VoiceLeadDraft } from '@/app/actions/voice-leads';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  const [draft, setDraft] = useState<VoiceLeadDraft | null>(null);

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
    setDraft(null);
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

  async function extractRecording() {
    if (!audioBlob) {
      setError('Record a voice note first.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setTranscript(null);
    setDraft(null);

    const formData = new FormData();
    const extension = getExtension(audioBlob.type);
    formData.append('audio', audioBlob, `voice-lead.${extension}`);

    const result = await extractLeadFromVoiceNote(formData);
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      if ('transcript' in result) setTranscript(result.transcript || null);
      return;
    }

    if ('draft' in result && result.draft) {
      setDraft(result.draft);
      setTranscript(result.transcript || null);
    }
  }

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await createLeadFromVoiceDraft(formData);
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
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
            <Button type="button" onClick={extractRecording} disabled={!audioBlob || isRecording || isSaving}>
              {isSaving && !draft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isSaving && !draft ? 'Extracting...' : 'Extract'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {draft && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={createLead} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Review Lead</h2>
                <p className="text-sm text-gray-500 mt-1">Fill the required fields before saving.</p>
              </div>

              <input type="hidden" name="transcript" value={transcript || ''} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <Input name="full_name" required defaultValue={draft.full_name} placeholder="Customer name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <Input name="phone" type="tel" required defaultValue={draft.phone} placeholder="+91..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input name="email" type="email" defaultValue={draft.email} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <Select name="property_type" defaultValue={draft.property_type}>
                    <option value="">Select...</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                    <option value="commercial">Commercial</option>
                    <option value="rental">Rental</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
                  <Input name="preferred_location" defaultValue={draft.preferred_location} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <Select name="temperature" defaultValue={draft.temperature}>
                    <option value="cold">Cold</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min</label>
                  <Input name="budget_min" type="number" defaultValue={draft.budget_min} placeholder="e.g. 5000000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max</label>
                  <Input name="budget_max" type="number" defaultValue={draft.budget_max} placeholder="e.g. 10000000" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Textarea name="notes" rows={4} defaultValue={draft.notes} />
              </div>

              <Button type="submit" loading={isSaving} loadingText="Saving..." className="w-full">
                <Send className="h-4 w-4" /> Create Lead
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
