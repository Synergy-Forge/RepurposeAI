import React from 'react';
import { Section, Text, Button } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface PasswordResetEmailProps {
  data: EmailTemplateData;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ data }) => {
  return (
    <BaseTemplate previewText="Reset your RepurposeAI password">
      <Section style={hero}>
        <Text style={heading}>Reset your password</Text>
        <Text style={subheading}>
          Hi {data.user.name}, we received a request to reset your password.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          Click the button below to choose a new password. This link expires in
          1 hour for security reasons.
        </Text>

        <Section style={cta}>
          <Button style={button} href={data.resetUrl ?? '#'}>
            Reset Password
          </Button>
        </Section>

        <Text style={note}>
          If you didn&apos;t request a password reset, you can safely ignore this
          email. Your password will not change.
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
  backgroundColor: '#f8f9fa',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px',
  marginBottom: '30px',
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
  color: '#666666',
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
