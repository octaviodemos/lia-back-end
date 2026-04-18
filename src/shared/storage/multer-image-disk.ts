import { diskStorage } from 'multer';
import * as path from 'path';
import { randomBytes } from 'crypto';

export function extFromMime(mime: string, originalName?: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };
  if (map[mime]) return map[mime];
  if (originalName) return path.extname(originalName) || '';
  return '';
}

export function createImageDiskStorage(uploadSubdir: string) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads', uploadSubdir));
    },
    filename: (_req, file, cb) => {
      const rnd = randomBytes(16).toString('hex');
      const ext = extFromMime(file.mimetype, file.originalname);
      cb(null, `${rnd}${ext}`);
    },
  });
}

export function imageFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) {
  if (/^image\//.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
}
