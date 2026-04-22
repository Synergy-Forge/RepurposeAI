import React from 'react';
import { Section, Text, Button } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface SubscriptionDowngradedEmailProps {
  data: EmailTemplateData;
}

export const SubscriptionDowngradedEmail: React.FC<SubscriptionDowngradedEmailProps> = ({ data }) => {
  const planName = data.subscription?.planName ?? 'your new plan';
  const effectiveDate = data.subscription?.nextBillingDate ?? null;

  return (
    <BaseTemplate previewText={`Your plan has changed to ${planName}`}>
      <Section style={hero}>
        <Text style={heading}>Your plan has changed</Text>
        <Text style={subheading}>
          You&apos;re now on <strong>{planName}</strong>.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          Hi {data.user.name}, we&apos;ve updated your subscription to{' '}
          <strong>{planName}</strong>. Your billing and quota reflect the new
          plan straight away.
        </Text>

        <Section style={planDetails}>
          <Text style={planTitle}>New plan details</Text>
          <div style={detailRow}>
            <Text style={detailLabel}>Plan:</Text>
            <Text style={detailValue}>{planName}</Text>
          </div>
          {data.subscription?.amount !== undefined && (
            <div style={detailRow}>
              <Text style={detailLabel}>Amount:</Text>
              <Text style={detailValue}>${data.subscription.amount}/month</Text>
            </div>
          )}
          {effectiveDate && (
            <div style={detailRow}>
              <Text style={detailLabel}>Next billing:</Text>
              <Text style={detailValue}>{effectiveDate}</Text>
            </div>
          )}
        </Section>

        <Text style={text}>
          Your existing projects and clips stay exactly where they are. You can
          upgrade again any time if your needs grow.
        </Text>
      </Section>

      <Section style={cta}>
        <Button style={button} href="https://re-purpose.studio/dashboard">
          Go to dashboard
        </Button>
      </Section>

      <Section style={support}>
        <Text style={supportText}>
          Questions about your new plan? Reach us at{' '}
          <a href={`mailto:${data.supportUrl}`} style={supportLink}>
            support@re-purpose.studio
          </a>
        </Text>
      </Section>
    </BaseTemplate>
  );
};

const hero = {
  backgroundColor: '#f0f4ff',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px',
  marginBottom: '30px',
  borderLeft: '4px solid #FF6B35',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#FF6B35',
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
