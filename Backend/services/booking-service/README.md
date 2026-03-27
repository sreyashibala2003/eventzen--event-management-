# EventZen Booking Service

ASP.NET Core + MongoDB booking microservice for EventZen.

## Features

- Validates the selected event by calling the existing `event-service`
- Reads the same JWT used by the frontend and other services
- Creates a pending checkout session for an event booking
- Confirms dummy `RAZORPAY` or `CASH` payments
- Stores booking, payment, user, and ticket details in MongoDB
- Exposes a downloadable HTML ticket with a unique code
- Provides user and admin booking listing endpoints

## Run

1. Copy `.env.example` values into your environment or launch config.
2. Restore packages:

```powershell
dotnet restore
```

3. Start the service:

```powershell
dotnet run
```

Default URL: `http://localhost:5050`

## MongoDB Collections

### `bookings`

Primary collection that stores:

- `booking_id`
- `booking_reference`
- `user.user_id`
- `user.name`
- `user.email`
- `event.event_id`
- `event.event_name`
- `event.event_date_utc`
- `event.venue_name`
- `payment.amount`
- `payment.currency`
- `payment.status`
- `payment.method`
- `payment.paid_at_utc`
- `payment.order_id`
- `payment.payment_id`
- `ticket.ticket_code`
- `ticket.download_count`
- `booking_status`
- `created_at_utc`
- `updated_at_utc`

### `booking_payment_audits`

Append-only payment audit collection that stores:

- `booking_id`
- `user_id`
- `event_id`
- `payment_status`
- `payment_method`
- `payment_id`
- `paid_at_utc`
- `created_at_utc`

## API

- `POST /api/v1/bookings/checkout-session`
- `POST /api/v1/bookings/{bookingId}/confirm-payment`
- `GET /api/v1/bookings/my-bookings`
- `GET /api/v1/bookings/admin/bookings`
- `GET /api/v1/bookings/{bookingId}/ticket`
