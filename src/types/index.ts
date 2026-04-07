export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface AccessCode {
  id: string;
  code: string;
  max_uses: number;
  used_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  created_at: string;
}

export interface Movement {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  type: 'in' | 'out';
  created_at: string;
  // Joined fields
  product_name?: string;
}

export interface Session {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
