import { RequestHandler } from 'express';
// Query values are filters, never MongoDB expressions or arbitrary regex programs.
export const queryGuard: RequestHandler = (req, res, next) => {
  for (const [key, value] of Object.entries(req.query)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key) || typeof value !== 'string' || value.length > 300) {
      res.status(400).json({ success: false, message: 'Query filters must be short, single text values' }); return;
    }
    if (key === 'isActive' && !['true','false'].includes(value)) { res.status(400).json({ success: false, message: 'isActive must be true or false' }); return; }
  }
  next();
};
