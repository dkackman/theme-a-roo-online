import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  // Blocking script to prevent FOUC (Flash of Unstyled Content)
  const blockingScript = `(function(){try{var t=localStorage.getItem('theme-name')||'light';document.documentElement.className='theme-'+t;document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t==='dark'?'dark':'light'}catch(e){console.error('Theme init error:',e)}})();`;

  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* Blocking script to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: blockingScript }} />

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
