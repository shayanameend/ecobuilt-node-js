const profile = {
  id: true,
  pictureId: true,
  name: true,
  description: true,
  phone: true,
  postalCode: true,
  city: true,
  pickupAddress: true,
  createdAt: true,
  updatedAt: true,
};

const product = {
  id: true,
  pictureIds: true,
  name: true,
  description: true,
  sku: true,
  stock: true,
  price: true,
  salePrice: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
};

export const vendorSelector = {
  profile,
  product,
};
