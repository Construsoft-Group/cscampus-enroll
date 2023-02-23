import {moodle} from "./services/user.service.js";

export const job = async () =>{
    const user = await moodle();
    console.log(user)
}