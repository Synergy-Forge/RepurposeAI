import React from 'react';
import { EmailLayout, EmailButton } from '../base/layout';
import { EmailHeader, EmailText, EmailHighlight } from '../base/components';

interface WelcomeEmailProps {
  userName: string;
  loginUrl: string;
  baseUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  loginUrl,
  baseUrl,
}) => {
  return (
    <EmailLayout baseUrl={baseUrl}>
      <EmailHeader
        title={`Welcome to Repurpose AI, ${userName}!`}
        subtitle="Your video repurposing journey starts now"
      />

      <EmailText>
        Thank you for joining Repurpose AI! We're excited to help you transform your videos into engaging content for different social media platforms.
      </EmailText>

      <EmailHighlight>
        🎉 Your account is ready to use!
      </EmailHighlight>

      <EmailText>
        Here's what you can do next:
      </EmailText>

      <ul style={{
        margin: '16px 0',
        paddingLeft: '20px',
        color: '#475569',
      }}>
        <li style={{ margin: '8px 0' }}>
          <strong>Upload your first video</strong> - Start by uploading a video to see the magic happen
        </li>
        <li style={{ margin: '8px 0' }}>
          <strong>Choose aspect ratios</strong> - Select from 9:16, 1:1, and 16:9 formats
        </li>
        <li style={{ margin: '8px 0' }}>
          <strong>Download and share</strong> - Get optimized clips ready for social media
        </li>
      </ul>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={loginUrl}>
          Start Creating Content
        </EmailButton>
      </div>

      <EmailText>
        If you have any questions or need help getting started, feel free to reach out to our support team.
      </EmailText>

      <EmailText>
        Happy creating!<br />
        The Repurpose AI Team
      </EmailText>
    </EmailLayout>
  );
};
