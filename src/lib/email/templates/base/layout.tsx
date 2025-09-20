import React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
  baseUrl: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ children, baseUrl }) => {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {children}
    </div>
  );
};

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  style?: React.CSSProperties;
}

export const EmailButton: React.FC<EmailButtonProps> = ({
  href,
  children,
  variant = 'primary',
  style = {}
}) => {
  const baseStyles = {
    display: 'inline-block',
    padding: '12px 24px',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: 500,
    margin: '10px 0',
  };

  const primaryStyles = {
    ...baseStyles,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  };

  const secondaryStyles = {
    ...baseStyles,
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
  };

  return (
    <a
      href={href}
      style={{
        ...(variant === 'primary' ? primaryStyles : secondaryStyles),
        ...style,
      }}
    >
      {children}
    </a>
  );
};

interface EmailCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmailCard: React.FC<EmailCardProps> = ({ children, style = {} }) => {
  const defaultStyles: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    margin: '16px 0',
    ...style,
  };

  return (
    <div style={defaultStyles}>
      {children}
    </div>
  );
};

interface EmailDividerProps {
  style?: React.CSSProperties;
}

export const EmailDivider: React.FC<EmailDividerProps> = ({ style = {} }) => {
  const defaultStyles: React.CSSProperties = {
    height: '1px',
    background: '#e2e8f0',
    margin: '24px 0',
    ...style,
  };

  return <div style={defaultStyles} />;
};
