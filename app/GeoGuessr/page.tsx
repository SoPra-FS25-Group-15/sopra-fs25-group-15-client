"use client";

import dynamic from 'next/dynamic';

// Use dynamic import with ssr: false to completely disable server-side rendering
const GameComponent = dynamic(
  () => import('./GameComponent'),
  { ssr: false }
);

export default function Page() {
  return <GameComponent />;
}
