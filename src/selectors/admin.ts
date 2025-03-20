const auth = {
  id: true,
  email: true,
  status: true,
  role: true,
  isVerified: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
};

const profile = {
  id: true,
  pictureId: true,
  name: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
};

const category = {
  id: true,
  name: true,
  status: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
};

export const adminSelector = {
  auth,
  profile,
  category,
};
