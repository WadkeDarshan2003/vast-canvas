import React, { useState } from 'react';
import { Plan, ProjectPackage, Role } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlanCrud } from '../hooks/useCrud';
import { X, Check, ArrowRight, Loader } from 'lucide-react';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
  onSave: (updatedPlan: Plan) => void;
}

const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ isOpen, onClose, plan, onSave }) => {
  const { addNotification } = useNotifications();
  const { updateExistingPlan } = usePlanCrud();
  const [selectedPackage, setSelectedPackage] = useState<ProjectPackage>(plan.packageType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const packagesInfo = [
    {
      type: ProjectPackage.PACKAGE_20,
      name: 'Starter Plan',
      creativeQuota: 20,
      price: 18000,
      color: '#E91E63',
      bgColor: '#FCE4EC',
      textColor: '#E91E63',
      features: ['Up to 20 creatives', 'Email support', 'Basic analytics', '5-7 working days delivery'],
      description: 'Perfect for small firms starting their journey.'
    },
    {
      type: ProjectPackage.PACKAGE_50,
      name: 'Growth Plan',
      creativeQuota: 50,
      price: 40000,
      color: '#FF9800',
      bgColor: '#FFF3E0',
      textColor: '#EF6C00',
      features: ['Up to 50 creatives', 'Priority email support', 'Advanced analytics', 'Team collaboration adaptations'],
      description: 'Ideal for growing teams with consistent projects.'
    },
    {
      type: ProjectPackage.PACKAGE_100,
      name: 'Business Plan',
      creativeQuota: 100,
      price: 70000,
      color: '#009688',
      bgColor: '#E0F2F1',
      textColor: '#00796B',
      features: ['Up to 100 creatives', '24/7 Priority support', 'Full analytics suite', 'Structured visual consistency'],
      description: 'Designed for high-volume firms and agencies.'
    },
    {
      type: ProjectPackage.IMPACT,
      name: 'Impact Plan',
      creativeQuota: 200,
      price: 120000,
      color: '#283593',
      bgColor: '#E8EAF6',
      textColor: '#1A237E',
      features: ['Up to 200 creatives', 'Dedicated account manager', 'Custom integrations', 'Enterprise-grade security priority'],
      description: 'Tailored solutions for enterprise-level operations.'
    }
  ];

  const handleUpgrade = async () => {
    setIsSubmitting(true);
    try {
      const selectedPkgInfo = packagesInfo.find(p => p.type === selectedPackage);
      if (!selectedPkgInfo) throw new Error('Invalid plan selection');

      const updates = {
        packageType: selectedPackage,
        budget: selectedPkgInfo.price,
        creativeUsed: plan.creativeUsed // preserve creative used
      };

      await updateExistingPlan(plan.id, updates);
      
      onSave({
        ...plan,
        ...updates
      });

      addNotification('Success', `Plan upgraded to ${selectedPkgInfo.name} successfully.`, 'success');
      onClose();
    } catch (err: any) {
      console.error('Error upgrading plan:', err);
      addNotification('Error', `Failed to change plan: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-50 shadow-2xl w-full max-w-5xl rounded-3xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-8 py-5 flex items-center justify-between border-b border-gray-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">Upgrade / Change Client Plan</h2>
            <p className="text-xs text-gray-400 mt-1">Select a new package tier for {plan.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packagesInfo.map((pkg) => {
              const isSelected = selectedPackage === pkg.type;
              const isCurrent = plan.packageType === pkg.type;

              return (
                <div
                  key={pkg.type}
                  onClick={() => setSelectedPackage(pkg.type)}
                  className={`relative cursor-pointer rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 border-2 bg-white ${
                    isSelected
                      ? 'border-gray-900 shadow-xl scale-[1.03] ring-4 ring-gray-900/5'
                      : 'border-gray-200 hover:border-gray-400 shadow-sm'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-gray-700 shadow">
                      Current Plan
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div
                      className="inline-flex px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase"
                      style={{ backgroundColor: pkg.bgColor, color: pkg.textColor }}
                    >
                      {pkg.name}
                    </div>

                    <div className="flex items-baseline mb-2">
                      <span className="text-3xl font-black text-gray-900">₹{pkg.price.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 font-semibold ml-1">/Year</span>
                    </div>

                    <p className="text-xs text-gray-500 font-medium mb-5">{pkg.description}</p>
                    <div className="border-t border-gray-100 my-4"></div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 font-medium">
                          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: pkg.color }} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selector Radio */}
                  <div className="pt-2">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" /> Selected Package
                        </>
                      ) : (
                        'Select Package'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-white px-8 py-5 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold uppercase">Current Package:</span>
            <span className="text-xs font-bold text-gray-800">{packagesInfo.find(p => p.type === plan.packageType)?.name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-semibold uppercase">Selected:</span>
            <span className="text-xs font-bold text-gray-900">{packagesInfo.find(p => p.type === selectedPackage)?.name}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={isSubmitting || selectedPackage === plan.packageType}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Updating Plan...
                </>
              ) : (
                'Confirm Change'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePlanModal;
