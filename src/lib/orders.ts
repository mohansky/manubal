// src/lib/orders.ts
import { rawDb as db } from './db';

export interface OrderSummary {
  id: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface OrderDetail {
  id: number;
  customerId: number;
  customerName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

// Function to get all orders with basic summary info
export async function getAllOrders(): Promise<OrderSummary[]> {
  try {
    const result = await db.execute({
      sql: `
        SELECT
          o.id,
          (c.first_name || ' ' || c.last_name) AS customer_name,
          o.total,
          o.status,
          o.created_at,
          COUNT(oi.id) AS item_count
        FROM
          orders o
        JOIN
          customers c ON o.customer_id = c.id
        LEFT JOIN
          order_items oi ON o.id = oi.order_id
        GROUP BY
          o.id
        ORDER BY
          o.created_at DESC
      `
    });

    return result.rows.map(row => ({
      id: Number(row.id),
      customerName: row.customer_name as string,
      total: Number(row.total),
      status: row.status as string,
      createdAt: row.created_at as string,
      itemCount: Number(row.item_count)
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Function to get detailed order information
export async function getOrderById(orderId: number): Promise<OrderDetail | null> {
  try {
    // Get order and customer information
    const orderResult = await db.execute({
      sql: `
        SELECT
          o.*,
          c.first_name,
          c.last_name,
          c.email,
          c.phone_number,
          c.address,
          c.city,
          c.state,
          c.zip_code
        FROM
          orders o
        JOIN
          customers c ON o.customer_id = c.id
        WHERE
          o.id = ?
      `,
      args: [orderId]
    });

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await db.execute({
      sql: `
        SELECT * FROM order_items
        WHERE order_id = ?
      `,
      args: [orderId]
    });

    const items: OrderItem[] = itemsResult.rows.map(item => ({
      id: Number(item.id),
      productId: item.product_id as string,
      productName: item.product_name as string,
      price: Number(item.price),
      quantity: Number(item.quantity),
      total: Number(item.total)
    }));

    return {
      id: Number(order.id),
      customerId: Number(order.customer_id),
      customerName: `${order.first_name} ${order.last_name}`,
      email: order.email as string,
      phoneNumber: String(order.phone_number || ''),
      address: order.address as string,
      city: order.city as string,
      state: order.state as string,
      zipCode: order.zip_code as string,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
      status: order.status as string,
      createdAt: order.created_at as string,
      items
    };
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw error;
  }
}

// Function to update order status
export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  try {
    await db.execute({
      sql: `
        UPDATE orders
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `,
      args: [status, orderId]
    });
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error);
    throw error;
  }
}

// Function to delete an order and its related data
export async function deleteOrder(orderId: number): Promise<boolean> {
  try {
    // First, delete order items
    await db.execute({
      sql: `DELETE FROM order_items WHERE order_id = ?`,
      args: [orderId]
    });

    // Then delete the order
    const result = await db.execute({
      sql: `DELETE FROM orders WHERE id = ?`,
      args: [orderId]
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
    throw error;
  }
}

// Function to create a new order with customer
export async function createOrder(orderData: {
  // Customer information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  // Order information
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}): Promise<{ orderId: number; customerId: number }> {
  try {
    // Start a transaction-like approach by checking if customer exists first
    let customerId: number;

    // Check if customer exists by email
    const existingCustomerResult = await db.execute({
      sql: `SELECT id FROM customers WHERE email = ?`,
      args: [orderData.email]
    });

    if (existingCustomerResult.rows.length > 0) {
      customerId = Number(existingCustomerResult.rows[0].id);
      
      // Update existing customer with new info (in case they changed address, phone, etc.)
      await db.execute({
        sql: `
          UPDATE customers 
          SET first_name = ?, last_name = ?, phone_number = ?, 
              address = ?, city = ?, state = ?, zip_code = ?
          WHERE id = ?
        `,
        args: [
          orderData.firstName,
          orderData.lastName,
          orderData.phoneNumber || null,
          orderData.address,
          orderData.city,
          orderData.state,
          orderData.zipCode,
          customerId
        ]
      });
    } else {
      // Create new customer
      const customerResult = await db.execute({
        sql: `
          INSERT INTO customers (
            first_name, last_name, email, phone_number, 
            address, city, state, zip_code, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        args: [
          orderData.firstName,
          orderData.lastName,
          orderData.email,
          orderData.phoneNumber || null,
          orderData.address,
          orderData.city,
          orderData.state,
          orderData.zipCode
        ]
      });
      
      customerId = Number(customerResult.lastInsertRowid);
    }

    // Create the order
    const orderResult = await db.execute({
      sql: `
        INSERT INTO orders (
          customer_id, subtotal, shipping, tax, total, 
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
      `,
      args: [
        customerId,
        orderData.subtotal,
        orderData.shipping,
        orderData.tax,
        orderData.total
      ]
    });

    const orderId = Number(orderResult.lastInsertRowid);

    // Create order items
    for (const item of orderData.cartItems) {
      await db.execute({
        sql: `
          INSERT INTO order_items (
            order_id, product_id, product_name, price, quantity, total
          ) VALUES (?, ?, ?, ?, ?, ?)
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

    return { orderId, customerId };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}