'use client';

import { Phone } from 'lucide-react';

interface PhoneInputBOProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function PhoneInputBO({
  value,
  onChange,
  placeholder = '71234567',
  required = false,
  disabled = false,
  className = '',
}: PhoneInputBOProps) {
  // Extract local number from full phone (remove +591)
  const localNumber = value.replace(/^\+591/, '').slice(-8) || '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');

    // Keep only last 9 digits (8 local + optional leading 7)
    if (input.length > 9) {
      input = input.slice(-9);
    }

    // Build full phone with +591
    const fullPhone = input ? `+591${input}` : '';
    onChange(fullPhone);
  };

  return (
    <div className={className}>
      <div className="relative flex">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <Phone className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600 bg-white pr-2">+591</span>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          required={required}
          disabled={disabled}
          value={localNumber}
          onChange={handleInputChange}
          maxLength={9}
          placeholder={placeholder}
          className="w-full pl-[72px] pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
