import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { STATUS_COLORS } from '../utils/colorUtils';

export interface ApprovalCardProps {
  title: string;
  projectName: string;
  type: 'task' | 'document' | 'plan';
  status: 'pending' | 'approved' | 'rejected' | 'review';
  phase?: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  daysLeft?: number;
  packageColor: string; // 'pink' | 'orange' | 'teal' | 'indigo'
  children?: React.ReactNode; // For action buttons or additional content
  onClick?: () => void;
}

// Status icon selector
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    case 'review':
      return <AlertCircle className="w-4 h-4" />;
    case 'pending':
    default:
      return <Clock className="w-4 h-4" />;
  }
};

// Package color to tailwind mapping
const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  pink: { border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-700' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  teal: { border: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' },
  indigo: { border: 'border-indigo-800', bg: 'bg-indigo-50', text: 'text-indigo-900' },
};

const statusColorMap: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'text-yellow-600' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-600' },
  review: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
};

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  title,
  projectName,
  type,
  status,
  phase,
  assignee,
  dueDate,
  daysLeft,
  packageColor,
  children,
  onClick,
}) => {
  const colors = colorMap[packageColor] || colorMap.orange;
  const statusColors = statusColorMap[status];

  // Format type label
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div
      onClick={onClick}
      className={`flex flex-col border-l-4 ${colors.border} ${colors.bg} bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
    >
      {/* Header with left colored border */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Project name and status */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold ${colors.text} truncate`}>{projectName}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text} text-xs font-semibold`}>
              <span className={statusColors.icon}>
                {getStatusIcon(status)}
              </span>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          {/* Title */}
          <h4 className="text-sm font-semibold text-gray-900 truncate">{title}</h4>
        </div>
      </div>

      {/* Timeline / Phase info */}
      {phase && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-600">{phase}</p>
        </div>
      )}

      {/* Content area - Assignee, Due Date */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        {/* Assignee */}
        {assignee && (
          <div className="flex items-center gap-2 min-w-0">
            {assignee.avatar ? (
              <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
                {assignee.name.charAt(0)}
              </div>
            )}
            <span className="text-sm text-gray-700 truncate">{assignee.name}</span>
          </div>
        )}

        {/* Due date and days left */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          {dueDate && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Due:</span>
              <span>{dueDate}</span>
            </div>
          )}
          {daysLeft !== undefined && (
            <div className={`font-semibold ${daysLeft < 3 ? 'text-red-600' : 'text-gray-600'}`}>
              {daysLeft} days left
            </div>
          )}
        </div>
      </div>

      {/* Action buttons or custom content */}
      {children && (
        <div className="px-4 py-3 bg-gray-50 flex items-center justify-between gap-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default ApprovalCard;
