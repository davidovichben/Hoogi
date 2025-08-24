import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ 
  content, 
  children, 
  side = 'top' 
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="bg-primary text-primary-foreground shadow-lg border-primary/20">
        <p className="text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};