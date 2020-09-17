
import {envVariables} from '../env.variables';
import {JWT} from '../../services/JWT';

const {
    authScope,
    authIssuer,
    authAudiance,
    authServerUrl
} = envVariables;

export const protectedRoutes = router => {
    router.post("/protected", JWT({
        authScope,
        authIssuer,
        authAudiance,
        authServerUrl,
    }), (req, res) => res.sendStatus(200));

    router.get("/admin", JWT({
        authScope,
        authIssuer,
        authAudiance,
        authServerUrl,
    }), (req, res) => res.sendStatus(200));


    return router;
}
