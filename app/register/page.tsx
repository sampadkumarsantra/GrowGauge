import RegisterForm from './register-form';

export default function RegisterPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return <RegisterForm googleEnabled={googleEnabled} />;
}