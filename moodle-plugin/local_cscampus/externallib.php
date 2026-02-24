<?php
defined('MOODLE_INTERNAL') || die();

require_once("$CFG->libdir/externallib.php");

class local_cscampus_external extends external_api {

    public static function extend_enrollment_parameters() {
        return new external_function_parameters([
            'userid'  => new external_value(PARAM_INT, 'Moodle user ID'),
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'timeend'  => new external_value(PARAM_INT, 'New enrollment end timestamp (unix)'),
        ]);
    }

    /**
     * Find the oldest enrollment for a user in a course and update its end date.
     * Works regardless of the enrollment method (manual, self, etc.).
     */
    public static function extend_enrollment($userid, $courseid, $timeend) {
        global $DB;

        $params = self::validate_parameters(self::extend_enrollment_parameters(), [
            'userid'  => $userid,
            'courseid' => $courseid,
            'timeend'  => $timeend,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('enrol/manual:enrol', $context);

        // Find the oldest enrollment for this user in this course.
        $sql = "SELECT ue.id, ue.enrolid, ue.userid, ue.status, ue.timestart, ue.timeend
                  FROM {user_enrolments} ue
                  JOIN {enrol} e ON ue.enrolid = e.id
                 WHERE e.courseid = :courseid AND ue.userid = :userid
              ORDER BY ue.timecreated ASC, ue.id ASC";

        $enrollments = $DB->get_records_sql($sql, [
            'courseid' => $params['courseid'],
            'userid'   => $params['userid'],
        ], 0, 1);

        if (empty($enrollments)) {
            return [
                'success' => false,
                'message' => 'No enrollment found for this user in the specified course.',
            ];
        }

        $enrollment = reset($enrollments);

        // Load the enrol instance and its plugin.
        $instance = $DB->get_record('enrol', ['id' => $enrollment->enrolid], '*', MUST_EXIST);
        $plugin   = enrol_get_plugin($instance->enrol);

        if (!$plugin) {
            return [
                'success' => false,
                'message' => 'Enrollment plugin not available: ' . $instance->enrol,
            ];
        }

        // Update enrollment: reactivate + set new end date. Keep original start date.
        $plugin->update_user_enrol($instance, $params['userid'], ENROL_USER_ACTIVE, null, $params['timeend']);

        return [
            'success' => true,
            'message' => 'Enrollment extended successfully.',
        ];
    }

    public static function extend_enrollment_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Whether the operation succeeded'),
            'message' => new external_value(PARAM_TEXT, 'Result message'),
        ]);
    }
}
