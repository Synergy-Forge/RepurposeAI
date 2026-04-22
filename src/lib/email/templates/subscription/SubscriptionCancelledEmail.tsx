import React from 'react';
import { Section, Text, Button } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface SubscriptionCancelledEmailProps {
  data: EmailTemplateData;
}

export const SubscriptionCancelledEmail: React.FC<SubscriptionCancelledEmailProps> = ({ data }) => {
  const planName = data.subscription?.planName ?? 'your plan';
  const accessEndDate =
    data.subscription?.gracePeriodEnd ?? data.subscription?.nextBillingDate ?? null;

  return (
    <BaseTemplate previewText={`Your ${planName} subscription has been cancelled`}>
      <Section style={hero}>
        <Text style={heading}>Subscription cancelled</Text>
        <Text style={subheading}>
          We&apos;ve processed your cancellation request.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          Hi {data.user.name}, your <strong>{planName}</strong> subscription has
          been cancelled. You&apos;ll keep access to your current plan until it
          ends, and you won&apos;t be charged again.
        </Text>

        <Section style={planDetails}>
          <Text style={planTitle}>What happens next</Text>
          <div style={detailRow}>
            <Text style={detailLabel}>Plan:</Text>
            <Text style={detailValue}>{planName}</Text>
          </div>
          {accessEndDate && (
            <div style={detailRow}>
              <Text style={detailLabel}>Access ends:</Text>
              <Text style={detailValue}>{accessEndDate}</Text>
            </div>
          )}
          <div style={detailRow}>
            <Text style={detailLabel}>After that:</Text>
            <Text style={detailValue}>Free plan</Text>
          </div>
        </Section>

        <Text style={text}>
          Your projects and clips stay in your account. You can reactivate any
          time to restore paid features.
        </Text>
      </Section>

      <Section style={cta}>
        <Button style={button} href="https://re-purpose.studio/settings">
          Reactivate subscription
        </Button>
      </Section>

      <Section style={support}>
        <Text style={supportText}>
          Cancelled by mistake, or need a hand? Reach us at{' '}
          <a href={`mailto:${data.supportUrl}`} style={supportLink}>
            support@re-purpose.studio
          </a>
        </Text>
      </Section>
    </BaseTemplate>
  );
};

const hero = {
  backgroundColor: '#f8f9fa',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px',
  marginBottom: '30px',
  borderLeft: '4px solid #FF6B35',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 10px 0',
  textAlign: 'center' as const,
};

const subheading = {
  fontSize: '18px',
  color: '#333333',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  marginBottom: '30px',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  margin: '0 0 20px 0',
};

const planDetails = {
  backgroundColor: '#f8f9fa',
  padding: '30px',
  borderRadius: '8px',
  margin: '30px 0',
};

const planTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px',
};

const detailLabel = {
  fontSize: '14px',
  color: '#666666',
};

const detailValue = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#000000',
};

const cta = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const button = {
  backgroundColor: '#FF6B35',
  color: '#ffffff',
  padding: '16px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inlineBlock',
};

const support = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center' as const,
};

const supportText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
};

const supportLink = {
  color: '#FF6B35',
  textDecoration: 'none',
};
