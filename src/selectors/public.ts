const auth = {
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

const category = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true,
    },
  },
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
  createdAt: true,
  updatedAt: true,
};

const order = {
  id: true,
  price: true,
  status: true,
};

const orderToProduct = {
  id: true,
  price: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
};

const review = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
};

export const publicSelector = {
  auth,
  category,
  product,
  order,
  orderToProduct,
  review,
};
