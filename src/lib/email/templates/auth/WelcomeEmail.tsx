import React from 'react';
import { Section, Text, Button, Img } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface WelcomeEmailProps {
  data: EmailTemplateData;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ data }) => {
  return (
    <BaseTemplate _previewText="Welcome to Repurpose AI! 🎬">
      <Section style={hero}>
        <Img
          src="https://re-purpose.studio/logo.png"
          width="60"
          height="60"
          alt="Repurpose AI"
          style={logo}
        />
        <Text style={heading}>Welcome to Repurpose AI! 🎬</Text>
        <Text style={subheading}>
          Hi {data.user.name}, welcome to the future of video content creation!
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          We&apos;re excited to have you join our community of content creators.
          With Repurpose AI, you can transform your long-form videos into
          engaging short clips optimized for social media.
        </Text>

        <Text style={text}>
          Your current plan: <strong>{data.user.plan}</strong>
        </Text>

        <Section style={features}>
          <Text style={featureTitle}>🚀 Get Started</Text>
          <Text style={featureText}>
            Upload your first video and let our AI create amazing clips for you.
          </Text>

          <Text style={featureTitle}>⚡ Fast Processing</Text>
          <Text style={featureText}>
            Our advanced AI processes your videos quickly and efficiently.
          </Text>

          <Text style={featureTitle}>📱 Social Ready</Text>
          <Text style={featureText}>
            Clips are optimized for TikTok, Instagram Reels, and YouTube Shorts.
          </Text>
        </Section>
      </Section>

      <Section style={cta}>
        <Button style={button} href="https://re-purpose.studio/dashboard">
          Start Creating Clips
        </Button>
      </Section>

      <Section style={support}>
        <Text style={supportText}>
          Need help getting started? Our support team is here for you at{' '}
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
  marginBottom: '30px'
};

const logo = {
  margin: '0 auto 20px auto',
  display: 'block'
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 10px 0',
  textAlign: 'center' as const
};

const subheading = {
  fontSize: '18px',
  color: '#666666',
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
  margin: '0 0 20px 0'
};

const features = {
  backgroundColor: '#f8f9fa',
  padding: '30px',
  borderRadius: '8px',
  margin: '30px 0'
};

const featureTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 10px 0'
};

const featureText = {
  fontSize: '16px',
  color: '#666666',
  margin: '0 0 20px 0',
  lineHeight: '24px'
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
