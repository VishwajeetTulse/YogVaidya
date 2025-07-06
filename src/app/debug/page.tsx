'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/auth-client';
import { getUserDetails, getAllUsersDetails, UserDetails } from '@/lib/userDetails';
import { Database, Users, User, RefreshCw, Download, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function DebugPage() {
  const { data: session } = useSession();
  const [currentUser, setCurrentUser] = useState<UserDetails | null>(null);
  const [allUsers, setAllUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      // fetchCurrentUser();
      fetchAllUsers();
    }
  }, [session]);

  const fetchCurrentUser = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const result = await getUserDetails(session.user.id);
      if (result.success) {
        setCurrentUser(result.user || null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsersDetails();
      if (result.success) {
        setAllUsers(result.users || []);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (data: object, label: string) => {
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2))
      .then(() => toast.success(`${label} copied to clipboard!`))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const downloadJson = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  if (loading && !currentUser && allUsers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Loading debug information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="w-8 h-8 text-red-600" />
                Database Debug Console
              </h1>
              <p className="text-gray-600 mt-2">Complete database information for debugging purposes</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  fetchCurrentUser();
                  fetchAllUsers();
                }}
                variant="outline"
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button
                onClick={() => setShowRawData(!showRawData)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showRawData ? 'Hide' : 'Show'} Raw JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Current User Section */}
        {currentUser && (
          <Card className="p-6 mb-8 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Current User Details</h2>
                <Badge variant="secondary">You</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(currentUser, 'Current User Data')}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={() => downloadJson(currentUser, 'current_user')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="font-medium">{currentUser.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="font-medium">{currentUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Plan</label>
                <Badge className="bg-purple-100 text-purple-800">{currentUser.subscriptionPlan}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge 
                  className={currentUser.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {currentUser.subscriptionStatus}
                </Badge>
              </div>
            </div>

            {showRawData && (
              <div className="bg-gray-100 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(currentUser, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        )}

        {/* All Users Section */}
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold">All Users Database ({allUsers.length})</h2>
              <Badge variant="destructive">Admin View</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(allUsers, 'All Users Data')}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
              <Button
                onClick={() => downloadJson(allUsers, 'all_users')}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {allUsers.map((user) => (
              <div
                key={user.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedUser === user.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${user.id === currentUser?.id ? 'bg-yellow-50 border-yellow-300' : ''}`}
                onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                      {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {user.id === currentUser?.id && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Role:</span>
                    <Badge className="bg-indigo-100 text-indigo-800 text-xs">{user.role}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Plan:</span>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">{user.subscriptionPlan}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Status:</span>
                    <Badge 
                      className={`text-xs ${
                        user.subscriptionStatus === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.subscriptionStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Payment:</span>
                    <span className="font-medium">₹{user.paymentAmount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected User Details */}
          {selectedUser && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Detailed View</h3>
              {(() => {
                const user = allUsers.find(u => u.id === selectedUser);
                if (!user) return null;
                
                return (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">{user.name || 'Unnamed User'}</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(user, `User ${user.name}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => downloadJson(user, `user_${user.name || user.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white rounded p-4 max-h-96 overflow-auto">
                      <pre className="text-sm text-gray-800">
                        {JSON.stringify(user, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* System Summary */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">System Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-800">{allUsers.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-800">
                  {allUsers.filter(u => u.subscriptionStatus === 'ACTIVE').length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-800">
                  ₹{allUsers.reduce((sum, u) => sum + (u.paymentAmount || 0), 0)}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600">Trial Users</p>
                <p className="text-2xl font-bold text-orange-800">
                  {allUsers.filter(u => u.isTrialActive).length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

