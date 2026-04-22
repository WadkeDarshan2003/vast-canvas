import React from 'react';
import ApprovalCard, { ApprovalCardProps } from './ApprovalCard';
import { Eye, ChevronRight } from 'lucide-react';

interface ClientApprovalCardProps extends ApprovalCardProps {
  onViewDetails?: () => void;
  showApprovalTimeline?: boolean;
  adminApprovalStatus?: 'pending' | 'approved' | 'rejected';
}

export const ClientApprovalCard: React.FC<ClientApprovalCardProps> = ({
  onViewDetails,
  showApprovalTimeline = true,
  adminApprovalStatus = 'pending',
  ...cardProps
}) => {
  return (
    <ApprovalCard {...cardProps}>
      <div className="flex items-center justify-between w-full gap-2">
        {/* Admin approval status indicator */}
        {showApprovalTimeline && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">Admin Status:</span>
            <span
              className={`px-2 py-1 rounded-full font-semibold ${
                adminApprovalStatus === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : adminApprovalStatus === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {adminApprovalStatus.charAt(0).toUpperCase() + adminApprovalStatus.slice(1)}
            </span>
          </div>
        )}

        {/* View Details button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.();
          }}
          className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1"
          title="View full details"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </ApprovalCard>
  );
};

export default ClientApprovalCard;
