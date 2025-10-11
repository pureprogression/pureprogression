"use client";

import Script from 'next/script';

export default function GoogleAnalytics({ GA_TRACKING_ID }) {
  console.log('GA_TRACKING_ID:', GA_TRACKING_ID);
  if (!GA_TRACKING_ID) {
    console.log('No GA_TRACKING_ID provided');
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}
