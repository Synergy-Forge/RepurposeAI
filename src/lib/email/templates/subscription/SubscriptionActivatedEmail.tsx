import React from 'react';
import { Section, Text, Button, Img } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface SubscriptionActivatedEmailProps {
  data: EmailTemplateData;
}

export const SubscriptionActivatedEmail: React.FC<SubscriptionActivatedEmailProps> = ({ data }) => {
  return (
    <BaseTemplate previewText="Welcome to your new plan! 🎉">
      <Section style={hero}>
        <Img
          src="https://re-purpose.studio/icons/celebration.png"
          width="60"
          height="60"
          alt="Celebration"
          style={icon}
        />
        <Text style={heading}>Welcome to {data.subscription?.planName}! 🎉</Text>
        <Text style={subheading}>
          Your subscription has been activated successfully.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          Thank you for choosing Repurpose AI! Your{' '}
          <strong>{data.subscription?.planName}</strong> plan is now active.
        </Text>

        <Section style={planDetails}>
          <Text style={planTitle}>Plan Details</Text>
          <div style={detailRow}>
            <Text style={detailLabel}>Plan:</Text>
            <Text style={detailValue}>{data.subscription?.planName}</Text>
          </div>
          <div style={detailRow}>
            <Text style={detailLabel}>Amount:</Text>
            <Text style={detailValue}>${data.subscription?.amount}/month</Text>
          </div>
          <div style={detailRow}>
            <Text style={detailLabel}>Next billing:</Text>
            <Text style={detailValue}>{data.subscription?.nextBillingDate}</Text>
          </div>
        </Section>
      </Section>

      <Section style={features}>
        <Text style={featuresTitle}>✨ What's included in your plan:</Text>
        <Text style={featuresText}>
          • Unlimited video processing
        </Text>
        <Text style={featuresText}>
          • Advanced AI clip generation
        </Text>
        <Text style={featuresText}>
          • Premium export formats
        </Text>
        <Text style={featuresText}>
          • Priority support
        </Text>
      </Section>

      <Section style={cta}>
        <Button style={button} href="https://re-purpose.studio/dashboard">
          Start Creating Amazing Clips
        </Button>
      </Section>

      <Section style={support}>
        <Text style={supportText}>
          Questions about your subscription? We're here to help at{' '}
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
  borderLeft: '4px solid #FF6B35'
};

const icon = {
  margin: '0 auto 20px auto',
  display: 'block'
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#FF6B35',
  margin: '0 0 10px 0',
  textAlign: 'center' as const
};

const subheading = {
  fontSize: '18px',
  color: '#333333',
  margin: '0',
  textAlign: 'center' as const
};

const content = {
  marginBottom: '30px'
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  margin: '0 0 20px 0',
  textAlign: 'center' as const
};

const planDetails = {
  backgroundColor: '#f8f9fa',
  padding: '30px',
  borderRadius: '8px',
  margin: '30px 0'
};

const planTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 20px 0',
  textAlign: 'center' as const
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px'
};

const detailLabel = {
  fontSize: '14px',
  color: '#666666'
};

const detailValue = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#000000'
};

const features = {
  backgroundColor: '#f8f9fa',
  padding: '30px',
  borderRadius: '8px',
  margin: '30px 0'
};

const featuresTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 15px 0'
};

const featuresText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 10px 0',
  lineHeight: '20px'
};

const cta = {
  textAlign: 'center' as const,
  margin: '40px 0'
};

const button = {
  backgroundColor: '#FF6B35',
  color: '#ffffff',
  padding: '16px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inlineBlock'
};

const support = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center' as const
};

const supportText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0'
};

const supportLink = {
  color: '#FF6B35',
  textDecoration: 'none'
};
