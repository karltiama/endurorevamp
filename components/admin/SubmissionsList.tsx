'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Lightbulb, Mail, Eye } from 'lucide-react';

interface Submission {
  id: string;
  type: 'contact' | 'suggestion' | 'bug_report' | 'general';
  title?: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'in_progress' | 'responded' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  category?: string;
  admin_notes?: string;
}

interface SubmissionsListProps {
  submissions: Submission[];
  loading: boolean;
  onStatusUpdate: (id: string, status: string) => void;
  onRefresh: () => void;
}

export function SubmissionsList({ submissions, loading, onStatusUpdate, onRefresh }: SubmissionsListProps) {
  const [adminNotes, setAdminNotes] = useState('');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contact': return <MessageSquare className="h-4 w-4" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'responded': return 'default';
      case 'resolved': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await onStatusUpdate(id, status);
    onRefresh();
  };

  const handleReply = (submission: Submission) => {
    // Open email client with pre-filled content
    const subject = submission.type === 'suggestion' 
      ? `Re: ${submission.title}` 
      : 'Re: Your message to Enduro Revamp';
    
    const body = `Hi ${submission.name},\n\nThank you for your ${submission.type === 'suggestion' ? 'feature suggestion' : 'message'}.\n\nBest regards,\nEnduro Revamp Team`;
    
    window.open(`mailto:${submission.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No submissions found</h3>
          <p className="text-muted-foreground">
            No form submissions yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(submission.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {submission.type === 'suggestion' && submission.title 
                        ? submission.title 
                        : `${submission.name} - ${submission.type}`
                      }
                    </h3>
                    <Badge variant={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                    <Badge variant={getPriorityColor(submission.priority)}>
                      {submission.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From: {submission.name} ({submission.email})
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(submission.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-relaxed">
              {submission.message.length > 200 
                ? `${submission.message.substring(0, 200)}...` 
                : submission.message
              }
            </p>
            
            {submission.admin_notes && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                <p className="text-xs">{submission.admin_notes}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Full
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {submission.type === 'suggestion' && submission.title 
                      ? submission.title 
                      : `${submission.name} - ${submission.type}`
                    }
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">From:</p>
                    <p className="text-sm">{submission.name} ({submission.email})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Message:</p>
                    <p className="text-sm whitespace-pre-wrap">{submission.message}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <Textarea
                      placeholder="Add internal notes..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleReply(submission)}
            >
              <Mail className="h-4 w-4 mr-1" />
              Reply
            </Button>

            <Select 
              value={submission.status} 
              onValueChange={(value) => handleStatusUpdate(submission.id, value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 