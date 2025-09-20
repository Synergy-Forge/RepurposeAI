export class MockEmailProvider {
  async sendEmail(
    to: string,
    subject: string,
    options: {
      html?: string;
      text?: string;
      attachments?: any[];
    } = {}
  ): Promise<string> {
    console.log('📧 [MOCK] Email would be sent to:', to);
    console.log('📧 [MOCK] Subject:', subject);
    console.log('📧 [MOCK] HTML length:', options.html?.length || 0);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return `mock-message-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendBulkEmails(emails: any[]): Promise<string[]> {
    const results: string[] = [];

    for (const email of emails) {
      const messageId = await this.sendEmail(email.to, email.subject, {
        html: email.html,
        text: email.text,
        attachments: email.attachments,
      });
      results.push(messageId);
    }

    return results;
  }
}
