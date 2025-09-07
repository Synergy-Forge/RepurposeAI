// src/app/api/auth/error/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  OAuthCallback: 'Erro na autenticação com Google. Verifique suas credenciais.',
  OAuthSignin: 'Erro ao iniciar a autenticação.',
  OAuthCallbackError: 'Erro no callback do OAuth.',
  Configuration: 'Erro de configuração do servidor.',
  AccessDenied: 'Acesso negado. Você precisa permitir o acesso ao Google.',
  Verification: 'Token de verificação inválido.',
  Default: 'Erro inesperado na autenticação.'
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Erro na Autenticação
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorMessages[error] || errorMessages.Default}
          </p>
          
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Código do erro:</strong> {error}
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <Link 
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Tentar Novamente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}