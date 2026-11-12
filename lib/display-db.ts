import {all as rawAll,one as rawOne} from './db';
import {displayRecord} from './display-text';
// Presentation reads only. Imports, editing, authentication and backups use db.ts.
export const all=async<T=any>(sql:string,args:any[]=[]):Promise<T[]> => (await rawAll<T>(sql,args)).map(displayRecord);
export const one=async<T=any>(sql:string,args:any[]=[]):Promise<T|null> => displayRecord(await rawOne<T>(sql,args));
export {audit} from './db';
