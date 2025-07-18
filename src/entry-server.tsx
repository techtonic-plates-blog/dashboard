// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { JSX } from "solid-js";



type DocumentProps = {
  assets: JSX.Element;
  children: JSX.Element;
  scripts: JSX.Element;
};

export function Document({ assets, children, scripts }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {assets}
      </head>
      <body>
        <div id="app">{children}</div>
        {scripts}
      </body>
    </html>
  )
}

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (

      <Document assets={assets} scripts={scripts}>
        {children}
      </Document>

    )}
  />
));
