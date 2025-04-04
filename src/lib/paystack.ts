import axios from "axios";

import { env } from "~/lib/env";

const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export { paystackClient };
