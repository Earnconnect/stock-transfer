import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Meridian Transfer — IRA & Equity Custody Platform",
  description:
    "Institutional-grade platform to browse bulk equities, verify IRS/IRA eligibility, and initiate ACATS transfers between brokerages.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
