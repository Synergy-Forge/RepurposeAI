import React from 'react';
import { Section, Text, Button, Img } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface ProcessingCompleteEmailProps {
  data: EmailTemplateData;
}

export const ProcessingCompleteEmail: React.FC<ProcessingCompleteEmailProps> = ({ data }) => {
  return (
    <BaseTemplate previewText="Your video clips are ready! ✨">
      <Section style={hero}>
        <Img
          src="https://re-purpose.studio/icons/success.png"
          width="60"
          height="60"
          alt="Success"
          style={icon}
        />
        <Text style={heading}>Your clips are ready! ✨</Text>
        <Text style={subheading}>
          Great news! Your video `{data.video?.title}` has been processed successfully.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          We&apos;ve created <strong>{data.video?.clipsGenerated} amazing clips</strong> from your video,
          optimized for different social media platforms.
        </Text>

        <Section style={stats}>
          <div style={stat}>
            <Text style={statValue}>{data.video?.clipsGenerated}</Text>
            <Text style={statLabel}>Clips Generated</Text>
          </div>
          <div style={stat}>
            <Text style={statValue}>{Math.floor((data.video?.duration || 0) / 60)}m</Text>
            <Text style={statLabel}>Video Duration</Text>
          </div>
        </Section>
      </Section>

      <Section style={cta}>
        <Button style={button} href={data.video?.downloadUrl}>
          Download Your Clips
        </Button>
      </Section>

      <Section style={tips}>
        <Text style={tipsTitle}>💡 Pro Tips</Text>
        <Text style={tipsText}>
          • Post your clips during peak hours for maximum engagement
        </Text>
        <Text style={tipsText}>
          • Use trending hashtags to increase visibility
        </Text>
        <Text style={tipsText}>
          • Add captions for better accessibility
        </Text>
      </Section>

      <Section style={support}>
        <Text style={supportText}>
          Need help with your clips? Contact us at{' '}
          <a href={`mailto:${data.supportUrl}`} style={supportLink}>
            support@re-purpose.studio
          </a>
        </Text>
      </Section>
    </BaseTemplate>
  );
};

const hero = {
  backgroundColor: '#f0f9f0',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px',
  marginBottom: '30px',
  borderLeft: '4px solid #28a745'
};

const icon = {
  margin: '0 auto 20px auto',
  display: 'block'
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#28a745',
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

const stats = {
  display: 'flex',
  justifyContent: 'center',
  gap: '40px',
  margin: '30px 0'
};

const stat = {
  textAlign: 'center' as const
};

const statValue = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#FF6B35',
  margin: '0 0 5px 0'
};

const statLabel = {
  fontSize: '14px',
  color: '#666666',
  margin: '0'
};

const cta = {
  textAlign: 'center' as const,
  margin: '40px 0'
};

const button = {
  backgroundColor: '#28a745',
  color: '#ffffff',
  padding: '16px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'inlineBlock'
};

const tips = {
  backgroundColor: '#f8f9fa',
  padding: '30px',
  borderRadius: '8px',
  margin: '30px 0'
};

const tipsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0 0 15px 0'
};

const tipsText = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 10px 0',
  lineHeight: '20px'
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
