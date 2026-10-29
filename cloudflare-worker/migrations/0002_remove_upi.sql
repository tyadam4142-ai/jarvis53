-- JARVIS 53 v2.9.0 — remove the legacy UPI setting.
-- Payments are collected and verified manually; the product carries no UPI-specific surface.
DELETE FROM settings WHERE key = 'paymentUpiId';
