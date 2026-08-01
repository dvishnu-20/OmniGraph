import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniGraph | Zero-GPU Generative UI Data Copilot',
  description: 'Voice-driven Generative UI Data Copilot running entirely on Arm CPU server without GPU.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
