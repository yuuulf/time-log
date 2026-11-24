import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { darkFaviconMedia, favicons } from "@/components/layout/favicons";
import { Sidebar } from "@/components/layout/Sidebar";
import { messages } from "@/lib/messages";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // タブのタイトルは、どのページでもアプリ名だけにする（ページ名は付けない）
  title: messages.app.name,
  description: messages.app.description,
  // ファビコンはブラウザ・OS のライト・ダークに合わせて出し分ける。
  // media に対応していないブラウザでもロゴが出るよう、ライト用は media なしにする。
  // 記録中は RecordingFavicon がこの href を記録中用に書き換える
  icons: {
    icon: [
      { url: favicons.normal.light, type: "image/png" },
      {
        url: favicons.normal.dark,
        type: "image/png",
        media: darkFaviconMedia,
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col md:flex-row">
        <Sidebar />
        {children}
      </body>
    </html>
  );
}
