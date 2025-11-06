export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Children (sign-in page) handle their own layout now
  return <>{children}</>;
}
