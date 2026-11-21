// Adaptér se stejným rozhraním jako dřívější volání backendu: přijímá stejné tělo
// požadavku, vrací Promise se stejným tvarem odpovědi. Chyba vstupu → McdmError
// s `detail` (dříve HTTP 422). Vše běží v prohlížeči, žádná síť.

import { computeAhpFull, type AHPFullRequest, type AHPFullResponse } from './ahp';
import { calculatePaprika as paprika, type PAPRIKARequest, type PAPRIKAResponse } from './paprika';
import { calculateSmart as smart, type SMARTRequest, type SMARTResponse } from './smart';

const run = <Req, Res>(fn: (r: Req) => Res) => (req: Req): Promise<Res> =>
  new Promise((resolve) => resolve(fn(req)));

/** Dříve POST /api/calculate-ahp-full */
export const calculateAhpFull: (req: AHPFullRequest) => Promise<AHPFullResponse> = run(computeAhpFull);
/** Dříve POST /api/calculate-smart */
export const calculateSmart: (req: SMARTRequest) => Promise<SMARTResponse> = run(smart);
/** Dříve POST /api/calculate-paprika */
export const calculatePaprika: (req: PAPRIKARequest) => Promise<PAPRIKAResponse> = run(paprika);

export { McdmError } from './common';
