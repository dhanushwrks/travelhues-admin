import type { Metadata } from "next";
import { Sora } from "next/font/google";

import { Desk } from "@/components/desk";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: {
    default: "Desk",
    template: "%s · Travelhues desk",
  },
  description: "Edit Travelhues stories and the settings the app and API follow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full bg-mist font-sans text-ink">
        <Desk>{children}</Desk>
      </body>
    </html>
  );
}
