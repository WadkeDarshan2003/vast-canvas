import React from 'react';
import { useTenantBranding } from '../hooks/useTenantBranding';

/**
 * Simple debug component to test tenant branding
 * Add this to any page to see current branding values
 */
export const BrandingDebug: React.FC = () => {
  const { brandName, logoUrl, isLoading } = useTenantBranding();

  return (
    <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-50 text-xs">
      <h4 className="font-bold text-gray-800 mb-1">Current Branding:</h4>
      <div className="space-y-1">
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Brand:</strong> {brandName}</div>
        <div className="flex items-center gap-2">
          <strong>Logo:</strong>
          <img src={logoUrl} alt={brandName} className="w-4 h-4 rounded" />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          URL: {logoUrl}
        </div>
      </div>
    </div>
  );
};
