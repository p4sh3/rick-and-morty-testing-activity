import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import RootLayout, { metadata } from "@/app/layout";
import Loading from "@/app/loading";
import CharacterPage from "@/app/character/[id]/page";
import Home from "@/app/page";
import type { Character, Episode } from "@/types/rickandmorty";

const { getCharacters, getCharacter, getEpisodes } = vi.hoisted(() => ({
  getCharacters: vi.fn(),
  getCharacter: vi.fn(),
  getEpisodes: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ getCharacters, getCharacter, getEpisodes }));

const character: Character = {
  id: 1,
  name: "Rick Sanchez",
  status: "Alive",
  species: "Human",
  type: "Genius",
  gender: "Male",
  origin: { name: "Earth (C-137)", url: "" },
  location: { name: "Citadel of Ricks", url: "" },
  image: "https://example.com/rick.png",
  episode: [
    "https://rickandmortyapi.com/api/episode/1",
    "https://rickandmortyapi.com/api/episode/2",
  ],
  url: "",
  created: "2017-11-04T18:48:46.250Z",
};

const episode: Episode = {
  id: 1,
  name: "Pilot",
  air_date: "December 2, 2013",
  episode: "S01E01",
  characters: [],
  url: "",
  created: "",
};

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("Root layout", () => {
  it("provides the shared navigation, content region, and metadata", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <p>Character collection</p>
      </RootLayout>,
    );
    const renderedDocument = new DOMParser().parseFromString(
      markup,
      "text/html",
    );

    expect(metadata.title).toBe("Rick and Morty Explorer");
    expect(renderedDocument.documentElement.getAttribute("lang")).toBe("en");
    expect(
      renderedDocument.querySelector("header a")?.getAttribute("href"),
    ).toBe("/");
    expect(renderedDocument.querySelector("nav a")?.textContent).toContain(
      "Characters",
    );
    expect(renderedDocument.body.textContent).toContain("Character collection");
    expect(renderedDocument.querySelector("footer")?.textContent).toContain(
      "Data provided by",
    );
  });
});

describe("Home page", () => {
  it("loads and displays the requested page of characters", async () => {
    getCharacters.mockResolvedValue({
      info: { pages: 4 },
      results: [character],
    });

    render(await Home({ searchParams: Promise.resolve({ page: "2" }) }));

    expect(getCharacters).toHaveBeenCalledWith(2);
    expect(
      screen.getByRole("heading", { name: "Rick and Morty Characters" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Rick Sanchez" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
  });

  it("uses page one when page is missing or repeated", async () => {
    getCharacters.mockResolvedValue({ info: { pages: 1 }, results: [] });

    render(await Home({ searchParams: Promise.resolve({}) }));
    expect(getCharacters).toHaveBeenLastCalledWith(1);

    render(await Home({ searchParams: Promise.resolve({ page: ["2", "3"] }) }));
    expect(getCharacters).toHaveBeenLastCalledWith(1);
  });
});

describe("Character detail page", () => {
  it("shows character details and episodes", async () => {
    getCharacter.mockResolvedValue(character);
    getEpisodes.mockResolvedValue([
      episode,
      { ...episode, id: 2, episode: "S01E02" },
    ]);

    render(await CharacterPage({ params: Promise.resolve({ id: "1" }) }));

    expect(getCharacter).toHaveBeenCalledWith("1");
    expect(getEpisodes).toHaveBeenCalledWith(["1", "2"]);
    expect(
      screen.getByRole("heading", { name: "Rick Sanchez" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Genius")).toBeInTheDocument();
    expect(screen.getByText("November 4, 2017")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Episodes (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("S01E01")).toBeInTheDocument();
    expect(screen.getByText("S01E02")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "← Back to Characters" }),
    ).toHaveAttribute("href", "/");
  });

  it.each([
    ["Dead", "bg-red-500"],
    ["unknown", "bg-gray-500"],
  ])(
    "handles %s status, an empty type, and no episodes",
    async (status, color) => {
      getCharacter.mockResolvedValue({
        ...character,
        status,
        type: "",
        episode: [],
      });
      getEpisodes.mockResolvedValue([]);

      const { container } = render(
        await CharacterPage({ params: Promise.resolve({ id: "9" }) }),
      );

      expect(screen.getByText(`${status} - Human`)).toBeInTheDocument();
      expect(screen.getByText("Unknown")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Episodes (0)" }),
      ).toBeInTheDocument();
      expect(container.querySelector(`.${color}`)).toBeInTheDocument();
    },
  );
});

describe("Loading state", () => {
  it("renders eight character skeletons", () => {
    const { container } = render(<Loading />);

    expect(container.querySelectorAll(".grid > div")).toHaveLength(8);
  });
});

describe("Error state", () => {
  it("logs the error and retries the segment when requested", () => {
    const error = new Error("Network unavailable");
    const reset = vi.fn();
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ErrorPage error={error} reset={reset} />);

    expect(
      screen.getByText(/couldn't load the characters/i),
    ).toBeInTheDocument();
    expect(logError).toHaveBeenCalledWith(error);
    screen.getByRole("button", { name: "Try again" }).click();
    expect(reset).toHaveBeenCalledOnce();
  });
});
