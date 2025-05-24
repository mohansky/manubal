// src/pages/api/checkout.ts
import type { APIRoute } from 'astro';
import { createOrder } from '../../lib/orders'; 
import { sendOrderConfirmationEmail } from '@/lib/email';

// Define both POST and GET handlers to ensure proper routing
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode', 'cartItems'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return new Response(JSON.stringify({
          success: false,
          error: `Missing required field: ${field}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate cart items
    if (!Array.isArray(data.cartItems) || data.cartItems.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cart is empty'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate totals
    const subtotal = data.cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 50 : 0;
    const tax = subtotal * 0.05; // 5% GST
    const total = subtotal + shipping + tax;

    // Create order data with phone number included
    const orderData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber, // Include phone number
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      cartItems: data.cartItems,
      subtotal,
      shipping,
      tax,
      total
    };

    console.log('Creating order with data:', orderData);

    // Create the order using the orders.ts function
    const { orderId, customerId } = await createOrder(orderData);

    console.log(`Order created successfully: Order ID ${orderId}, Customer ID ${customerId}`);

    // Prepare email data
    const emailData = {
      customerName: `${data.firstName} ${data.lastName}`,
      customerEmail: data.email,
      orderId: orderId,
      orderDate: new Date().toISOString(),
      items: data.cartItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress: {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode
      }
    };

    // Send order confirmation email
    let emailSent = false;
    try {
      emailSent = await sendOrderConfirmationEmail(emailData);
      if (emailSent) {
        console.log('Order confirmation email sent successfully');
      } else {
        console.warn('Failed to send order confirmation email');
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Don't fail the order if email fails - just log the error
    }

    return new Response(JSON.stringify({
      success: true,
      orderId,
      customerId,
      emailSent,
      redirectUrl: `/order-success?orderId=${orderId}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Checkout API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process order. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Add a GET handler for options/preflight requests
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ message: 'Checkout API endpoint' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};