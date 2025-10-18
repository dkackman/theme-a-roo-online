import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA / Mobile */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* App Info */}
        <meta name="application-name" content="Theme-a-roo Online" />
        <meta name="apple-mobile-web-app-title" content="Theme-a-roo" />

        {/* Favicon */}
        <link rel="icon" href="/kangaroo.png" type="image/png" />
        <link rel="shortcut icon" href="/kangaroo.png" type="image/png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
