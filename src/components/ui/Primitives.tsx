import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#1971C2] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#1971C2] text-white hover:bg-[#1864AB] border-none',
    secondary: 'bg-white text-[#212529] border border-[#DEE2E6] hover:bg-[#F8F9FA]',
    destructive: 'bg-[#C92A2A] text-white hover:bg-[#A51111] border-none',
    ghost: 'bg-transparent text-[#495057] hover:bg-[#F1F3F5] border-none',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 min-h-[44px]',
    lg: 'text-base px-5 py-3 min-h-[48px]',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2 inline-flex items-center">{icon}</span>}
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { clickable?: boolean }> = ({
  children,
  className = '',
  clickable = false,
  ...props
}) => {
  const clickableStyle = clickable
    ? 'hover:border-[#CED4DA] cursor-pointer transition-colors duration-150'
    : '';

  return (
    <div
      className={`bg-white border border-[#E9ECEF] rounded-lg p-5 ${clickableStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Badge: React.FC<{
  status: 'pass' | 'fail' | 'review' | 'not_applicable' | 'compliant' | 'non_compliant' | 'requires_review';
  text?: string;
}> = ({ status, text }) => {
  const badgeStyles = {
    pass: 'bg-[#EBFBEE] text-[#2B8A3E] border-[#B2F2BB]',
    compliant: 'bg-[#EBFBEE] text-[#2B8A3E] border-[#B2F2BB]',
    fail: 'bg-[#FFF5F5] text-[#C92A2A] border-[#FFC9C9]',
    non_compliant: 'bg-[#FFF5F5] text-[#C92A2A] border-[#FFC9C9]',
    review: 'bg-[#FFF9DB] text-[#E67700] border-[#FFE066]',
    requires_review: 'bg-[#FFF9DB] text-[#E67700] border-[#FFE066]',
    not_applicable: 'bg-[#F1F3F5] text-[#868E96] border-[#CED4DA]',
  };

  const labels = {
    pass: '✓ Verified',
    compliant: '✓ Compliant',
    fail: '✗ Issue',
    non_compliant: '✗ Non-Compliant',
    review: '⚠ Review',
    requires_review: '⚠ Requires Review',
    not_applicable: '— N/A',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${badgeStyles[status]}`}
    >
      {text || labels[status]}
    </span>
  );
};
