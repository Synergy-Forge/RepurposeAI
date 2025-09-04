// Component Props
export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

export interface PricingFeature {
  text: string;
}

export interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  priceUnit?: string;
  features: PricingFeature[];
  buttonText: string;
  buttonHref: string;
  featured?: boolean;
}

// Form Data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

// API Response Types (for future use)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'Starter' | 'Creator' | 'Producer';
  createdAt: Date;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
  processed: boolean;
}

// Additional types can be added as needed for other components or features