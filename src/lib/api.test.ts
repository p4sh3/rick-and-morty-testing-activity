import { afterEach, describe, expect, it, vi } from "vitest";
import { getCharacter, getCharacters, getEpisodes } from "@/lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Rick and Morty API client", () => {
  it("fetches the first character page by default", async () => {
    const payload = { info: { pages: 1 }, results: [] };
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => payload });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCharacters()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://rickandmortyapi.com/api/character?page=1",
    );
  });

  it("fetches a requested character page", async () => {
    const payload = { info: { pages: 4 }, results: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => payload }),
    );

    await expect(getCharacters(3)).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      "https://rickandmortyapi.com/api/character?page=3",
    );
  });

  it("rejects when the character list request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(getCharacters()).rejects.toThrow("Failed to fetch characters");
  });

  it("fetches a character by id", async () => {
    const character = { id: 7, name: "Example" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => character }),
    );

    await expect(getCharacter("7")).resolves.toEqual(character);
    expect(fetch).toHaveBeenCalledWith(
      "https://rickandmortyapi.com/api/character/7",
    );
  });

  it("rejects when a character request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(getCharacter("404")).rejects.toThrow(
      "Failed to fetch character details",
    );
  });

  it("returns no episodes without making a request for an empty id list", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getEpisodes([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes a single episode response to an array", async () => {
    const episode = { id: 1, name: "Pilot" };
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => episode });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getEpisodes(["1"])).resolves.toEqual([episode]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://rickandmortyapi.com/api/episode/1",
    );
  });

  it("preserves multiple episodes and rejects failed requests", async () => {
    const episodes = [{ id: 1 }, { id: 2 }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => episodes });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getEpisodes(["1", "2"])).resolves.toEqual(episodes);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://rickandmortyapi.com/api/episode/1,2",
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(getEpisodes(["3"])).rejects.toThrow(
      "Failed to fetch episodes",
    );
  });
});
