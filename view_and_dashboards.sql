-- RECEPTIONS DASHBOARD
CREATE OR REPLACE VIEW reception_dashboard AS
SELECT
    p.name AS patient_name,
    u.name AS doctor_name,
    a.appointment_time,
    a.priority_level,
    pf.status AS current_flow_status,
    CASE
        WHEN pf.consultation_start IS NULL AND pf.check_in_time IS NOT NULL
        THEN EXTRACT(MINUTE FROM (CURRENT_TIMESTAMP - pf.check_in_time))::INT
        ELSE 0
    END AS waiting_minutes_so_far
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN users u ON d.user_id = u.id
LEFT JOIN patient_flow pf ON a.id = pf.appointment_id
WHERE a.appointment_time::date = CURRENT_DATE
ORDER BY
    CASE WHEN a.priority_level = 'Emergency' THEN 1 ELSE 2 END,
    a.appointment_time ASC;


-- DOCTOR SESSION DASHBOARD
CREATE OR REPLACE VIEW doctor_session_dashboard AS
SELECT
    d.id AS doctor_id,
    p.name AS patient_name,
    p.phone_number,
    a.appointment_time,
    a.status AS appointment_status, -- waiting → in-consultation → assessment
    d.daily_patient_limit
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.status NOT IN ('Cancelled', 'Completed')
ORDER BY a.appointment_time ASC;


-- NURSE ASSISTANT DASHBOARD
CREATE OR REPLACE VIEW nurse_dashboard AS
SELECT
    p.name AS patient_name,
    u.name AS assigned_doctor,
    a.triage_level,
    a.status AS current_status,
    (SELECT COUNT(*) FROM lab_tests WHERE appointment_id = a.id AND status = 'Pending') AS pending_lab_tests,
    (SELECT COUNT(*) FROM imaging_exams WHERE appointment_id = a.id AND status = 'Pending') AS pending_imaging
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN users u ON d.user_id = u.id
WHERE a.status IN ('Confirmed', 'Waiting', 'Assessment')
ORDER BY a.triage_level ASC, a.appointment_time ASC;


-- ADMIN AUDIT REPORT
CREATE OR REPLACE VIEW admin_audit_report AS
SELECT
    al.timestamp,
    u.name AS actor_name,
    u.role AS actor_role,
    al.action,
    al.details
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.timestamp DESC;


--ADMIN EFFICIENCY REPORT
CREATE OR REPLACE VIEW admin_efficiency_report AS
SELECT
    u.name AS doctor_name,
    COUNT(a.id) AS total_appointments,
    ROUND(AVG(EXTRACT(EPOCH FROM (pf.consultation_start - pf.check_in_time))/60)) AS avg_wait_min,
    ROUND(AVG(EXTRACT(EPOCH FROM (pf.consultation_end - pf.consultation_start))/60)) AS avg_consultation_min,
    COUNT(CASE WHEN a.status = 'No-Show' THEN 1 END) AS no_show_count
FROM doctors d
JOIN users u ON d.user_id = u.id
LEFT JOIN appointments a ON d.id = a.doctor_id
LEFT JOIN patient_flow pf ON a.id = pf.appointment_id
GROUP BY u.name;