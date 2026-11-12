import 'server-only';
import {cache} from 'react';
import {one} from './display-db';
import {PUBLIC_COLUMNS} from './config';

// Share the presentation read between metadata and the server-rendered page.
export const restaurantPageRecord=cache((id:string)=>one(`SELECT ${PUBLIC_COLUMNS},r.deleted FROM restaurants r WHERE r.id=?`,[id]));
