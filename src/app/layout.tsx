import "./globals.css";
import localFont from "next/font/local";
import { Toaster } from "sonner";

const hsr = localFont({ src: "./fonts/HSR.woff2" });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${hsr.className} antialiased`}>
                <Toaster richColors />
                {children}
            </body>
        </html>
    );
}
