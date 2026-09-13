import LoginForm from './login-form';

interface LoginPageProps {
  searchParams: { callbackUrl?: string; error?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const callbackUrl =
    typeof searchParams?.callbackUrl === 'string' && searchParams.callbackUrl.startsWith('/')
      ? searchParams.callbackUrl
      : '/dashboard';
  const urlError =
    typeof searchParams?.error === 'string' && searchParams.error.length > 0
      ? searchParams.error
      : null;
  return <LoginForm googleEnabled={googleEnabled} initialCallbackUrl={callbackUrl} initialError={urlError} />;
}