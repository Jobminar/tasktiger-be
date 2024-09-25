import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const getAccessToken = async () => {
  const url = process.env.MAPMYINDIA_OAUTH_URL;
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.MAPMYINDIA_CLIENT_ID,
    client_secret: process.env.MAPMYINDIA_CLIENT_SECRET,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Error fetching access token: ${response.statusText}`);
  }

  const { access_token } = await response.json();
  return access_token;
};

const getGeocode = async (address) => {
  const token = await getAccessToken();
  const url = `${process.env.MAPMYINDIA_GEOCODE_URL}?address=${encodeURIComponent(address)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching geocode: ${response.statusText}`);
  }

  return response.json();
};

export { getGeocode };
