export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Children (sign-in/sign-up pages) handle their own layout now
  return <>{children}</>;
}
