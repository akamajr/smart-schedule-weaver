import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "@/index.css";

export const metadata: Metadata = {
  title: "SmartTimetable - AI Schedule Generator",
  description:
    "SmartTimetable: AI-powered schedule generator that detects conflicts, balances workloads, and optimizes class timetables.",
  authors: [{ name: "SmartTimetable" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "SmartTimetable - AI Schedule Generator",
    description: "Generate optimized class schedules in seconds with AI conflict detection.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
