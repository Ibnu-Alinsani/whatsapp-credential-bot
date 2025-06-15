CREATE TABLE IF NOT EXISTS credentials (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  key TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_pin (
  phone_number TEXT PRIMARY KEY,
  pin TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pin_session (
  session_id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL,
  device TEXT,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_activity TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  action TEXT NOT NULL,
  target_key TEXT,
  notes TEXT,
  session_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
