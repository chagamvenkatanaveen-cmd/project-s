import './globals.css';

export const metadata = {
  title: 'slipcord - Job Insights - Opportunity Guide',
  description: 'Job insights and opportunity guidance to help you find your next role.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="bg-white min-h-screen text-slate-900 antialiased selection:bg-[#167a42] selection:text-white">
        {children}
      </body>
    </html>
  );
}
