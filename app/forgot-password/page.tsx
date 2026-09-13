import ForgotPasswordForm from './forgot-password-form';

interface ForgotPasswordPageProps {
  searchParams: { email?: string };
}

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const initialEmail =
    typeof searchParams?.email === 'string' && searchParams.email.length <= 254
      ? searchParams.email
      : '';
  return <ForgotPasswordForm initialEmail={initialEmail} />;
}