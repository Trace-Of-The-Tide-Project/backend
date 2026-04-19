import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SUPPORTED_LANGS = ['en', 'ar'];

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Resolve language from ?lang= query param or Accept-Language header, defaulting to 'en'
    let lang = (req.query.lang as string) || '';

    if (!lang) {
      const header = req.headers['accept-language'] || '';
      const primary = header.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
      if (primary) lang = primary;
    }

    lang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
    req['lang'] = lang;

    // Normalize ?lang= to ?language= so BaseService auto-filters content by language field
    if (req.query.lang) {
      req.query.language = lang;
      delete req.query.lang;
    }

    next();
  }
}
