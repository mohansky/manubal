// src/lib/db.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Raw Turso client for your existing functions
export const rawDb = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

// Drizzle instance for Better Auth
const authClient = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(authClient, { schema });

// Keep all your existing functions but update them to use rawDb
export interface Admin {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export async function getAdminByUsername(username: string): Promise<Admin | null> {
  try {
    const result = await rawDb.execute({
      sql: 'SELECT * FROM admins WHERE username = ?',
      args: [username]
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as number,
      username: row.username as string,
      password: row.password as string,
      created_at: row.created_at as string,
    };
  } catch (error) {
    console.error('Error fetching admin:', error);
    return null;
  }
}

export async function logAdminAction(adminId: number, action: string, ipAddress?: string) {
  try {
    await rawDb.execute({
      sql: 'INSERT INTO admin_logs (admin_id, action, ip_address) VALUES (?, ?, ?)',
      args: [adminId, action, ipAddress || null]
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function createAdmin(username: string, hashedPassword: string) {
  try {
    const result = await rawDb.execute({
      sql: 'INSERT INTO admins (username, password) VALUES (?, ?)',
      args: [username, hashedPassword]
    });
    
    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

export async function createCustomer(customerData: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address: string;
  city: string;
  zipCode: string;
  state: string;
}) {
  try {
    const existingCustomer = await rawDb.execute({
      sql: 'SELECT * FROM customers WHERE email = ?',
      args: [customerData.email]
    });

    let customerId: number;

    if (existingCustomer.rows.length > 0) {
      customerId = Number(existingCustomer.rows[0].id);
     
      await rawDb.execute({
        sql: `
          UPDATE customers
          SET first_name = ?, last_name = ?, phone_number = ?, address = ?, city = ?, zip_code = ?, state = ?
          WHERE id = ?
        `,
        args: [
          customerData.firstName,
          customerData.lastName,
          customerData.phoneNumber || null,
          customerData.address,
          customerData.city,
          customerData.zipCode,
          customerData.state,
          customerId
        ]
      });
    } else {
      const result = await rawDb.execute({
        sql: `
          INSERT INTO customers (first_name, last_name, email, phone_number, address, city, zip_code, state, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [
          customerData.firstName,
          customerData.lastName,
          customerData.email,
          customerData.phoneNumber || null,
          customerData.address,
          customerData.city,
          customerData.zipCode,
          customerData.state
        ]
      });
     
      customerId = Number(result.lastInsertRowid);
    }
   
    return customerId;
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    throw error;
  }
}

export async function createOrder(orderData: {
  customerId: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}) {
  try {
    const orderResult = await rawDb.execute({
      sql: `
        INSERT INTO orders (customer_id, subtotal, shipping, tax, total, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      args: [
        orderData.customerId,
        orderData.subtotal,
        orderData.shipping,
        orderData.tax,
        orderData.total,
        'pending'
      ]
    });
   
    const orderId = Number(orderResult.lastInsertRowid);
   
    for (const item of orderData.items) {
      await rawDb.execute({
        sql: `
          INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.price * item.quantity
        ]
      });
    }
   
    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function getAllCustomers() {
  try {
    const result = await rawDb.execute({
      sql: 'SELECT * FROM customers ORDER BY created_at DESC'
    });
    return result.rows;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

export async function getAllOrders() {
  try {
    const result = await rawDb.execute({
      sql: `
        SELECT o.*, c.first_name, c.last_name, c.email 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.created_at DESC
      `
    });
    return result.rows;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function getOrderById(orderId: number) {
  try {
    const orderResult = await rawDb.execute({
      sql: `
        SELECT o.*, c.first_name, c.last_name, c.email, c.phone_number, c.address, c.city, c.state, c.zip_code
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = ?
      `,
      args: [orderId]
    });

    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];

    const itemsResult = await rawDb.execute({
      sql: 'SELECT * FROM order_items WHERE order_id = ?',
      args: [orderId]
    });

    return {
      ...order,
      items: itemsResult.rows
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    await rawDb.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, orderId]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}


// // src/lib/db.ts
// import { createClient } from '@libsql/client';
// // import * as schema from './schema';
// // // export const db = drizzle(client, { schema });

// // Create Turso client with your database URL and auth token
// export const db = createClient({
//   url: import.meta.env.TURSO_DATABASE_URL,
//   authToken: import.meta.env.TURSO_AUTH_TOKEN,
// });

// // Admin interface
// export interface Admin {
//   id: number;
//   username: string;
//   password: string;
//   created_at: string;
// }

// // Admin authentication functions
// export async function getAdminByUsername(username: string): Promise<Admin | null> {
//   try {
//     const result = await db.execute({
//       sql: 'SELECT * FROM admins WHERE username = ?',
//       args: [username]
//     });
    
//     if (result.rows.length === 0) return null;
    
//     const row = result.rows[0];
//     return {
//       id: row.id as number,
//       username: row.username as string,
//       password: row.password as string,
//       created_at: row.created_at as string,
//     };
//   } catch (error) {
//     console.error('Error fetching admin:', error);
//     return null;
//   }
// }

// export async function logAdminAction(adminId: number, action: string, ipAddress?: string) {
//   try {
//     await db.execute({
//       sql: 'INSERT INTO admin_logs (admin_id, action, ip_address) VALUES (?, ?, ?)',
//       args: [adminId, action, ipAddress || null]
//     });
//   } catch (error) {
//     console.error('Error logging admin action:', error);
//   }
// }

// export async function createAdmin(username: string, hashedPassword: string) {
//   try {
//     const result = await db.execute({
//       sql: 'INSERT INTO admins (username, password) VALUES (?, ?)',
//       args: [username, hashedPassword]
//     });
    
//     return Number(result.lastInsertRowid);
//   } catch (error) {
//     console.error('Error creating admin:', error);
//     throw error;
//   }
// }

// // Your existing customer functions
// export async function createCustomer(customerData: {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phoneNumber?: string;
//   address: string;
//   city: string;
//   zipCode: string;
//   state: string;
// }) {
//   try {
//     // Check if customer already exists (using email as unique identifier)
//     const existingCustomer = await db.execute({
//       sql: 'SELECT * FROM customers WHERE email = ?',
//       args: [customerData.email]
//     });

//     let customerId: number;

//     if (existingCustomer.rows.length > 0) {
//       // Update existing customer
//       customerId = Number(existingCustomer.rows[0].id);
     
//       await db.execute({
//         sql: `
//           UPDATE customers
//           SET first_name = ?, last_name = ?, phone_number = ?, address = ?, city = ?, zip_code = ?, state = ?
//           WHERE id = ?
//         `,
//         args: [
//           customerData.firstName,
//           customerData.lastName,
//           customerData.phoneNumber || null,
//           customerData.address,
//           customerData.city,
//           customerData.zipCode,
//           customerData.state,
//           customerId
//         ]
//       });
//     } else {
//       // Create new customer
//       const result = await db.execute({
//         sql: `
//           INSERT INTO customers (first_name, last_name, email, phone_number, address, city, zip_code, state, created_at)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
//         `,
//         args: [
//           customerData.firstName,
//           customerData.lastName,
//           customerData.email,
//           customerData.phoneNumber || null,
//           customerData.address,
//           customerData.city,
//           customerData.zipCode,
//           customerData.state
//         ]
//       });
     
//       customerId = Number(result.lastInsertRowid);
//     }
   
//     return customerId;
//   } catch (error) {
//     console.error('Error creating/updating customer:', error);
//     throw error;
//   }
// }

// // Your existing order function
// export async function createOrder(orderData: {
//   customerId: number;
//   items: Array<{
//     id: string;
//     name: string;
//     price: number;
//     quantity: number;
//   }>;
//   subtotal: number;
//   shipping: number;
//   tax: number;
//   total: number;
// }) {
//   try {
//     // Create the order
//     const orderResult = await db.execute({
//       sql: `
//         INSERT INTO orders (customer_id, subtotal, shipping, tax, total, status, created_at)
//         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
//       `,
//       args: [
//         orderData.customerId,
//         orderData.subtotal,
//         orderData.shipping,
//         orderData.tax,
//         orderData.total,
//         'pending' // Initial status
//       ]
//     });
   
//     const orderId = Number(orderResult.lastInsertRowid);
   
//     // Store order items
//     for (const item of orderData.items) {
//       await db.execute({
//         sql: `
//           INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total)
//           VALUES (?, ?, ?, ?, ?, ?)
//         `,
//         args: [
//           orderId,
//           item.id,
//           item.name,
//           item.price,
//           item.quantity,
//           item.price * item.quantity
//         ]
//       });
//     }
   
//     return orderId;
//   } catch (error) {
//     console.error('Error creating order:', error);
//     throw error;
//   }
// }

// // Additional utility functions for admin management
// export async function getAllCustomers() {
//   try {
//     const result = await db.execute({
//       sql: 'SELECT * FROM customers ORDER BY created_at DESC'
//     });
//     return result.rows;
//   } catch (error) {
//     console.error('Error fetching customers:', error);
//     throw error;
//   }
// }

// export async function getAllOrders() {
//   try {
//     const result = await db.execute({
//       sql: `
//         SELECT o.*, c.first_name, c.last_name, c.email 
//         FROM orders o 
//         JOIN customers c ON o.customer_id = c.id 
//         ORDER BY o.created_at DESC
//       `
//     });
//     return result.rows;
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     throw error;
//   }
// }

// export async function getOrderById(orderId: number) {
//   try {
//     const orderResult = await db.execute({
//       sql: `
//         SELECT o.*, c.first_name, c.last_name, c.email, c.phone_number, c.address, c.city, c.state, c.zip_code
//         FROM orders o 
//         JOIN customers c ON o.customer_id = c.id 
//         WHERE o.id = ?
//       `,
//       args: [orderId]
//     });

//     if (orderResult.rows.length === 0) return null;

//     const order = orderResult.rows[0];

//     // Get order items
//     const itemsResult = await db.execute({
//       sql: 'SELECT * FROM order_items WHERE order_id = ?',
//       args: [orderId]
//     });

//     return {
//       ...order,
//       items: itemsResult.rows
//     };
//   } catch (error) {
//     console.error('Error fetching order:', error);
//     throw error;
//   }
// }

// export async function updateOrderStatus(orderId: number, status: string) {
//   try {
//     await db.execute({
//       sql: 'UPDATE orders SET status = ? WHERE id = ?',
//       args: [status, orderId]
//     });
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     throw error;
//   }
// }