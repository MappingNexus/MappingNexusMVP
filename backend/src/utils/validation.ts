import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';

type Source = 'body' | 'params' | 'query';

export function validate(schema: ZodTypeAny, source: Source = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const parsed = schema.parse(req[source]);
            (req as any)[source] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues.map(issue => issue.message).join('; '),
                    issues: error.issues,
                });
                return;
            }

            res.status(400).json({ success: false, message: 'Invalid request payload.' });
        }
    };
}
