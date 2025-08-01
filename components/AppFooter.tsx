'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Mail, MessageSquare, Github, Globe, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function AppFooter() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [suggestionForm, setSuggestionForm] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
          category: 'general_inquiry'
        })
      });

      if (response.ok) {
        setContactForm({ name: '', email: '', message: '' });
        // TODO: Show success message
      } else {
        // TODO: Show error message
        console.error('Failed to submit contact form');
      }
    } catch (error) {
      console.error('Contact form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggestion',
          title: suggestionForm.title,
          name: 'Anonymous', // You might want to add name field to suggestion form
          email: 'anonymous@example.com', // You might want to add email field
          message: suggestionForm.description,
          category: 'feature_request'
        })
      });

      if (response.ok) {
        setSuggestionForm({ title: '', description: '' });
        // TODO: Show success message
      } else {
        // TODO: Show error message
        console.error('Failed to submit suggestion');
      }
    } catch (error) {
      console.error('Suggestion form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact & Support</h3>
            <div className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Us
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Contact Us</DialogTitle>
                    <DialogDescription>
                      Send us a message and we&apos;ll get back to you as soon as possible.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Suggest Feature
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Suggest a Feature</DialogTitle>
                    <DialogDescription>
                      Have an idea for a new feature? We&apos;d love to hear about it!
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Feature Title</Label>
                      <Input
                        id="title"
                        value={suggestionForm.title}
                        onChange={(e) => setSuggestionForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={suggestionForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSuggestionForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Describe the feature you'd like to see..."
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Developer Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Developer</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://github.com/karltiama', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://karltiama.dev', '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Personal Website
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://yourwebsite.com/building-enduro-revamp', '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                How I Built This
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </div>
          </div>

          {/* App Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">App Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Version:</strong> 2.0.0</p>
              {/* TODO: Add Icons of each technology */}
              <p><strong>Built with:</strong> Next.js 15, TypeScript, React 19, Supabase, React Query, Tailwind</p>
              <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              <Button variant="link" size="sm" className="h-auto text-sm" asChild>
                <Link href="/privacy">Privacy Policy</Link>
              </Button>
              <Button variant="link" size="sm" className="h-auto text-sm" asChild>
                <Link href="/terms">Terms of Service</Link>
              </Button>
            </div>
          </div>

          
        </div>

        <Separator className="my-6" />
        
        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Built with passion for the fitness community</span>
          </div>
          <div className="mt-2 sm:mt-0">
            <span>&copy; 2024 Enduro Revamp. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
} 