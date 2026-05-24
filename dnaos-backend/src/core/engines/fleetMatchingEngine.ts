import type { Company } from "../../generated/prisma/client.js";

export type FleetCandidate = Pick<Company, "id" | "name"> & {
  serviceAreas?: string[];
};

export function filterAvailableFleet(
  fleetCompanies: FleetCandidate[],
  deliveryArea?: string
): FleetCandidate[] {
  if (!deliveryArea) return fleetCompanies;
  return fleetCompanies.filter((fleet) => {
    if (!fleet.serviceAreas || fleet.serviceAreas.length === 0) return true;
    return fleet.serviceAreas.some((area) =>
      deliveryArea.toLowerCase().includes(area.toLowerCase())
    );
  });
}

export function rankFleetCandidates(
  candidates: FleetCandidate[]
): FleetCandidate[] {
  return [...candidates];
}
