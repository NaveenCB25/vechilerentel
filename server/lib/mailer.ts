import nodemailer from "nodemailer";

import { getFrontendUrl, getMailConfig } from "./runtimeConfig.ts";

let transporter: nodemailer.Transporter | null = null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildBookingEmailHtml(details: {
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  startDate: string;
  endDate: string;
  location: string;
  paymentMethod: string;
  totalPrice: number;
}) {
  const frontendUrl = getFrontendUrl();
  const bookingsUrl = `${frontendUrl}/dashboard/bookings`;
  const dashboardUrl = `${frontendUrl}/dashboard`;

  const bookingRows = [
    { label: "Booking ID", value: details.bookingId },
    { label: "Vehicle", value: details.vehicleLabel },
    { label: "Dates", value: `${formatDate(details.startDate)} - ${formatDate(details.endDate)}` },
    { label: "Pickup", value: details.location },
    { label: "Payment", value: details.paymentMethod.replace("netbanking", "Net Banking").toUpperCase() },
    { label: "Amount", value: formatCurrency(details.totalPrice) },
  ];

  return `
    <div style="margin:0;padding:24px;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 48px rgba(15,23,42,0.12);">
        <div style="background:#14213d;padding:22px 24px;text-align:center;color:#ffffff;">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;">DreamCar</div>
          <div style="margin-top:6px;font-size:14px;font-weight:600;opacity:0.92;">Booking Confirmation</div>
        </div>

        <div style="padding:28px 28px 10px;">
          <h1 style="margin:0 0 12px;font-size:30px;line-height:1.1;color:#14213d;">Your booking is confirmed!</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">Hi ${escapeHtml(details.customerName)},</p>
          <p style="margin:0;font-size:15px;line-height:1.8;color:#475569;">
            Thanks for booking with DreamCar. Your reservation is confirmed and ready in your account.
            You can review your trip details, payment info, and updates anytime from your dashboard.
          </p>
        </div>

        <div style="padding:20px 28px 8px;">
          ${bookingRows
            .map(
              (row) => `
                <div style="margin-bottom:10px;padding:16px 18px;border-radius:14px;background:#f3f6fb;">
                  <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(row.label)}</div>
                  <div style="margin-top:6px;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(row.value)}</div>
                </div>
              `,
            )
            .join("")}
        </div>

        <div style="padding:18px 28px 10px;text-align:center;">
          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;margin:0 8px 12px;padding:14px 24px;border-radius:999px;background:#14213d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
            Open Dashboard
          </a>
          <a href="${escapeHtml(bookingsUrl)}" style="display:inline-block;margin:0 8px 12px;padding:14px 24px;border-radius:999px;border:1px solid #cbd5e1;color:#14213d;text-decoration:none;font-size:14px;font-weight:700;background:#ffffff;">
            View my bookings
          </a>
        </div>

        <div style="padding:10px 28px 26px;">
          <div style="padding:16px 18px;border-radius:14px;background:#f8fafc;color:#64748b;font-size:13px;line-height:1.8;">
            Need help with your trip? Reply to this email and our team will help you with pickup, payment, or booking updates.
          </div>
        </div>

        <div style="background:#14213d;padding:18px 24px;text-align:center;color:#cbd5e1;font-size:12px;">
          © ${new Date().getFullYear()} DreamCar. All rights reserved.
        </div>
      </div>
    </div>
  `;
}

function getTransporter() {
  const config = getMailConfig();

  if (!config) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return { transporter, config };
}

export async function sendBookingConfirmationEmail(details: {
  to: string;
  bookingId: string;
  customerName: string;
  vehicleLabel: string;
  startDate: string;
  endDate: string;
  location: string;
  paymentMethod: string;
  totalPrice: number;
}) {
  const transport = getTransporter();

  if (!transport) {
    return "not_configured" as const;
  }

  const { transporter: activeTransporter, config } = transport;

  await activeTransporter.sendMail({
    from: config.from,
    to: details.to,
    subject: "DreamCar booking confirmation",
    text: [
      `Hello ${details.customerName},`,
      "",
      "Your booking has been received successfully.",
      `Booking ID: ${details.bookingId}`,
      `Vehicle: ${details.vehicleLabel}`,
      `Pickup date: ${details.startDate}`,
      `Drop date: ${details.endDate}`,
      `Location: ${details.location}`,
      `Payment method: ${details.paymentMethod}`,
      `Amount: Rs. ${details.totalPrice.toLocaleString("en-IN")}`,
      "",
      "We will keep you updated on the booking status.",
    ].join("\n"),
    html: buildBookingEmailHtml(details),
  });

  return "sent" as const;
}
