'use client';

import { useState } from 'react';
import { MapPin, Clock, LogIn, LogOut, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkIn, checkOut } from '@/app/actions/attendance';
import type { Profile } from '@/types';

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-yellow-100 text-yellow-800',
  absent: 'bg-red-100 text-red-800',
  half_day: 'bg-orange-100 text-orange-800',
  on_leave: 'bg-blue-100 text-blue-800',
};

interface Props {
  profile: Profile;
  todayRecord: any;
  todayAll: any[];
  recentHistory: any[];
}

export function AttendancePage({ profile, todayRecord, todayAll, recentHistory }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isCheckedIn = todayRecord && !todayRecord.check_out_time;

  async function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  async function handleCheckIn() {
    setLoading(true);
    setError('');
    const { lat, lng } = await getLocation();
    const result = await checkIn(lat, lng);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  async function handleCheckOut() {
    setLoading(true);
    setError('');
    const { lat, lng } = await getLocation();
    const result = await checkOut(lat, lng);
    if (result.error) setError(result.error);
    setLoading(false);
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Attendance</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      {/* Check-in/out Card */}
      <Card className="border-2 border-blue-100">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Clock className="h-5 w-5" />
            <span className="text-lg font-mono">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {todayRecord && (
            <div className="text-sm text-gray-500">
              Checked in at {new Date(todayRecord.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              {todayRecord.check_out_time && (
                <> · Out at {new Date(todayRecord.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</>
              )}
            </div>
          )}

          {!todayRecord ? (
            <Button size="lg" className="w-full max-w-xs" onClick={handleCheckIn} loading={loading} loadingText="Getting location...">
              <LogIn className="h-5 w-5" /> Check In
            </Button>
          ) : isCheckedIn ? (
            <Button size="lg" variant="outline" className="w-full max-w-xs" onClick={handleCheckOut} loading={loading} loadingText="Getting location...">
              <LogOut className="h-5 w-5" /> Check Out
            </Button>
          ) : (
            <Badge className="bg-green-100 text-green-800 text-sm px-4 py-2">Day Complete</Badge>
          )}
        </CardContent>
      </Card>

      {/* Team Status (Admin view) */}
      {(profile.role === 'admin' || profile.role === 'sales_manager') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Team Today</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAll.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No check-ins today</p>
            ) : (
              <div className="space-y-2">
                {todayAll.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">{a.user?.full_name}</p>
                      <p className="text-xs text-gray-500">
                        In: {new Date(a.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {a.check_out_time && <> · Out: {new Date(a.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</>}
                      </p>
                    </div>
                    <Badge className={statusColors[a.status]}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My History */}
      <Card>
        <CardHeader><CardTitle>My Recent Attendance</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentHistory.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between text-sm p-2 border-b last:border-0">
                <span className="text-gray-600">
                  {new Date(a.check_in_time).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(a.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {a.check_out_time ? ` — ${new Date(a.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ' (active)'}
                </span>
                <Badge className={statusColors[a.status]}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
