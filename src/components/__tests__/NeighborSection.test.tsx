// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NeighborSection } from "../NeighborSection";

// Mock clipboard API
const writeTextMock = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  writeTextMock.mockClear();
  vi.stubGlobal("navigator", {
    ...navigator,
    clipboard: { writeText: writeTextMock },
  });
});

const GEOHEX_NEIGHBORS = ["XM000", "XM001", "XM002", "XM003", "XM004", "XM005"];
const GEOHASH_NEIGHBORS = [
  "abc1",
  "abc2",
  "abc3",
  "abc4",
  "abc5",
  "abc6",
  "abc7",
  "abc8",
];

describe("NeighborSection", () => {
  describe("rendering", () => {
    it("displays neighbor count", () => {
      render(
        <NeighborSection mode="geohex" neighborCodes={GEOHEX_NEIGHBORS} />,
      );
      expect(screen.getByText("Neighbors (6)")).toBeTruthy();
    });

    it("shows all neighbor codes by default", () => {
      render(
        <NeighborSection mode="geohex" neighborCodes={GEOHEX_NEIGHBORS} />,
      );
      for (const code of GEOHEX_NEIGHBORS) {
        expect(screen.getByText(code)).toBeTruthy();
      }
    });

    it("displays 6 direction badges for geohex", () => {
      render(
        <NeighborSection mode="geohex" neighborCodes={GEOHEX_NEIGHBORS} />,
      );
      for (const dir of ["N", "NE", "SE", "S", "SW", "NW"]) {
        expect(screen.getByText(dir)).toBeTruthy();
      }
    });

    it("displays 8 direction badges for geohash", () => {
      render(
        <NeighborSection mode="geohash" neighborCodes={GEOHASH_NEIGHBORS} />,
      );
      for (const dir of ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]) {
        expect(screen.getByText(dir)).toBeTruthy();
      }
    });
  });

  describe("collapse/expand", () => {
    it("hides neighbor codes when header is clicked", () => {
      render(
        <NeighborSection mode="geohex" neighborCodes={GEOHEX_NEIGHBORS} />,
      );

      const toggle = screen.getByText("Neighbors (6)").closest("button")!;
      fireEvent.click(toggle);

      for (const code of GEOHEX_NEIGHBORS) {
        expect(screen.queryByText(code)).toBeNull();
      }
    });

    it("re-shows neighbor codes when header is clicked twice", () => {
      render(
        <NeighborSection mode="geohex" neighborCodes={GEOHEX_NEIGHBORS} />,
      );

      const toggle = screen.getByText("Neighbors (6)").closest("button")!;
      fireEvent.click(toggle); // collapse
      fireEvent.click(toggle); // expand

      for (const code of GEOHEX_NEIGHBORS) {
        expect(screen.getByText(code)).toBeTruthy();
      }
    });
  });

  describe("copy functionality", () => {
    it("copies all codes when 'Copy All' is clicked", () => {
      render(
        <NeighborSection mode="geohex" neighborCodes={GEOHEX_NEIGHBORS} />,
      );

      fireEvent.click(screen.getByText("Copy All"));

      expect(writeTextMock).toHaveBeenCalledWith(GEOHEX_NEIGHBORS.join("\n"));
    });
  });
});
