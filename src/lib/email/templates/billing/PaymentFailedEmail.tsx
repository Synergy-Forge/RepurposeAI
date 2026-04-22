import React from 'react';
import { Section, Text, Button } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface PaymentFailedEmailProps {
  data: EmailTemplateData;
}

export const PaymentFailedEmail: React.FC<PaymentFailedEmailProps> = ({ data }) => {
  return (
    <BaseTemplate previewText="Action needed: your payment could not be processed">
      <Section style={hero}>
        <Text style={heading}>Payment failed</Text>
        <Text style={subheading}>
          Hi {data.user.name}, we were unable to process your latest payment.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          To keep your <strong>{data.user.plan} Plan</strong> active, please update your payment
          method as soon as possible. If we can&apos;t collect payment, your account will
          revert to the Free plan.
        </Text>

        <Section style={cta}>
          <Button style={button} href="https://re-purpose.studio/dashboard/settings?section=billing">
            Update Payment Method
          </Button>
        </Section>

        <Text style={note}>
          You can update your card, switch to a different payment method, or contact your bank
          to authorise the charge.
        </Text>
      </Section>

      <Section style={support}>
        <Text style={supportText}>
          Need help?{' '}
          <a href={data.supportUrl} style={supportLink}>
            Contact support
          </a>
        </Text>
      </Section>
    </BaseTemplate>
  );
};

const hero = {
  backgroundColor: '#fff8e1',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px',
  marginBottom: '30px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#e67e22',
  margin: '0 0 10px 0',
  textAlign: 'center' as const,
};

const subheading = {
  fontSize: '18px',
  color: '#555555',
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

const cta = {
  textAlign: 'center' as const,
  margin: '32px 0',
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

const note = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#888888',
  margin: '0',
  textAlign: 'center' as const,
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
