-- PATIENT FLOW CONTROLLER FUNCTION
CREATE OR REPLACE FUNCTION log_patient_flow()
RETURNS TRIGGER AS $$
BEGIN

    IF NOT EXISTS (SELECT 1 FROM patient_flow WHERE appointment_id = NEW.id) THEN
        INSERT INTO patient_flow (appointment_id, status, check_in_time, updated_at)
        VALUES (NEW.id, NEW.status,
                CASE WHEN NEW.status = 'Confirmed' THEN CURRENT_TIMESTAMP ELSE NULL END,
                CURRENT_TIMESTAMP);
    ELSE

        UPDATE patient_flow
        SET
            status = NEW.status,
            check_in_time = CASE WHEN NEW.status = 'Confirmed' THEN CURRENT_TIMESTAMP ELSE check_in_time END,
            consultation_start = CASE WHEN NEW.status = 'In Consultation' THEN CURRENT_TIMESTAMP ELSE consultation_start END,
            consultation_end = CASE WHEN NEW.status = 'Completed' THEN CURRENT_TIMESTAMP ELSE consultation_end END,
            updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, details, timestamp)
    VALUES (
        NULL,
        'Status Change',
        'Appointment ID ' || NEW.id || ' changed from ' || OLD.status || ' to ' || NEW.status,
        CURRENT_TIMESTAMP
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
DROP TRIGGER IF EXISTS trg_after_appointment_status_change ON appointments;
CREATE TRIGGER trg_after_appointment_status_change
AFTER UPDATE OF status ON appointments
FOR EACH ROW EXECUTE FUNCTION log_patient_flow();

DROP TRIGGER IF EXISTS trg_audit_status_change ON appointments;
CREATE TRIGGER trg_audit_status_change
AFTER UPDATE OF status ON appointments
FOR EACH ROW EXECUTE FUNCTION log_audit_action();


CREATE OR REPLACE FUNCTION check_doctor_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count FROM appointments
    WHERE doctor_id = NEW.doctor_id AND appointment_time::date = NEW.appointment_time::date AND status != 'Cancelled';

    SELECT daily_patient_limit INTO max_limit FROM doctors WHERE id = NEW.doctor_id;

    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'Daily patient limit reached!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_appointment_insert ON appointments;
CREATE TRIGGER trg_before_appointment_insert
BEFORE INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION check_doctor_limit();