'use client';

import { useState, useTransition } from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import Link from 'next/link';
import {
  Phone, MessageSquare, Mail, ArrowLeft, Building2, Clock, Send,
  Share2, Pencil, Sparkles, Lightbulb, Check, AlarmClockOff, ExternalLink,
  PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  cn, LEAD_STATUS_COLORS, TEMP_COLORS, STATUS_LABELS, SOURCE_LABELS,
  formatCurrency, formatPhone, timeAgo
} from '@/lib/utils';
import { updateLeadStatus, updateLeadTemperature, assignLead, addLeadNote } from '@/app/actions/leads';
import { sendFollowUpMessage, createFollowUp, completeFollowUp, snoozeFollowUp, logLeadTouch } from '@/app/actions/followups';
import { shareProperty } from '@/app/actions/properties';
import { draftFollowUpMessage, summarizeLead, suggestNextAction } from '@/app/actions/ai';
import {
  BENGALURU_FOLLOW_UP_TEMPLATES,
  buildPropertyShareMessage,
  fillFollowUpTemplate,
  getLeadFollowUpPlaybook,
  getLeadTemplateVars,
  getTemplateByKey,
  type FollowUpTemplateKey,
  type FollowUpRecommendation,
  type PlaybookFollowUp,
  type PlaybookLead,
  type PlaybookShare,
} from '@/lib/services/follow-up-playbook';
import type { Activity, FollowUpType, LeadPropertyShare, Profile } from '@/types';

interface LeadDetailProps {
  lead: LeadDetailLead;
  activities: LeadActivity[];
  followups: LeadDetailFollowUp[];
  shares: LeadDetailShare[];
  agents: { id: string; full_name: string }[];
  recommendedProperties: RecommendedProperty[];
  templates: TemplateOption[];
}

type LeadDetailLead = PlaybookLead & {
  email: string | null;
  source: string;
  temperature: string;
  organization_id: string;
  assigned_agent_id: string | null;
  assigned_agent?: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
  notes: string | null;
  created_at: string;
};

type LeadActivity = Pick<Activity, 'id' | 'type' | 'title' | 'description' | 'created_at'> & {
  user?: Pick<Profile, 'full_name'> | null;
};

type LeadDetailFollowUp = PlaybookFollowUp & {
  lead_id: string;
};

type LeadDetailShare = PlaybookShare & Pick<LeadPropertyShare, 'created_at' | 'channel' | 'property_id'>;

type RecommendedProperty = {
  id: string;
  title: string;
  location: string;
  price: number;
  property_type: string | null;
  bedrooms: number | null;
  availability: string | null;
};

type TemplateOption = {
  id: string;
  name: string;
  type: FollowUpType;
  message: string;
  is_default?: boolean;
};

function toDateTimeLocalValue(date: string | Date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function tomorrowMorning() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
}

export function LeadDetail({ lead, activities, followups, shares, agents, recommendedProperties, templates }: LeadDetailProps) {
  const [note, setNote] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showShareProp, setShowShareProp] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageError, setMessageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [followUpType, setFollowUpType] = useState<'whatsapp' | 'sms' | 'email' | 'call'>('whatsapp');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [aiInsight, setAiInsight] = useState<{ kind: 'summary' | 'action'; text: string } | null>(null);
  const [aiError, setAiError] = useState<string>('');
  const leadVars = getLeadTemplateVars(lead);
  const playbook = getLeadFollowUpPlaybook({ lead, activities, followups, shares });
  const openFollowups = followups
    .filter((followup) => followup.status === 'pending' || followup.status === 'snoozed')
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
  const templateOptions = [
    ...BENGALURU_FOLLOW_UP_TEMPLATES.map((template) => ({
      id: `playbook:${template.key}`,
      name: `${template.group}: ${template.name}`,
      type: template.type,
      message: fillFollowUpTemplate(template.message, leadVars),
    })),
    ...templates,
  ];

  async function handleDraftMessage(channel: 'whatsapp' | 'sms') {
    setBusyKey('ai-draft');
    setAiError('');
    try {
      const r = await draftFollowUpMessage(lead.id, channel);
      if ('error' in r && r.error) setAiError(r.error);
      else if ('text' in r && r.text) setQuickMessage(r.text);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleSummarize() {
    setBusyKey('ai-summary');
    setAiError('');
    try {
      const r = await summarizeLead(lead.id);
      if ('error' in r && r.error) setAiError(r.error);
      else if ('text' in r && r.text) setAiInsight({ kind: 'summary', text: r.text });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleSuggestAction() {
    setBusyKey('ai-action');
    setAiError('');
    try {
      const r = await suggestNextAction(lead.id);
      if ('error' in r && r.error) setAiError(r.error);
      else if ('text' in r && r.text) setAiInsight({ kind: 'action', text: r.text });
    } finally {
      setBusyKey(null);
    }
  }

  function run(key: string, fn: () => Promise<unknown>) {
    setBusyKey(key);
    setActionMessage('');
    startTransition(async () => {
      try {
        await fn();
      } finally {
        setBusyKey(null);
      }
    });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    run('note', async () => {
      await addLeadNote(lead.id, note);
      setNote('');
    });
  }

  function openTel() {
    window.open(`tel:${lead.phone}`);
  }

  function openWhatsApp(message = quickMessage) {
    const phone = lead.phone.replace(/\D/g, '');
    const text = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
    window.open(`https://wa.me/${phone}${text}`);
  }

  function applyTemplateMessage(templateKey?: FollowUpTemplateKey, fallbackMessage?: string) {
    const template = templateKey ? getTemplateByKey(templateKey) : null;
    const message = fallbackMessage || (template ? fillFollowUpTemplate(template.message, leadVars) : '');
    if (!message.trim()) return;
    setQuickMessage(message);
    setSelectedTemplate(templateKey ? `playbook:${templateKey}` : '');
    setShowQuickMessage(true);
    setMessageError('');
  }

  function prepareFollowUp(type: 'whatsapp' | 'sms' | 'email' | 'call', scheduledAt: string | Date, message = '') {
    setFollowUpType(type);
    setFollowUpDate(toDateTimeLocalValue(scheduledAt));
    setFollowUpMessage(message);
    setShowFollowUp(true);
  }

  function applySuggestedFollowUp(recommendation: FollowUpRecommendation) {
    if (!recommendation.suggestedFollowUp) return;
    prepareFollowUp(
      recommendation.suggestedFollowUp.type,
      recommendation.suggestedFollowUp.scheduledAt,
      recommendation.suggestedFollowUp.message,
    );
  }

  function handlePlaybookPrimary() {
    if (playbook.primaryChannel === 'call') {
      openTel();
      return;
    }
    if (playbook.primaryChannel === 'whatsapp') {
      applyTemplateMessage(playbook.templateKey);
      return;
    }
    if (playbook.primaryChannel === 'share_property') {
      setShowShareProp(true);
      return;
    }
    if (playbook.primaryChannel === 'status' && playbook.nextStatus) {
      run('playbook-status', () => updateLeadStatus(lead.id, playbook.nextStatus!));
    }
  }

  function handleSendMessage(channel: 'whatsapp' | 'sms') {
    if (!quickMessage.trim()) return;
    setMessageError('');
    run(`msg-${channel}`, async () => {
      const result = await sendFollowUpMessage(lead.id, quickMessage, channel);
      if (result && 'error' in result && result.error) {
        setMessageError(result.error);
        return;
      }
      setActionMessage(result && 'dryRun' in result && result.dryRun ? `${channel} message simulated.` : `${channel} message sent.`);
      setQuickMessage('');
      setShowQuickMessage(false);
    });
  }

  function handleLogTouch(channel: 'call' | 'whatsapp', outcome: 'done' | 'not_done') {
    run(`${channel}-${outcome}`, async () => {
      const result = await logLeadTouch(lead.id, channel, outcome);
      if (result && 'error' in result && result.error) setActionMessage(`Error: ${result.error}`);
      else setActionMessage(outcome === 'done' ? 'Touch logged and next step queued.' : 'Attempt logged and recovery follow-up queued.');
    });
  }

  function handleSnooze(followUpId: string) {
    run(`snooze-${followUpId}`, async () => {
      await snoozeFollowUp(followUpId, tomorrowMorning().toISOString());
      setActionMessage('Follow-up snoozed to tomorrow morning.');
    });
  }

  function handleComplete(followUpId: string) {
    run(`complete-${followUpId}`, async () => {
      await completeFollowUp(followUpId);
      setActionMessage('Follow-up completed.');
    });
  }

  function handleUseFollowUp(followup: LeadDetailFollowUp) {
    if (followup.type === 'call') {
      openTel();
      return;
    }
    if (followup.type === 'whatsapp' || followup.type === 'sms') {
      setQuickMessage(followup.message || '');
      setSelectedTemplate('');
      setShowQuickMessage(true);
    }
  }

  function handlePropertyShare(property: RecommendedProperty, channel: 'whatsapp' | 'email') {
    const key = channel === 'whatsapp' ? `share-wa-${property.id}` : `share-em-${property.id}`;
    run(key, async () => {
      const result = await shareProperty(lead.id, property.id, channel);
      if (result && 'error' in result && result.error) {
        setActionMessage(`Error: ${result.error}`);
      } else {
        setActionMessage('Property shared and follow-ups queued.');
      }
    });
  }

  function handleOpenPropertyWhatsApp(property: RecommendedProperty) {
    const shareLink = `${window.location.origin}/share/property/${property.id}`;
    const message = buildPropertyShareMessage(lead, property, shareLink);
    openWhatsApp(message);
    run(`share-link-${property.id}`, async () => {
      const result = await shareProperty(lead.id, property.id, 'link');
      if (result && 'error' in result && result.error) setActionMessage(`Error: ${result.error}`);
      else setActionMessage('WhatsApp opened and share logged.');
    });
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      {/* Back + Header */}
      <div className="flex items-center gap-2">
        <Link href="/leads"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{lead.full_name}</h1>
        <Link href={`/leads/${lead.id}/edit`}>
          <Button size="icon-sm" variant="outline" aria-label="Edit lead">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <Badge className={cn('text-xs', TEMP_COLORS[lead.temperature])}>{lead.temperature}</Badge>
      </div>

      {/* Quick Info Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={cn(LEAD_STATUS_COLORS[lead.status])}>{STATUS_LABELS[lead.status]}</Badge>
            <span className="text-xs text-gray-400">{SOURCE_LABELS[lead.source]}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{formatPhone(lead.phone)}</span></div>
            {lead.email && <div><span className="text-gray-500">Email:</span> <span className="font-medium">{lead.email}</span></div>}
            {lead.preferred_location && <div><span className="text-gray-500">Location:</span> <span className="font-medium">{lead.preferred_location}</span></div>}
            {lead.property_type && <div><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{lead.property_type}</span></div>}
            {(lead.budget_min || lead.budget_max) && (
              <div className="col-span-2"><span className="text-gray-500">Budget:</span> <span className="font-medium">
                {lead.budget_min ? formatCurrency(lead.budget_min) : '—'} - {lead.budget_max ? formatCurrency(lead.budget_max) : '—'}
              </span></div>
            )}
            {lead.assigned_agent && (
              <div><span className="text-gray-500">Agent:</span> <span className="font-medium">{lead.assigned_agent.full_name}</span></div>
            )}
          </div>
          {lead.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">{lead.notes}</p>}
        </CardContent>
      </Card>

      {actionMessage && (
        <div className={`text-sm px-3 py-2 rounded-lg ${actionMessage.toLowerCase().includes('error') || actionMessage.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {actionMessage}
        </div>
      )}

      {/* Guided Follow-up Workbench */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-emerald-600" /> Next Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{playbook.title}</p>
            <p className="text-xs text-slate-500 mt-1">{playbook.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {playbook.primaryChannel !== 'none' && (
              <Button size="sm" onClick={handlePlaybookPrimary} loading={busyKey === 'playbook-status'} loadingText="Saving...">
                {playbook.primaryChannel === 'call' ? <Phone className="h-4 w-4" /> : playbook.primaryChannel === 'share_property' ? <Share2 className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                {playbook.primaryLabel}
              </Button>
            )}
            {playbook.templateKey && playbook.primaryChannel !== 'whatsapp' && (
              <Button size="sm" variant="outline" onClick={() => applyTemplateMessage(playbook.templateKey)}>
                <MessageSquare className="h-4 w-4" /> Use template
              </Button>
            )}
            {playbook.suggestedFollowUp && (
              <Button size="sm" variant="outline" onClick={() => applySuggestedFollowUp(playbook)}>
                <Clock className="h-4 w-4" /> {playbook.suggestedFollowUp.label}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button size="sm" variant="secondary" loading={busyKey === 'call-done'} onClick={() => handleLogTouch('call', 'done')}>
              <Check className="h-4 w-4" /> Call done
            </Button>
            <Button size="sm" variant="secondary" loading={busyKey === 'call-not_done'} onClick={() => handleLogTouch('call', 'not_done')}>
              <AlarmClockOff className="h-4 w-4" /> No answer
            </Button>
            <Button size="sm" variant="secondary" loading={busyKey === 'whatsapp-done'} onClick={() => handleLogTouch('whatsapp', 'done')}>
              <MessageSquare className="h-4 w-4" /> WA reply
            </Button>
            <Button size="sm" variant="outline" onClick={() => prepareFollowUp('call', tomorrowMorning(), 'Call to move the lead to the next step.')}>
              <Clock className="h-4 w-4" /> Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {openFollowups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Open Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openFollowups.slice(0, 4).map((followup) => (
              <div key={followup.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{followup.type}</Badge>
                    <span className="text-xs text-slate-500">{timeAgo(followup.scheduled_at)}</span>
                  </div>
                  {followup.message && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{followup.message}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon-sm" variant="ghost" title="Use" onClick={() => handleUseFollowUp(followup)}>
                    {followup.type === 'call' ? <Phone className="h-4 w-4 text-emerald-600" /> : <Send className="h-4 w-4 text-indigo-600" />}
                  </Button>
                  <Button size="icon-sm" variant="ghost" title="Complete" loading={busyKey === `complete-${followup.id}`} onClick={() => handleComplete(followup.id)}>
                    {busyKey === `complete-${followup.id}` ? null : <Check className="h-4 w-4 text-green-600" />}
                  </Button>
                  <Button size="icon-sm" variant="ghost" title="Snooze" loading={busyKey === `snooze-${followup.id}`} onClick={() => handleSnooze(followup.id)}>
                    {busyKey === `snooze-${followup.id}` ? null : <AlarmClockOff className="h-4 w-4 text-orange-500" />}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-900">AI Insights</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" loading={busyKey === 'ai-summary'} loadingText="..." onClick={handleSummarize}>
                Summarize
              </Button>
              <Button size="sm" variant="outline" loading={busyKey === 'ai-action'} loadingText="..." onClick={handleSuggestAction}>
                <Lightbulb className="h-4 w-4" /> Next action
              </Button>
            </div>
          </div>
          {aiError && !aiInsight && (
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg">{aiError}</div>
          )}
          {aiInsight && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wide text-purple-600 mb-1">
                {aiInsight.kind === 'summary' ? 'Summary' : 'Recommended next action'}
              </p>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{aiInsight.text}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - Sticky on mobile */}
      <div className="sticky top-14 z-30 bg-gray-50 py-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button size="sm" variant="success" onClick={openTel}>
            <Phone className="h-4 w-4" /> Call
          </Button>
          <Button size="sm" variant="outline" onClick={() => openWhatsApp('')}>
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowQuickMessage(!showQuickMessage)}>
            <Send className="h-4 w-4" /> Message
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowShareProp(!showShareProp)}>
            <Share2 className="h-4 w-4" /> Share Property
          </Button>
          <Button size="sm" variant="outline" onClick={() => showFollowUp ? setShowFollowUp(false) : prepareFollowUp('call', tomorrowMorning(), '')}>
            <Clock className="h-4 w-4" /> Follow-up
          </Button>
        </div>
      </div>

      {/* Quick Message Panel */}
      {showQuickMessage && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Select value={selectedTemplate} onChange={(e) => {
                setSelectedTemplate(e.target.value);
                const t = templateOptions.find((template) => template.id === e.target.value);
                if (t) setQuickMessage(fillFollowUpTemplate(t.message, leadVars));
              }}>
                <option value="">Custom message...</option>
                {templateOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            <Textarea value={quickMessage} onChange={(e) => setQuickMessage(e.target.value)} rows={3} placeholder="Type your message..." />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" loading={busyKey === 'ai-draft'} loadingText="Drafting..." onClick={() => handleDraftMessage('whatsapp')}>
                <Sparkles className="h-4 w-4 text-purple-600" /> Draft with AI
              </Button>
              <Button size="sm" loading={busyKey === 'msg-whatsapp'} loadingText="Sending..." onClick={() => handleSendMessage('whatsapp')}>Send WhatsApp</Button>
              <Button size="sm" variant="outline" onClick={() => openWhatsApp()}>
                <ExternalLink className="h-4 w-4" /> Open WhatsApp
              </Button>
              <Button size="sm" variant="outline" loading={busyKey === 'msg-sms'} loadingText="Sending..." onClick={() => handleSendMessage('sms')}>Send SMS</Button>
            </div>
            {aiError && <p className="text-xs text-red-600">{aiError}</p>}
            {messageError && <p className="text-xs text-red-600">{messageError}</p>}
          </CardContent>
        </Card>
      )}

      {/* Share Property Panel */}
      {showShareProp && recommendedProperties.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Share Property</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recommendedProperties.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.location} · {formatCurrency(p.price)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" loading={busyKey === `share-wa-${p.id}`}
                    onClick={() => handlePropertyShare(p, 'whatsapp')}>
                    {busyKey === `share-wa-${p.id}` ? null : <MessageSquare className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="icon-sm" variant="ghost" title="Open WhatsApp" loading={busyKey === `share-link-${p.id}`}
                    onClick={() => handleOpenPropertyWhatsApp(p)}>
                    {busyKey === `share-link-${p.id}` ? null : <ExternalLink className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="icon-sm" variant="ghost" loading={busyKey === `share-em-${p.id}`}
                    onClick={() => handlePropertyShare(p, 'email')}>
                    {busyKey === `share-em-${p.id}` ? null : <Mail className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Follow-up Panel */}
      {showFollowUp && (
        <Card>
          <CardContent className="p-4">
            <form action={async (formData) => {
              await createFollowUp(lead.id, null, formData);
              setShowFollowUp(false);
              setFollowUpMessage('');
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select name="type" required value={followUpType} onChange={(e) => setFollowUpType(e.target.value as typeof followUpType)}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="call">Call</option>
                </Select>
                <Input name="scheduled_at" type="datetime-local" required value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
              </div>
              <Textarea name="message" placeholder="Follow-up message (optional)" rows={2} value={followUpMessage} onChange={(e) => setFollowUpMessage(e.target.value)} />
              <SubmitButton size="sm" loadingText="Scheduling...">Schedule Follow-up</SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Status / Temperature / Assignment Controls */}
      <div className="grid grid-cols-3 gap-2">
        <Select value={lead.status} onChange={(e) => updateLeadStatus(lead.id, e.target.value)}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={lead.temperature} onChange={(e) => updateLeadTemperature(lead.id, e.target.value)}>
          <option value="cold">Cold</option>
          <option value="warm">Warm</option>
          <option value="hot">Hot</option>
        </Select>
        <Select value={lead.assigned_agent_id || ''} onChange={(e) => assignLead(lead.id, e.target.value)}>
          <option value="">Unassigned</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
        </Select>
      </div>

      {/* Add Note */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleAddNote} size="sm" className="self-end" loading={busyKey === 'note'} loadingText="Adding...">Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Properties */}
      {recommendedProperties.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Recommended</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recommendedProperties.map((p) => (
              <Link key={p.id} href={`/properties/${p.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.location} · {p.bedrooms ? `${p.bedrooms} BHK` : ''}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.price)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {activities.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{a.user?.full_name} · {timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Properties */}
      {shares.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Shared Properties</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {shares.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{s.property?.title}</p>
                  <p className="text-xs text-gray-500">{s.property?.location} · {s.channel}</p>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(s.created_at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
