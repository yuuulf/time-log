import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { darkFaviconMedia, favicons } from "./favicons";
import { RecordingFavicon } from "./RecordingFavicon";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

/** メタデータが出すのと同じ、通常用のファビコン 2 つを `<head>` に置く */
function addNormalFavicons() {
  document.head.innerHTML = `
    <link rel="icon" href="${favicons.normal.light}" type="image/png">
    <link rel="icon" href="${favicons.normal.dark}" type="image/png" media="${darkFaviconMedia}">
  `;
}

function iconLinks() {
  return [
    ...document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'),
  ].map((link) => ({
    href: link.getAttribute("href"),
    media: link.getAttribute("media"),
  }));
}

const normal = [
  { href: favicons.normal.light, media: null },
  { href: favicons.normal.dark, media: darkFaviconMedia },
];
const recording = [
  { href: favicons.recording.light, media: null },
  { href: favicons.recording.dark, media: darkFaviconMedia },
];

beforeEach(() => {
  navigation.pathname = "/";
  addNormalFavicons();
});

afterEach(() => {
  document.head.innerHTML = "";
});

test("記録中ならファビコンを記録中用にし、media は変えない", () => {
  render(<RecordingFavicon recording />);
  expect(iconLinks()).toEqual(recording);
});

test("記録中でなければ通常用のまま", () => {
  render(<RecordingFavicon recording={false} />);
  expect(iconLinks()).toEqual(normal);
});

test("記録中でなくなると通常用に戻る", () => {
  const { rerender } = render(<RecordingFavicon recording />);
  rerender(<RecordingFavicon recording={false} />);
  expect(iconLinks()).toEqual(normal);
});

test("記録中になると記録中用に変わる", () => {
  const { rerender } = render(<RecordingFavicon recording={false} />);
  rerender(<RecordingFavicon recording />);
  expect(iconLinks()).toEqual(recording);
});

test("アンマウントすると通常用に戻る", () => {
  const { unmount } = render(<RecordingFavicon recording />);
  unmount();
  expect(iconLinks()).toEqual(normal);
});

test("ページを移動して <head> のファビコンが作り直されても記録中用にし直す", () => {
  const { rerender } = render(<RecordingFavicon recording />);
  addNormalFavicons();
  navigation.pathname = "/summary";
  rerender(<RecordingFavicon recording />);
  expect(iconLinks()).toEqual(recording);
});
