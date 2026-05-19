'use client';

import Link from 'next/link';
import { Plus, Camera, Globe, Briefcase, Film, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { updateSocialPostStatus, deleteSocialPost } from '@/app/actions/social';

const typeIcons: Record<string, any> = {
  instagram_reel: Film,
  instagram_post: Camera,
  facebook_post: Globe,
  linkedin_post: Briefcase,
  story: Image,
};

const statusColors: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-800',
  draft: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
};

export function SocialCalendar({ posts }: { posts: any[] }) {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Social Media</h1>
        <Link href="/social/new">
          <Button size="sm"><Plus className="h-4 w-4" /> New Post</Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'idea', 'draft', 'scheduled', 'published'].map(s => (
          <Badge key={s} variant="outline" className="cursor-pointer capitalize whitespace-nowrap">{s}</Badge>
        ))}
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No social posts"
          description="Plan your content calendar"
          action={<Link href="/social/new"><Button size="sm">Create Post</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const Icon = typeIcons[post.post_type] || Image;
            return (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 line-clamp-2">{post.caption}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={statusColors[post.status]}>{post.status}</Badge>
                        <span className="text-[10px] text-gray-400 capitalize">{post.post_type.replace('_', ' ')}</span>
                        {post.scheduled_at && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(post.scheduled_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {post.assignee && <span className="text-[10px] text-gray-400">· {post.assignee.full_name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {post.status !== 'published' && (
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => {
                          const next = post.status === 'idea' ? 'draft' : post.status === 'draft' ? 'scheduled' : 'published';
                          updateSocialPostStatus(post.id, next);
                        }}>
                          {post.status === 'idea' ? 'Draft' : post.status === 'draft' ? 'Schedule' : 'Publish'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
