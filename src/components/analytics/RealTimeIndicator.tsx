'use client'

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface RealTimeIndicatorProps {
  isLive?: boolean;
  lastUpdated?: Date | null;
  className?: string;
}

export function RealTimeIndicator({ isLive = true, lastUpdated, className = '' }: RealTimeIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) {
        setTimeAgo('Just now');
        return;
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

      if (diffInSeconds < 60) {
        setTimeAgo('Just now');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeAgo(`${hours}h ago`);
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        setTimeAgo(`${days}d ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isLive ? (
        <>
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <Badge variant="outline" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Auto-refresh
          </Badge>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <Badge variant="secondary" className="text-xs">
            Manual
          </Badge>
        </>
      )}
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Updated {timeAgo}
        </span>
      )}
    </div>
  );
}
