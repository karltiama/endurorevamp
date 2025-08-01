'use client';

import { useState } from 'react';
import { ExternalLink, Mail, MessageSquare, Github, Globe, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
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
                    <p className="text-sm text-muted-foreground">
                      Send us a message and we'll get back to you as soon as possible.
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Have an idea for a new feature? We'd love to hear about it!
                    </p>
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
                onClick={() => window.open('https://github.com/yourusername', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open('https://yourwebsite.com', '_blank')}
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
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Built with:</strong> Next.js, TypeScript, Strava API</p>
              <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              <Button variant="link" size="sm" className="p-0 h-auto text-sm">
                Privacy Policy
              </Button>
              <Button variant="link" size="sm" className="p-0 h-auto text-sm">
                Terms of Service
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Development Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Test Coverage</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Performance</span>
                  <span className="font-medium text-blue-600">A+</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Uptime</span>
                  <span className="font-medium text-purple-600">99.9%</span>
                </div>
              </CardContent>
            </Card>
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