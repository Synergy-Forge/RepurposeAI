import React from 'react';
import { Section, Text, Button } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface EmailVerificationEmailProps {
  data: EmailTemplateData;
}

export const EmailVerificationEmail: React.FC<EmailVerificationEmailProps> = ({ data }) => {
  const verificationUrl = data.verificationUrl ?? '#';

  return (
    <BaseTemplate previewText="Verify your RepurposeAI email address">
      <Section style={hero}>
        <Text style={heading}>Verify your email</Text>
        <Text style={subheading}>
          Hi {data.user.name}, welcome to Repurpose AI.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          Confirm this is your email address so we can keep your account
          secure and send you important updates. This link expires in 24 hours.
        </Text>

        <Section style={cta}>
          <Button style={button} href={verificationUrl}>
            Verify email address
          </Button>
        </Section>

        <Text style={note}>
          If the button doesn&apos;t work, copy and paste this link into your
          browser:
        </Text>
        <Text style={fallbackLink}>{verificationUrl}</Text>

        <Text style={note}>
          If you didn&apos;t create a Repurpose AI account, you can safely
          ignore this email.
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
  margin: '0 0 10px 0',
  textAlign: 'center' as const,
};

const fallbackLink = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#FF6B35',
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
  margin: '0 0 20px 0',
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
