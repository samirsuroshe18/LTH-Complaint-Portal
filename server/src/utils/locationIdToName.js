// utils/locationUtils.js
export const locationIdToName = (id) => {
  const map = {
    0: "Unknown Location",
    1: "Main Entrance",
    2: "Reception Lobby",
    3: "Building A - Ground Floor",
    4: "Building A - First Floor",
    5: "Building A - Second Floor",
    6: "Building B - Ground Floor",
    7: "Building B - First Floor",
    8: "Building B - Second Floor",
    9: "Canteen Area",
    10: "Pantry - First Floor",
    11: "Pantry - Second Floor",
    12: "Restroom - Ground Floor",
    13: "Restroom - First Floor",
    14: "Restroom - Second Floor",
    15: "Conference Room 1",
    16: "Conference Room 2",
    17: "Server Room - IT Department",
    18: "Electrical Room",
    19: "Parking Area - Basement",
    20: "Rooftop Utility Zone"
  };

  return map[id] || "Unknown Location";
};
