import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

vi.mock("next/image", async () => {
  const React = await import("react");

  return {
    default: (
      props: React.ComponentProps<"img"> & {
        fill?: boolean;
        priority?: boolean;
      },
    ) => {
      const imageProps = { ...props };
      delete imageProps.fill;
      delete imageProps.priority;
      return React.createElement("img", imageProps);
    },
  };
});

vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: ({ href, ...props }: React.ComponentProps<"a">) =>
      React.createElement("a", { href, ...props }),
  };
});

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));
