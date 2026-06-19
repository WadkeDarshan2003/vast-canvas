import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Building2 } from 'lucide-react';

interface FirmSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

const FirmSwitcher: React.FC<FirmSwitcherProps> = ({ isOpen, onClose }) => {
  const { currentTenant } = useAuth();
  const { addNotification } = useNotifications();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] transition-opacity"
          onClick={onClose}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Switch Firm</h2>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="w-full text-left px-4 py-3 rounded-lg bg-blue-100 text-blue-900 border-2 border-blue-500">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{currentTenant?.name || 'Vast Canvas'}</span>
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FirmSwitcher;
