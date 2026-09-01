import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        {/* Ahrefs Web Analytics */}
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="QPMP/qopoDVG9YzxBPI+5w" async />
        <ScrollViewStyleReset />
        {/* Progressive enhancement, two purposes.
            1. The root route ships a static SEO intro (components/home/HomeHeroSEO)
               so "/" has real crawlable HTML. Browsers with JS should never see it:
               this runs before the body paints, so #seo-hero is hidden from the
               first frame and the app boots in its place. No-JS clients and
               crawlers (which is what our citations come from) still get it.
            2. Web scroll containers use OS overlay scrollbars, which are invisible
               at rest, so long lists look like they end. Give them a visible track. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-js','1')` }} />
        <style dangerouslySetInnerHTML={{ __html: `
#app-boot{display:none}
html[data-js="1"] #seo-hero{display:none!important}
html[data-js="1"] #app-boot{display:flex!important}
@media (pointer:fine){
  [data-js="1"] *::-webkit-scrollbar{width:10px;height:10px}
  [data-js="1"] *::-webkit-scrollbar-thumb{background:rgba(36,26,16,.28);border-radius:8px;border:3px solid transparent;background-clip:content-box}
  [data-js="1"] *::-webkit-scrollbar-thumb:hover{background:rgba(36,26,16,.45);background-clip:content-box}
  [data-js="1"] *::-webkit-scrollbar-track{background:transparent}
}
` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
