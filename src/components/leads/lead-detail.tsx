'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone, MessageSquare, Mail, ArrowLeft, Building2, Clock, Send,
  Share2, Flame, ChevronDown, Pencil
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
import { sendFollowUpMessage, createFollowUp } from '@/app/actions/followups';
import { shareProperty } from '@/app/actions/properties';

interface LeadDetailProps {
  lead: any;
  activities: any[];
  followups: any[];
  shares: any[];
  agents: { id: string; full_name: string }[];
  recommendedProperties: any[];
  templates: any[];
}

export function LeadDetail({ lead, activities, followups, shares, agents, recommendedProperties, templates }: LeadDetailProps) {
  const [note, setNote] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showShareProp, setShowShareProp] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  async function handleAddNote() {
    if (!note.trim()) return;
    await addLeadNote(lead.id, note);
    setNote('');
  }

  async function handleSendMessage(channel: 'whatsapp' | 'sms') {
    if (!quickMessage.trim()) return;
    await sendFollowUpMessage(lead.id, quickMessage, channel);
    setQuickMessage('');
    setShowQuickMessage(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      {/* Back + Header */}
      <div className="flex items-center gap-2">
        <Link href="/leads"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{lead.full_name}</h1>
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

      {/* Quick Actions - Sticky on mobile */}
      <div className="sticky top-14 z-30 bg-gray-50 py-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button size="sm" variant="success" onClick={() => window.open(`tel:${lead.phone}`)}>
            <Phone className="h-4 w-4" /> Call
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/${lead.phone.replace('+', '')}`)}>
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowQuickMessage(!showQuickMessage)}>
            <Send className="h-4 w-4" /> Message
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowShareProp(!showShareProp)}>
            <Share2 className="h-4 w-4" /> Share Property
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowFollowUp(!showFollowUp)}>
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
                const t = templates.find((t: any) => t.id === e.target.value);
                if (t) setQuickMessage(t.message);
              }}>
                <option value="">Custom message...</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            <Textarea value={quickMessage} onChange={(e) => setQuickMessage(e.target.value)} rows={2} placeholder="Type your message..." />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSendMessage('whatsapp')}>Send WhatsApp</Button>
              <Button size="sm" variant="outline" onClick={() => handleSendMessage('sms')}>Send SMS</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Property Panel */}
      {showShareProp && recommendedProperties.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Share Property</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recommendedProperties.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.location} · {formatCurrency(p.price)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => shareProperty(lead.id, p.id, 'whatsapp')}>
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => shareProperty(lead.id, p.id, 'email')}>
                    <Mail className="h-3.5 w-3.5" />
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
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select name="type" required>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="call">Call</option>
                </Select>
                <Input name="scheduled_at" type="datetime-local" required />
              </div>
              <Textarea name="message" placeholder="Follow-up message (optional)" rows={2} />
              <Button type="submit" size="sm">Schedule Follow-up</Button>
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
            <Button onClick={handleAddNote} size="sm" className="self-end">Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Properties */}
      {recommendedProperties.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Recommended</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recommendedProperties.map((p: any) => (
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
              {activities.map((a: any) => (
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
            {shares.map((s: any) => (
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
