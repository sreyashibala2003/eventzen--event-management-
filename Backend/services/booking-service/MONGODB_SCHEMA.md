# MongoDB Schema

## Database

- Database name: `eventzen_bookings`

## Collection: `bookings`

```json
{
  "_id": "ObjectId",
  "booking_id": "UUID string",
  "booking_reference": "EZB-20260323-AB12CD",
  "booking_status": "PAYMENT_PENDING | CONFIRMED",
  "user": {
    "user_id": "auth-service user id",
    "email": "user@example.com",
    "name": "Full Name",
    "roles": ["ATTENDEE"]
  },
  "event": {
    "event_id": "event-service event id",
    "event_name": "Wedding at Royal Palace",
    "event_type": "wedding",
    "event_date_utc": "2026-05-14T00:00:00Z",
    "start_time": "18:00",
    "end_time": "23:00",
    "venue_name": "Royal Palace",
    "venue_city": "Kolkata",
    "organizer_name": "Aarav Sen",
    "organizer_email": "organizer@example.com"
  },
  "payment": {
    "amount": 2500,
    "currency": "INR",
    "status": "PENDING | PAID",
    "method": "RAZORPAY | CASH",
    "order_id": "order_xxx",
    "payment_id": "pay_xxx",
    "razorpay_key": "rzp_test_eventzen_dummy",
    "paid_at_utc": "2026-03-23T16:30:00Z"
  },
  "ticket": {
    "ticket_code": "EZT-7K2M1Q9P",
    "file_name": "ticket-EZB-20260323-AB12CD.html",
    "download_count": 1
  },
  "created_at_utc": "2026-03-23T16:28:00Z",
  "updated_at_utc": "2026-03-23T16:30:00Z"
}
```

## Collection: `booking_payment_audits`

```json
{
  "_id": "ObjectId",
  "booking_id": "UUID string",
  "user_id": "auth-service user id",
  "event_id": "event-service event id",
  "payment_status": "PAID",
  "payment_method": "RAZORPAY",
  "payment_id": "pay_xxx",
  "paid_at_utc": "2026-03-23T16:30:00Z",
  "created_at_utc": "2026-03-23T16:30:00Z"
}
```

## Recommended Indexes

- `bookings.booking_id` unique
- `bookings.booking_reference` unique
- `bookings.user.user_id`
- `bookings.event.event_id`
- `bookings.payment.status`
- `bookings.payment.paid_at_utc`
- `booking_payment_audits.booking_id`
- `booking_payment_audits.payment_id`
