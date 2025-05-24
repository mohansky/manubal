// src/lib/email.ts
import { Resend } from 'resend';
import { render } from '@react-email/render'; 
import OrderConfirmationEmail from '@/components/emails/OrderConfirmationEmail';

// Initialize Resend with your API key
const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderId: number;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export async function sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<boolean> {
  try {
    // Prepare email props with proper string conversions
    const emailProps = {
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      orderId: orderData.orderId.toString(),
      orderDate: orderData.orderDate,
      items: orderData.items,
      subtotal: orderData.subtotal.toFixed(2),
      shipping: orderData.shipping.toFixed(2),
      tax: orderData.tax.toFixed(2),
      total: orderData.total.toFixed(2),
      shippingAddress: orderData.shippingAddress
    };

    // Render the React email component to HTML
    const emailHtml = await render(OrderConfirmationEmail(emailProps));

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Manubal<mail@mohankumar.dev>', // Use your verified domain
      to: [orderData.customerEmail],
      subject: `Order Confirmation #${orderData.orderId} - Thank you for your purchase!`,
      html: emailHtml,
      // Optional: Add a plain text version
      text: `
        Thank you for your order, ${orderData.customerName}!
        
        Order Number: #${orderData.orderId}
        Order Date: ${orderData.orderDate}
        Total: ₹${orderData.total.toFixed(2)}
        
        We've received your order and are preparing it for shipment.
        You'll receive a tracking email once your order is on its way.
        
        Questions? Contact us at support@manubal.com
      `,
      // Optional: Add tags for tracking
      tags: [
        {
          name: 'category',
          value: 'order_confirmation'
        },
        {
          name: 'order_id',
          value: orderData.orderId.toString()
        }
      ]
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Order confirmation email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

// Additional email functions you might want

export async function sendOrderShippedEmail(orderData: {
  customerName: string;
  customerEmail: string;
  orderId: number;
  trackingNumber: string;
  trackingUrl: string;
}): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Manubal <shipping@manubal.com>',
      to: [orderData.customerEmail],
      subject: `Your order #${orderData.orderId} has shipped!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Your order is on its way!</h1>
          <p>Hi ${orderData.customerName},</p>
          <p>Great news! Your order #${orderData.orderId} has been shipped and is on its way to you.</p>
          <p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>
          <p><a href="${orderData.trackingUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Track Your Package</a></p>
          <p>Thank you for shopping with Manubal!</p>
        </div>
      `,
      tags: [
        {
          name: 'category',
          value: 'order_shipped'
        }
      ]
    });

    if (error) {
      console.error('Error sending shipping email:', error);
      return false;
    }

    console.log('Shipping notification email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send shipping notification email:', error);
    return false;
  }
}