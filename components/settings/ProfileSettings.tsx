'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, User, Mail, Calendar } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export function ProfileSettings() {
  const { user } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Initialize name value when user data loads
  useEffect(() => {
    if (user) {
      setNameValue(user.user_metadata?.full_name || '');
    }
  }, [user]);

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setNameValue(user?.user_metadata?.full_name || '');
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!user) return;

    setIsSavingName(true);
    try {
      const response = await fetch('/api/user/update-name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nameValue }),
      });

      if (response.ok) {
        setIsEditingName(false);
        // Optionally refresh the page or update the user context
        window.location.reload();
      } else {
        console.error('Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setIsSavingName(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Display Name
          </label>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                placeholder="Enter your name"
                className="flex-1"
                disabled={isSavingName}
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={isSavingName || !nameValue.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-3 w-3 mr-1" />
                {isSavingName ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSavingName}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {user?.user_metadata?.full_name || 'No name set'}
                </span>
                {!user?.user_metadata?.full_name && (
                  <Badge variant="secondary" className="text-xs">
                    Not set
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditName}
                className="h-6 w-6 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Email Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{user?.email || 'No email'}</span>
            <Badge variant="secondary" className="text-xs">
              {user?.app_metadata?.provider || 'email'}
            </Badge>
          </div>
        </div>

        {/* Account Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Account Information
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Member since{' '}
                {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Sign-in method:{' '}
                {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
              </span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium mb-1">💡 About your profile:</p>
          <ul className="space-y-1">
            <li>• Your name is used throughout the app for personalization</li>
            <li>• Email and sign-in method cannot be changed here</li>
            <li>• Profile changes are saved automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
