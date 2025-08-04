'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Mail, MessageSquare, Github, Globe, FileText, Heart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Import tech stack icons from react-icons
import { 
  SiNextdotjs, 
  SiTypescript, 
  SiReact, 
  SiSupabase, 
  SiReactquery, 
  SiTailwindcss 
} from 'react-icons/si';

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
          description: suggestionForm.description,
          category: 'feature_request'
        })
      });

      if (response.ok) {
        setSuggestionForm({ title: '', description: '' });
        // TODO: Show success message
      } else {
        // TODO: Show error message
        console.error('Failed to submit suggestion form');
      }
    } catch (error) {
      console.error('Suggestion form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Contact & Support */}
          <div className="space-y-4">
            {/* Enduro Stats Branding */}
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold">Enduro Stats</span>
            </div>
            <p className="text-gray-400 mb-4">
              Unlock deeper insights from your Strava data and take your running to the next level.
            </p>
            
            <h3 className="text-lg font-semibold text-white">Contact & Support</h3>
            <div className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white">
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
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
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
                  <Button variant="outline" size="sm" className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white">
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
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={suggestionForm.description}
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, description: e.target.value })}
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
            <h3 className="text-lg font-semibold text-white">Developer</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => window.open('https://github.com/karltiama', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => window.open('https://karltiama.dev', '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Personal Website
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => window.open('https://www.karltiama.dev/blog/enduro-refactor', '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Behind the Scenes: Building Enduro Stats
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </div>
          </div>

                     <div className="space-y-4">
             <h3 className="text-lg font-semibold text-white">App Info</h3>
             <div className="space-y-2 text-sm text-gray-400">
               <p><strong>Version:</strong> 2.0.0</p>
               <div className="flex items-center space-x-2">
                 <span className="font-semibold">Built with:</span>
                 <div className="flex space-x-2">
                                       <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer hover:scale-110 transition-transform">
                            <SiNextdotjs className="w-6 h-6" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Next.js 15</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer hover:scale-110 transition-transform">
                            <SiTypescript className="w-6 h-6" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>TypeScript</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer hover:scale-110 transition-transform">
                            <SiReact className="w-6 h-6" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>React 19</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer hover:scale-110 transition-transform">
                            <SiSupabase className="w-6 h-6" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Supabase</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer hover:scale-110 transition-transform">
                            <SiReactquery className="w-6 h-6" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>React Query</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer hover:scale-110 transition-transform">
                            <SiTailwindcss className="w-6 h-6" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Tailwind CSS</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                 </div>
               </div>
               <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
             </div>
             <div className="space-y-2">
               <Button variant="link" size="sm" className="h-auto text-sm text-gray-400 hover:text-white" asChild>
                 <Link href="/privacy">Privacy Policy</Link>
               </Button>
               <Button variant="link" size="sm" className="h-auto text-sm text-gray-400 hover:text-white" asChild>
                 <Link href="/terms">Terms of Service</Link>
               </Button>
             </div>
           </div>

          
        </div>

        <Separator className="my-6 bg-gray-800" />
        
        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Built with passion for the fitness community</span>
          </div>
          <div className="mt-2 sm:mt-0">
            <span>&copy; 2024 Enduro Stats. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
} 