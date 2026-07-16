import { redirect } from 'next/navigation';

export default function Page() {
  // Always redirect root to the login page so users see the login screen first.
  redirect('/login');
}