import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improve loading performance
  fallback: ["system-ui", "arial"], // Add fallback fonts
  adjustFontFallback: false, // Disable to prevent layout shift
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Improve loading performance
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"], // Add fallback fonts
  adjustFontFallback: false, // Disable to prevent layout shift
});

export const metadata = {
  title: "PrepAI - AI Interview Practice Platform" ,
  description: "Practice interviews with AI voice agent. System Design, DSA, Development & more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          {children}
           <Toaster />
        </Provider>
      </body>
    </html>
  );
}
