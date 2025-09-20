import React from 'react';
import { EmailLayout, EmailButton } from '../base/layout';
import { EmailHeader, EmailText, EmailHighlight, EmailStats } from '../base/components';

interface ProcessingCompleteEmailProps {
  userName: string;
  videoTitle: string;
  clipsCount: number;
  downloadLinks: Array<{
    aspectRatio: string;
    url: string;
  }>;
  dashboardUrl: string;
  baseUrl: string;
}

export const ProcessingCompleteEmail: React.FC<ProcessingCompleteEmailProps> = ({
  userName,
  videoTitle,
  clipsCount,
  downloadLinks,
  dashboardUrl,
  baseUrl,
}) => {
  const getAspectRatioLabel = (ratio: string) => {
    switch (ratio) {
      case '9:16': return 'TikTok/Instagram Reels';
      case '1:1': return 'Instagram Posts';
      case '16:9': return 'YouTube';
      default: return ratio;
    }
  };

  return (
    <EmailLayout baseUrl={baseUrl}>
      <EmailHeader
        title="Your Video is Ready! 🎬"
        subtitle={`${videoTitle} has been processed successfully`}
      />

      <EmailHighlight>
        Great news, {userName}! Your video processing is complete.
      </EmailHighlight>

      <EmailText>
        We've successfully created <strong>{clipsCount}</strong> optimized clips from your video "{videoTitle}".
        Each clip is perfectly formatted for different social media platforms.
      </EmailText>

      <EmailStats stats={[
        {
          label: 'Clips Generated',
          value: clipsCount,
          highlight: true,
        },
        {
          label: 'Aspect Ratios',
          value: downloadLinks.length,
        },
        {
          label: 'Ready to Download',
          value: 'Yes',
        },
      ]} />

      <EmailText>
        <strong>Your optimized clips:</strong>
      </EmailText>

      <div style={{ margin: '16px 0' }}>
        {downloadLinks.map((link, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '6px',
            margin: '8px 0',
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontWeight: '500', color: '#1e293b' }}>
              {getAspectRatioLabel(link.aspectRatio)}
            </span>
            <EmailButton
              href={link.url}
              variant="primary"
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              Download
            </EmailButton>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <EmailButton href={dashboardUrl}>
          View All Videos
        </EmailButton>
      </div>

      <EmailText>
        Ready to create more content? Upload another video to keep the momentum going!
      </EmailText>

      <EmailText>
        Happy creating!<br />
        The Repurpose AI Team
      </EmailText>
    </EmailLayout>
  );
};
