import LoginForm from './login-form';

interface LoginPageProps {
  searchParams: { callbackUrl?: string; error?: string; unverified?: string; email?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const callbackUrl =
    typeof searchParams?.callbackUrl === 'string' && searchParams.callbackUrl.startsWith('/')
      ? searchParams.callbackUrl
      : '/dashboard';
  const error: string | null =
    typeof searchParams?.error === 'string' ? searchParams.error : null;
  const unverified = searchParams?.unverified === '1';
  const unverifiedEmail =
    typeof searchParams?.email === 'string' ? searchParams.email : '';

  return (
    <LoginForm
      googleEnabled={googleEnabled}
      initialCallbackUrl={callbackUrl}
      initialError={error}
      initialUnverified={unverified}
      initialUnverifiedEmail={unverifiedEmail}
    />
  );
}
