import React from 'react';

interface EmailHeaderProps {
  title: string;
  subtitle?: string;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({ title, subtitle }) => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: subtitle ? '8px' : '0',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          margin: '0',
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

interface EmailTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmailText: React.FC<EmailTextProps> = ({ children, style = {} }) => {
  const defaultStyles: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#475569',
    margin: '16px 0',
    ...style,
  };

  return <p style={defaultStyles}>{children}</p>;
};

interface EmailHighlightProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmailHighlight: React.FC<EmailHighlightProps> = ({ children, style = {} }) => {
  const defaultStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '16px 0',
    ...style,
  };

  return <p style={defaultStyles}>{children}</p>;
};

interface EmailListProps {
  items: string[];
  style?: React.CSSProperties;
}

export const EmailList: React.FC<EmailListProps> = ({ items, style = {} }) => {
  const defaultStyles: React.CSSProperties = {
    margin: '16px 0',
    paddingLeft: '0',
    listStyle: 'none',
    ...style,
  };

  return (
    <ul style={defaultStyles}>
      {items.map((item, index) => (
        <li key={index} style={{
          margin: '8px 0',
          paddingLeft: '20px',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute',
            left: '0',
            top: '2px',
            width: '6px',
            height: '6px',
            background: '#667eea',
            borderRadius: '50%',
          }} />
          {item}
        </li>
      ))}
    </ul>
  );
};

interface EmailStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
}

export const EmailStats: React.FC<EmailStatsProps> = ({ stats }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '16px',
      margin: '24px 0',
    }}>
      {stats.map((stat, index) => (
        <div key={index} style={{
          textAlign: 'center',
          padding: '16px',
          background: stat.highlight ? '#f0f9ff' : '#f8fafc',
          borderRadius: '8px',
          border: stat.highlight ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: stat.highlight ? '#0ea5e9' : '#1e293b',
            marginBottom: '4px',
          }}>
            {stat.value}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#64748b',
          }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

interface EmailAlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export const EmailAlert: React.FC<EmailAlertProps> = ({ type, children }) => {
  const alertStyles = {
    success: {
      background: '#f0fdf4',
      border: '1px solid #22c55e',
      color: '#15803d',
    },
    warning: {
      background: '#fffbeb',
      border: '1px solid #f59e0b',
      color: '#92400e',
    },
    error: {
      background: '#fef2f2',
      border: '1px solid #ef4444',
      color: '#dc2626',
    },
    info: {
      background: '#f0f9ff',
      border: '1px solid #0ea5e9',
      color: '#0c4a6e',
    },
  };

  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      margin: '16px 0',
      ...alertStyles[type],
    }}>
      {children}
    </div>
  );
};
