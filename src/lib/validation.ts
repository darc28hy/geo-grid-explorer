/**
 * Validate and parse latitude/longitude string inputs.
 * Returns parsed coordinates on success, or an error message string on failure.
 */
export function validateLatLng(
  latStr: string,
  lngStr: string,
): { lat: number; lng: number } | string {
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng)) {
    return "Please enter valid numbers";
  }
  if (lat < -90 || lat > 90) {
    return "Latitude must be between -90 and 90";
  }
  if (lng < -180 || lng > 180) {
    return "Longitude must be between -180 and 180";
  }
  return { lat, lng };
}
