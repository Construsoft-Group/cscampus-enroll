import { extendEnrollment } from '../config/moodle.js';

export const extendEnrollmentByUser = async ({ userid, courseid, months }) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(now.getMonth() + Number(months));
    const timeend = Math.floor(futureDate.getTime() / 1000);

    const result = await extendEnrollment({ userid, courseid, timeend });
    return { userid, status: 'success', result: result.data };
};

