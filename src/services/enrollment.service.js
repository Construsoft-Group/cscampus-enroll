import { extendEnrollment } from '../config/moodle.js';


export const extendEnrollmentByUserAndGroup = async ({ userid, groupid, courseid, months }) => {
    const members = await getUsersInGroup(groupid);
    const isInGroup = members.some((member) => member.userid === userid);

    if (!isInGroup) {
        throw new Error(`User ${userid} is not part of group ${groupid}`);
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(now.getMonth() + Number(months));
    const timeend = Math.floor(futureDate.getTime() / 1000);

    const result = await extendEnrollment({ userid, courseid, timeend });
    return { userid, status: 'success', result: result.data };
};
