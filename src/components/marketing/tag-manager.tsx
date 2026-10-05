import Script from "next/script";

export const CONSENT_STORAGE_KEY = "allship-consent-v1";

export const consentDefaultsScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;var gpc=navigator.globalPrivacyControl===true;gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied",functionality_storage:"granted",security_storage:"granted",wait_for_update:500});gtag("set","ads_data_redaction",true);try{var c=JSON.parse(localStorage.getItem("${CONSENT_STORAGE_KEY}")||"null");if(c){gtag("consent","update",{analytics_storage:c.analytics?"granted":"denied",ad_storage:c.ads&&!gpc?"granted":"denied",ad_user_data:c.ads&&!gpc?"granted":"denied",ad_personalization:c.ads&&!gpc?"granted":"denied"})}}catch(e){}`;

export function TagManager({ gtmId }: { gtmId?: string }) {
  if (!gtmId) return null;
  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  );
}

