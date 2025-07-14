import React from 'react';
import { Button } from './ui/button';

interface TaskButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  className?: string;
}

export const TaskButton: React.FC<TaskButtonProps> = ({
  onClick,
  children,
  variant = 'default',
  disabled = false,
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Enhanced button interaction handling
    if (!disabled && onClick) {
      try {
        onClick();
      } catch (error) {
        console.error('TaskButton click error:', error);
      }
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      disabled={disabled}
      className={`transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      role="button"
      tabIndex={0}
      aria-label={typeof children === 'string' ? children : 'Task button'}
    >
      {children}
    </Button>
  );
};

export default TaskButton; 