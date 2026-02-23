import { describe, it, expect } from "vitest";
import { validateLatLng } from "@/lib/validation";

describe("validateLatLng", () => {
  describe("valid inputs", () => {
    it("parses valid lat/lng", () => {
      const result = validateLatLng("35.6812", "139.7671");
      expect(result).toEqual({ lat: 35.6812, lng: 139.7671 });
    });

    it("parses zero coordinates", () => {
      const result = validateLatLng("0", "0");
      expect(result).toEqual({ lat: 0, lng: 0 });
    });

    it("accepts boundary values (-90, -180)", () => {
      const result = validateLatLng("-90", "-180");
      expect(result).toEqual({ lat: -90, lng: -180 });
    });

    it("accepts boundary values (90, 180)", () => {
      const result = validateLatLng("90", "180");
      expect(result).toEqual({ lat: 90, lng: 180 });
    });

    it("parses negative coordinates", () => {
      const result = validateLatLng("-33.8688", "151.2093");
      expect(result).toEqual({ lat: -33.8688, lng: 151.2093 });
    });

    it("parses integer strings", () => {
      const result = validateLatLng("45", "90");
      expect(result).toEqual({ lat: 45, lng: 90 });
    });
  });

  describe("invalid number format", () => {
    it("rejects non-numeric latitude", () => {
      expect(validateLatLng("abc", "139")).toBe("Please enter valid numbers");
    });

    it("rejects non-numeric longitude", () => {
      expect(validateLatLng("35", "xyz")).toBe("Please enter valid numbers");
    });

    it("rejects empty strings", () => {
      expect(validateLatLng("", "")).toBe("Please enter valid numbers");
    });

    it("rejects whitespace-only strings", () => {
      expect(validateLatLng("  ", "  ")).toBe("Please enter valid numbers");
    });
  });

  describe("out-of-range latitude", () => {
    it("rejects latitude > 90", () => {
      expect(validateLatLng("91", "0")).toBe(
        "Latitude must be between -90 and 90",
      );
    });

    it("rejects latitude < -90", () => {
      expect(validateLatLng("-91", "0")).toBe(
        "Latitude must be between -90 and 90",
      );
    });

    it("rejects extreme latitude", () => {
      expect(validateLatLng("1000", "0")).toBe(
        "Latitude must be between -90 and 90",
      );
    });
  });

  describe("out-of-range longitude", () => {
    it("rejects longitude > 180", () => {
      expect(validateLatLng("0", "181")).toBe(
        "Longitude must be between -180 and 180",
      );
    });

    it("rejects longitude < -180", () => {
      expect(validateLatLng("0", "-181")).toBe(
        "Longitude must be between -180 and 180",
      );
    });

    it("rejects extreme longitude", () => {
      expect(validateLatLng("0", "999")).toBe(
        "Longitude must be between -180 and 180",
      );
    });
  });

  describe("validation priority", () => {
    it("reports NaN before range errors", () => {
      // Both invalid format — NaN check comes first
      expect(validateLatLng("abc", "999")).toBe("Please enter valid numbers");
    });

    it("reports latitude range before longitude range", () => {
      // Both out of range — latitude is checked first
      expect(validateLatLng("100", "200")).toBe(
        "Latitude must be between -90 and 90",
      );
    });
  });
});
