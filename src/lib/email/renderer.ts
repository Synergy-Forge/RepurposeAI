import React from 'react';
import { renderToString } from 'react-dom/server';

interface RenderOptions {
  title?: string;
  baseUrl?: string;
  previewText?: string;
}

export class EmailRenderer {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  render(template: React.ComponentType<any>, props: any, options: RenderOptions = {}): string {
    const { title = 'Repurpose AI', previewText } = options;

    const emailHtml = renderToString(
      React.createElement(template, {
        ...props,
        baseUrl: this.baseUrl,
      })
    );

    return this.wrapWithEmailTemplate(emailHtml, title, previewText);
  }

  private wrapWithEmailTemplate(content: string, title: string, previewText?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${previewText ? `<meta name="description" content="${previewText}">` : ''}
  <style>
    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8fafc;
    }

    /* Email container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }

    /* Header */
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }

    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .tagline {
      font-size: 16px;
      opacity: 0.9;
    }

    /* Content */
    .email-content {
      padding: 40px 30px;
    }

    /* Footer */
    .email-footer {
      background-color: #f1f5f9;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
    }

    .footer-links {
      margin-top: 20px;
    }

    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
    }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 10px 0;
    }

    .btn:hover {
      opacity: 0.9;
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
      }

      .email-header,
      .email-content,
      .email-footer {
        padding: 20px !important;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #0f172a;
      }

      .email-container {
        background-color: #1e293b;
        color: #e2e8f0;
      }

      .email-footer {
        background-color: #0f172a;
        color: #94a3b8;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="logo">Repurpose AI</div>
      <div class="tagline">Transform Your Videos Into Viral Content</div>
    </div>

    <div class="email-content">
      ${content}
    </div>

    <div class="email-footer">
      <p>You're receiving this email because you're a Repurpose AI user.</p>
      <div class="footer-links">
        <a href="${this.baseUrl}/dashboard">Dashboard</a>
        <a href="${this.baseUrl}/subscription">Subscription</a>
        <a href="mailto:support@repurposeai.com">Support</a>
      </div>
      <p>
        © ${new Date().getFullYear()} Repurpose AI. All rights reserved.<br>
        <a href="${this.baseUrl}/unsubscribe">Unsubscribe</a> from these emails.
      </p>
    </div>
  </div>
</body>
</html>`;
  }
}

// Factory function to create email renderer
export function createEmailRenderer(baseUrl?: string): EmailRenderer {
  return new EmailRenderer(baseUrl);
}
