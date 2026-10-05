import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CharacterCard from "@/components/CharacterCard";
import Pagination from "@/components/Pagination";
import type { Character } from "@/types/rickandmorty";

const character: Character = {
  id: 1,
  name: "Rick Sanchez",
  status: "Alive",
  species: "Human",
  type: "",
  gender: "Male",
  origin: { name: "Earth", url: "" },
  location: { name: "Citadel of Ricks", url: "" },
  image: "https://example.com/rick.png",
  episode: [],
  url: "",
  created: "2017-11-04T18:48:46.250Z",
};

describe("CharacterCard", () => {
  it.each([
    ["Alive", "bg-green-500"],
    ["Dead", "bg-red-500"],
    ["unknown", "bg-gray-500"],
    ["Other", "bg-gray-500"],
  ])("shows %s with the expected status indicator", (status, color) => {
    const testCharacter = { ...character, status } as Character;
    const { container } = render(<CharacterCard character={testCharacter} />);

    expect(
      screen.getByRole("heading", { name: "Rick Sanchez" }),
    ).toBeInTheDocument();
    expect(screen.getByText(`${status} - Human`)).toBeInTheDocument();
    expect(screen.getByText("Citadel of Ricks")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/character/1");
    expect(container.querySelector(`.${color}`)).toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it("disables previous on the first page and links to the next page", () => {
    render(<Pagination currentPage={1} totalPages={3} />);

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("← Previous").closest("span")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/?page=2",
    );
  });

  it("links to both neighboring pages in the middle", () => {
    render(<Pagination currentPage={2} totalPages={3} />);

    expect(screen.getByRole("link", { name: "← Previous" })).toHaveAttribute(
      "href",
      "/?page=1",
    );
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/?page=3",
    );
  });

  it("disables next on the last page", () => {
    render(<Pagination currentPage={3} totalPages={3} />);

    expect(screen.getByRole("link", { name: "← Previous" })).toHaveAttribute(
      "href",
      "/?page=2",
    );
    expect(screen.getByText("Next →").closest("span")).toBeInTheDocument();
  });
});
