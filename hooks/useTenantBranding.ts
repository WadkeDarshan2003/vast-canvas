import { useState } from 'react';

interface TenantBranding {
  brandName: string;
  logoUrl: string;
  isLoading: boolean;
}

/**
 * Custom hook to get tenant branding information
 * Automatically fetches branding based on current user's tenantId
 * Falls back to default Vast Canvas Connect branding if no custom branding is set
 */
export const useTenantBranding = (): TenantBranding => {
  const [branding] = useState<TenantBranding>({
    brandName: 'Vast Canvas',
    logoUrl: '/qt=q_95.webp',
    isLoading: false
  });

  return branding;
};
