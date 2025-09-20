// SMTP Configuration interface
export interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
}

// Email provider interface
export interface EmailProvider {
  send(options: EmailOptions): Promise<boolean>;
  verify(): Promise<boolean>;
}

// Email options interface
export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}
