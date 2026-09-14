import ResetPasswordForm from './reset-password-form';

interface ResetPasswordPageProps {
  params: { token: string };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const token = typeof params?.token === 'string' ? params.token : '';
  return <ResetPasswordForm token={token} />;
}
