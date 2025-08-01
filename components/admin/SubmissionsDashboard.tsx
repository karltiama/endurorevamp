'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmissionsList } from './SubmissionsList';
import { MessageSquare, Lightbulb, Clock, CheckCircle } from 'lucide-react';

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
}

interface Stats {
  total: number;
  pending: number;
  contact: number;
  suggestions: number;
}

export function SubmissionsDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, contact: 0, suggestions: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'contact' | 'suggestion'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'responded'>('all');

  useEffect(() => {
    fetchSubmissions();
  }, [activeTab, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('type', activeTab);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/submissions?${params}`);
      const data = await response.json();
      
      setSubmissions(data.submissions || []);
      
      // Calculate stats
      const allSubmissions = data.submissions || [];
      setStats({
        total: allSubmissions.length,
        pending: allSubmissions.filter((s: Submission) => s.status === 'pending').length,
        contact: allSubmissions.filter((s: Submission) => s.type === 'contact').length,
        suggestions: allSubmissions.filter((s: Submission) => s.type === 'suggestion').length,
      });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      if (response.ok) {
        // Refresh submissions
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Failed to update submission:', error);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (activeTab !== 'all' && submission.type !== activeTab) return false;
    if (statusFilter !== 'all' && submission.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Forms</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contact}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Suggestions</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suggestions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Submissions</TabsTrigger>
            <TabsTrigger value="contact">Contact Forms</TabsTrigger>
            <TabsTrigger value="suggestion">Feature Suggestions</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      <SubmissionsList 
        submissions={filteredSubmissions}
        loading={loading}
        onStatusUpdate={updateSubmissionStatus}
        onRefresh={fetchSubmissions}
      />
    </div>
  );
} 