import RegisterForm from './register-form';

interface RegisterPageProps {
  searchParams: { callbackUrl?: string };
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const callbackUrl =
    typeof searchParams?.callbackUrl === 'string' && searchParams.callbackUrl.startsWith('/')
      ? searchParams.callbackUrl
      : '/dashboard';
  return <RegisterForm googleEnabled={googleEnabled} initialCallbackUrl={callbackUrl} />;
}