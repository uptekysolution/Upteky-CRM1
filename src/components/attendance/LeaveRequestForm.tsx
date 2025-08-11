'use client'

import React, { useState } from 'react';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format, addDays, isBefore, isAfter, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { LeaveRequestFormData, LeaveType } from '@/types/leave';
import { useToast } from '@/hooks/use-toast';

interface LeaveRequestFormProps {
  onSubmit: (data: LeaveRequestFormData) => Promise<void>;
  isLoading?: boolean;
  monthlyLeaveUsed?: number;
  maxMonthlyLeave?: number;
}

const LEAVE_TYPES: { value: LeaveType; label: string; description: string }[] = [
  {
    value: 'monthly',
    label: 'Monthly Leave',
    description: 'Regular monthly leave allowance (max 2 days per month)'
  },
  {
    value: 'emergency',
    label: 'Emergency/Medical',
    description: 'For medical emergencies or urgent personal matters'
  },
  {
    value: 'miscellaneous',
    label: 'Miscellaneous',
    description: 'Other personal or professional reasons'
  }
];

export function LeaveRequestForm({ 
  onSubmit, 
  isLoading = false,
  monthlyLeaveUsed = 0,
  maxMonthlyLeave = 2
}: LeaveRequestFormProps) {
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    leaveType: 'monthly',
    startDate: new Date(),
    endDate: new Date(),
    reason: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate dates
    if (isBefore(formData.startDate, today)) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    if (isBefore(formData.endDate, formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Validate monthly leave limits
    if (formData.leaveType === 'monthly') {
      const daysRequested = differenceInDays(formData.endDate, formData.startDate) + 1;
      const totalDays = monthlyLeaveUsed + daysRequested;
      
      if (totalDays > maxMonthlyLeave) {
        newErrors.leaveType = `Monthly leave limit exceeded. You have ${monthlyLeaveUsed}/${maxMonthlyLeave} days used. Requesting ${daysRequested} more days would exceed the limit.`;
      }
    }

    // Validate reason
    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for your leave request';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
      });
      return;
    }

    try {
      await onSubmit(formData);
      toast({
        title: 'Leave Request Submitted',
        description: 'Your leave request has been submitted successfully and is pending approval.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Failed to submit leave request. Please try again.',
      });
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (!date) return;
    
    setFormData(prev => {
      const newData = { ...prev, [field]: date };
      
      // Auto-adjust end date if start date is after end date
      if (field === 'startDate' && isAfter(date, prev.endDate)) {
        newData.endDate = date;
      }
      
      return newData;
    });
    
    // Clear date-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getDaysRequested = () => {
    return differenceInDays(formData.endDate, formData.startDate) + 1;
  };

  const getMonthlyLeaveStatus = () => {
    if (formData.leaveType !== 'monthly') return null;
    
    const daysRequested = getDaysRequested();
    const totalDays = monthlyLeaveUsed + daysRequested;
    const remainingDays = maxMonthlyLeave - totalDays;
    
    return {
      used: monthlyLeaveUsed,
      requested: daysRequested,
      total: totalDays,
      remaining: remainingDays,
      willExceed: totalDays > maxMonthlyLeave
    };
  };

  const monthlyStatus = getMonthlyLeaveStatus();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Request Leave
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(value: LeaveType) => {
                setFormData(prev => ({ ...prev, leaveType: value }));
                if (errors.leaveType) {
                  setErrors(prev => ({ ...prev, leaveType: '' }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveType && (
              <p className="text-sm text-destructive">{errors.leaveType}</p>
            )}
            
            {/* Monthly Leave Status */}
            {monthlyStatus && (
              <Alert className={cn(
                "mt-2",
                monthlyStatus.willExceed ? "border-destructive" : "border-blue-200"
              )}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Monthly Leave Status: {monthlyStatus.used} used, {monthlyStatus.requested} requested 
                  ({monthlyStatus.remaining >= 0 ? `${monthlyStatus.remaining} remaining` : `${Math.abs(monthlyStatus.remaining)} over limit`})
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleDateChange('startDate', date)}
                    disabled={(date) => isBefore(date, new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => handleDateChange('endDate', date)}
                    disabled={(date) => isBefore(date, formData.startDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Days Requested Display */}
          <div className="text-sm text-muted-foreground">
            Days requested: {getDaysRequested()} day{getDaysRequested() !== 1 ? 's' : ''}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for your leave request..."
              value={formData.reason}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, reason: e.target.value }));
                if (errors.reason) {
                  setErrors(prev => ({ ...prev, reason: '' }));
                }
              }}
              rows={4}
              className={cn(errors.reason && "border-destructive")}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters required
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
