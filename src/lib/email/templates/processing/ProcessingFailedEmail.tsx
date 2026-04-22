import React from 'react';
import { Section, Text, Button } from '@react-email/components';
import { BaseTemplate } from '../components/BaseTemplate';
import { EmailTemplateData } from '../../types';

interface ProcessingFailedEmailProps {
  data: EmailTemplateData;
}

export const ProcessingFailedEmail: React.FC<ProcessingFailedEmailProps> = ({ data }) => {
  return (
    <BaseTemplate previewText="We couldn't process your video">
      <Section style={hero}>
        <Text style={heading}>Processing failed</Text>
        <Text style={subheading}>
          Hi {data.user.name}, we ran into an issue processing
          {data.video?.title ? ` "${data.video.title}"` : ' your video'}.
        </Text>
      </Section>

      <Section style={content}>
        <Text style={text}>
          Don&apos;t worry — this sometimes happens due to file format issues or a temporary
          glitch. Your quota for this video has been refunded automatically.
        </Text>

        <Text style={text}>Here are a few things you can try:</Text>

        <Section style={tips}>
          <Text style={tip}>• Re-upload the video and try again</Text>
          <Text style={tip}>• Make sure the video is in MP4 format</Text>
          <Text style={tip}>• Check the file isn&apos;t corrupted</Text>
          <Text style={tip}>• Keep the file size under 2 GB</Text>
        </Section>

        <Section style={cta}>
          <Button style={button} href="https://re-purpose.studio/dashboard">
            Try Again
          </Button>
        </Section>
      </Section>

      <Section style={support}>
        <Text style={supportText}>
          Still having trouble?{' '}
          <a href={data.supportUrl} style={supportLink}>
            Contact our support team
          </a>{' '}
          and we&apos;ll help sort it out.
        </Text>
      </Section>
    </BaseTemplate>
  );
};

const hero = {
  backgroundColor: '#fff1f0',
  padding: '40px 30px',
  textAlign: 'center' as const,
  borderRadius: '8px',
  marginBottom: '30px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#c0392b',
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
  margin: '0 0 16px 0',
};

const tips = {
  backgroundColor: '#f8f9fa',
  padding: '20px 24px',
  borderRadius: '8px',
  margin: '0 0 24px 0',
};

const tip = {
  fontSize: '15px',
  color: '#555555',
  lineHeight: '24px',
  margin: '0 0 8px 0',
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
