import {enroller} from "./services/beca.service.js";

export const job = async () =>{
    const user = await enroller();
    console.log(user)
}