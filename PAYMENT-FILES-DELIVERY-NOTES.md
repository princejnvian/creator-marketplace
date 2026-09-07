# YOUTENT payment-gated workspace update

No additional SQL is required for this UI/API update if the existing `payments` table uses `status = 'paid'` for a captured payment.

The project files upload endpoint now verifies:
- authenticated project membership
- an existing project payment with status `paid`
- file size <= 50 MB

Files and Delivery pages are also locked until payment is paid.
