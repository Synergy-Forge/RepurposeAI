import React from 'react';
import { Html, Head, Body, Container, Section, Text, Hr, Link } from '@react-email/components';

interface BaseTemplateProps {
  children: React.ReactNode;
  _previewText?: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  children,
  _previewText ='Repurpose AI Notification'
}) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Repurpose AI</Text>
            <Text style={tagline}>Transform your videos into engaging clips</Text>
          </Section>

          <Section style={content}>
            {children}
          </Section>

          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              <Link href="https://re-purpose.studio" style={link}>
                Visit Repurpose AI
              </Link>{' '}
              |{' '}
              <Link href="mailto:support@re-purpose.studio" style={link}>
                Contact Support
              </Link>
            </Text>
            <Text style={copyright}>
              © 2024 Repurpose AI. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px'
};

const header = {
  padding: '40px 30px 30px'
};

const brand = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#000000',
  textAlign: 'center' as const,
  margin: '0 0 10px 0'
};

const tagline = {
  fontSize: '16px',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '0'
};

const content = {
  padding: '0 30px'
};

const footer = {
  padding: '30px'
};

const footerText = {
  fontSize: '14px',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '0 0 10px 0'
};

const link = {
  color: '#FF6B35',
  textDecoration: 'underline'
};

const copyright = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '0'
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0'
};
