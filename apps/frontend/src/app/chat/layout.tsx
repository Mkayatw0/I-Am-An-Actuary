import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}