import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Zap } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'review' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'pill' | 'square';
  className?: string;
}

const statusConfig = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: <Clock className="w-4 h-4" />,
    label: 'Pending'
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Approved'
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Rejected'
  },
  review: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'In Review'
  },
  urgent: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: <Zap className="w-4 h-4" />,
    label: 'Urgent'
  }
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  lg: {
    padding: 'px-4 py-1.5',
    text: 'text-base',
    icon: 'w-5 h-5'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  variant = 'pill',
  className = ''
}) => {
  const config = statusConfig[status];
  const sizeClasses = sizeConfig[size];
  const borderRadius = variant === 'pill' ? 'rounded-full' : 'rounded-md';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses.padding} ${borderRadius} font-semibold ${config.bg} ${config.text} ${sizeClasses.text} ${className}`}
    >
      {showIcon && <span className={sizeClasses.icon}>{config.icon}</span>}
      {config.label}
    </span>
  );
};

export default StatusBadge;
