import ServiceVariant from "../models/service-variants.model.js";

export const createServiceVariant = async (serviceVariantData) => {
  return await ServiceVariant.create(serviceVariantData);
};

export const getServiceVariants = async () => {
  return await ServiceVariant.find();
};
