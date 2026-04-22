import React from 'react';
import ApprovalCard, { ApprovalCardProps } from './ApprovalCard';
import { CheckCircle, XCircle, MoreVertical, Eye } from 'lucide-react';

interface AdminApprovalCardProps extends ApprovalCardProps {
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
  isProcessing?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
}

export const AdminApprovalCard: React.FC<AdminApprovalCardProps> = ({
  onApprove,
  onReject,
  onViewDetails,
  isProcessing = false,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  ...cardProps
}) => {
  return (
    <ApprovalCard {...cardProps}>
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onApprove?.();
          }}
          disabled={isProcessing}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
            isProcessing
              ? 'bg-green-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
          }`}
          title="Approve this item"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{approveLabel}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onReject?.();
          }}
          disabled={isProcessing}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
            isProcessing
              ? 'bg-red-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
          }`}
          title="Reject this item"
        >
          <XCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{rejectLabel}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.();
          }}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-200 transition-colors"
          title="View more details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </ApprovalCard>
  );
};

export default AdminApprovalCard;
