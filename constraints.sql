ALTER TABLE users
ADD CONSTRAINT chk_user_role
CHECK (role IN ('Hospital Administrator', 'Reception Desk', 'Doctor Session', 'Nurse Assistant'));


ALTER TABLE appointments
ADD CONSTRAINT chk_appointment_status
CHECK (status IN ('Requested', 'Confirmed', 'Waiting', 'In Consultation', 'Assessment', 'Completed', 'Cancelled', 'No-Show'));


ALTER TABLE lab_tests
ADD CONSTRAINT chk_lab_status
CHECK (status IN ('Pending', 'In Progress', 'Completed'));


ALTER TABLE imaging_exams
ADD CONSTRAINT chk_imaging_status
CHECK (status IN ('Pending', 'In Progress', 'Completed'));


ALTER TABLE appointments
ADD CONSTRAINT chk_triage_level
CHECK (triage_level IN ('Priority 1 - Resuscitation', 'Priority 2 - Emergency', 'Priority 3 - Urgent', 'Priority 4 - Less Urgent', 'Priority 5 - Non-Urgent'));