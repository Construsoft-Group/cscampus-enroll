<?php
defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_cscampus_extend_enrollment' => [
        'classname'   => 'local_cscampus_external',
        'methodname'  => 'extend_enrollment',
        'classpath'   => 'local/cscampus/externallib.php',
        'description' => 'Extend the oldest enrollment for a user in a course by updating its end date.',
        'type'        => 'write',
        'capabilities' => 'enrol/manual:enrol',
    ],
];
