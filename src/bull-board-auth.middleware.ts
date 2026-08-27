import { Request, Response, NextFunction } from 'express';

// Bull Board показывает и правит чужие джобы - закрываем basic auth из env
export function bullBoardAuth(user: string, password: string) {
    const expected = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.headers.authorization === expected) return next();
        res.set('WWW-Authenticate', 'Basic realm="queues"').status(401).send('Unauthorized');
    };
}
