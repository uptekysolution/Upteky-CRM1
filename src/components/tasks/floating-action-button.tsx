'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onNewTask: () => void;
  onNewMeeting: () => void;
  className?: string;
}

export function FloatingActionButton({ onNewTask, onNewMeeting, className }: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Expanded buttons */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3">
          <Button
            onClick={onNewTask}
            className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            title="Create New Task"
          >
            <CheckSquare className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={onNewMeeting}
            className="h-12 w-12 rounded-full shadow-lg bg-green-600 hover:bg-green-700 transition-all duration-200"
            title="Schedule New Meeting"
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main button */}
      <Button
        onClick={toggleExpanded}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
          isExpanded 
            ? "bg-red-600 hover:bg-red-700 rotate-45" 
            : "bg-primary hover:bg-primary/90"
        )}
        title={isExpanded ? "Close" : "Create New"}
      >
        {isExpanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
