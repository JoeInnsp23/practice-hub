import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/practice-hub');
  }

  redirect('/sign-in');
}
