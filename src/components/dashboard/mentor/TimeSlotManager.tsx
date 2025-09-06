'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Users, 
  IndianRupee, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  sessionType: 'YOGA' | 'MEDITATION' | 'DIET';
  maxStudents: number;
  currentStudents: number;
  isBooked: boolean;
  bookedBy: string | null;
  price: number;
  notes: string;
  isRecurring: boolean;
  recurringDays: string[];
  isActive: boolean;
}

export default function MentorTimeSlotManager() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    sessionType: 'YOGA' as 'YOGA' | 'MEDITATION' | 'DIET',
    maxStudents: 1,
    price: '',
    notes: '',
    isRecurring: false,
    recurringDays: [] as string[],
  });

  // Fetch time slots
  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mentor/timeslots');
      const result = await response.json();
      
      if (result.success) {
        setTimeSlots(result.data);
      } else {
        toast.error('Failed to fetch time slots');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error('Failed to fetch time slots');
    } finally {
      setLoading(false);
    }
  };

  // Create time slot
  const createTimeSlot = async () => {
    try {
      if (!formData.startTime || !formData.endTime) {
        toast.error('Please select start and end times');
        return;
      }

      setLoading(true);
      
      const response = await fetch('/api/mentor/timeslots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: formData.startTime,
          endTime: formData.endTime,
          sessionType: formData.sessionType,
          maxStudents: formData.maxStudents,
          price: formData.price ? parseFloat(formData.price) : undefined,
          notes: formData.notes,
          isRecurring: formData.isRecurring,
          recurringDays: formData.recurringDays,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Time slot created successfully!');
        setShowCreateForm(false);
        setFormData({
          startTime: '',
          endTime: '',
          sessionType: 'YOGA',
          maxStudents: 1,
          price: '',
          notes: '',
          isRecurring: false,
          recurringDays: [],
        });
        fetchTimeSlots(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to create time slot');
      }
    } catch (error) {
      console.error('Error creating time slot:', error);
      toast.error('Failed to create time slot');
    } finally {
      setLoading(false);
    }
  };

  // Format date and time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Get session type color
  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'YOGA': return 'bg-blue-100 text-blue-800';
      case 'MEDITATION': return 'bg-purple-100 text-purple-800';
      case 'DIET': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Slot Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your available time slots for students to book</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Time Slot
        </Button>
      </div>

      {/* Create Time Slot Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create New Time Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date and Time */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="startTime">Start Date & Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Date & Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    min={formData.startTime}
                  />
                </div>
              </div>

              {/* Session Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select 
                    value={formData.sessionType} 
                    onValueChange={(value: 'YOGA' | 'MEDITATION' | 'DIET') => 
                      setFormData(prev => ({ ...prev, sessionType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YOGA">Yoga</SelectItem>
                      <SelectItem value="MEDITATION">Meditation</SelectItem>
                      <SelectItem value="DIET">Diet Planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxStudents">Maximum Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) - Optional</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Leave empty to use default price"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or notes for this time slot..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={createTimeSlot} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Time Slot
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Time Slots</h2>
        
        {loading && timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading time slots...</p>
          </div>
        ) : timeSlots.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Slots Created</h3>
              <p className="text-gray-600 mb-4">Create your first time slot to start accepting bookings from students.</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Time Slot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeSlots.map((slot) => {
              const startDateTime = formatDateTime(slot.startTime);
              const endDateTime = formatDateTime(slot.endTime);
              
              return (
                <Card key={slot._id} className={`${!slot.isActive ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getSessionTypeColor(slot.sessionType)}>
                        {slot.sessionType}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {slot.isBooked ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {slot.isBooked ? 'Booked' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Date & Time */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{startDateTime.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{startDateTime.time} - {endDateTime.time}</span>
                      </div>
                    </div>

                    {/* Students & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{slot.currentStudents}/{slot.maxStudents}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                        <span>₹{slot.price}</span>
                      </div>
                    </div>

                    {/* Booked by */}
                    {slot.isBooked && slot.bookedBy && (
                      <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700">Booked by student</span>
                      </div>
                    )}

                    {/* Notes */}
                    {slot.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {slot.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        disabled={slot.isBooked}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        disabled={slot.isBooked}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
