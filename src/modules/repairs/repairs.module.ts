import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { RepairsRepository } from './repairs.repository';
import { RepairsService } from './repairs.service';
import { RepairsController } from './repairs.controller';
import { AdminRepairsController } from './admin-repairs.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { diskStorage } from 'multer';
import * as path from 'path';
import { randomBytes } from 'crypto';

function extFromMime(mime: string, originalName?: string) {
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

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/repairs',
        filename: (req, file, cb) => {
          const rnd = randomBytes(16).toString('hex');
          const ext = extFromMime(file.mimetype, file.originalname);
          cb(null, `${rnd}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (/^image\//.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    }),
  ],
  providers: [RepairsRepository, RepairsService],
  controllers: [RepairsController, AdminRepairsController],
  exports: [RepairsService],
})
export class RepairsModule {}