import axios from "axios";

export const getComplaints = async (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });
  searchParams.append('ts', Date.now());
  const res = await axios.get(`/api/v1/complaint/get-complaints?${searchParams.toString()}`, {
    withCredentials: true,
  });
  return res.data;
};

export const submitComplaint = async (formData) => {
  const res = await axios.post(`/api/v1/complaint/submit`, formData, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Add more API functions as needed (e.g., updateComplaint, resolveComplaint, etc.) 