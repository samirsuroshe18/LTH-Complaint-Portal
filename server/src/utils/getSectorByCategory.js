/**
 * Maps a complaint category to its corresponding handling sector.
 * @param {string} category - The complaint category selected by the user.
 * @returns {string} sector - The department/sector responsible for handling it.
 */
export const getSectorByCategory = (category) => {
  const sectorMap = {
    Light: "Maintenance",
    AC: "Maintenance",
    Telephone: "IT",
    Technical: "IT",
    HouseKeeping: "Housekeeping",
    Carpentry: "Maintenance",
    Danger: "Security",
    Other: "General Services"
  };

  return sectorMap[category] || "General Services";
};
