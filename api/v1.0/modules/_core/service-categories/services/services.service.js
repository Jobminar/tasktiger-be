import Service from "../models/services.js";

export const createService = async (serviceData) => {
  return await Service.create(serviceData);
};

export const getServices = async () => {
  return await Service.find();
};
