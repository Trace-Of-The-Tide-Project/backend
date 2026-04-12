import {
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  PayloadTooLargeException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import Busboy from 'busboy';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { StorageService } from '../storage/storage.service';
import {
  ALL_MEDIA_MIMES,
  MAX_UPLOAD_SIZE,
  getMediaCategory,
} from '../common/constants/media-types';

interface UploadResult {
  path: string;
  url: string;
  mimeType: string;
  size: number;
}

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload an image, audio, or video file and get its URL',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(@Req() req: Request): Promise<UploadResult> {
    return new Promise<UploadResult>((resolve, reject) => {
      let busboy: Busboy.Busboy;
      try {
        busboy = Busboy({
          headers: req.headers,
          limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
        });
      } catch {
        return reject(
          new BadRequestException('Invalid multipart/form-data request'),
        );
      }

      let fileHandled = false;
      let settled = false;
      let uploadedPath: string | null = null;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      busboy.on('file', (_field, fileStream, info) => {
        if (fileHandled) {
          fileStream.resume();
          return;
        }
        fileHandled = true;

        const { filename, mimeType } = info;

        if (!ALL_MEDIA_MIMES.includes(mimeType)) {
          fileStream.resume();
          return settle(() =>
            reject(
              new BadRequestException(
                `Unsupported file type "${mimeType}". Allowed: images (jpeg, png, webp, gif), audio (mp3, wav, ogg, m4a, aac), video (mp4, webm, mov, mkv).`,
              ),
            ),
          );
        }

        const folder = getMediaCategory(mimeType)!;
        let size = 0;
        let limitExceeded = false;

        fileStream.on('data', (chunk: Buffer) => {
          size += chunk.length;
        });

        fileStream.on('limit', () => {
          limitExceeded = true;
          settle(() =>
            reject(
              new PayloadTooLargeException(
                `File exceeds maximum size of ${MAX_UPLOAD_SIZE} bytes`,
              ),
            ),
          );
        });

        this.storageService
          .uploadStream(fileStream, folder, filename, mimeType)
          .then(async (path) => {
            uploadedPath = path;
            if (limitExceeded) {
              await this.storageService.deleteFile(path).catch(() => undefined);
              return;
            }
            const url = await this.storageService.getSignedUrl(path);
            settle(() => resolve({ path, url, mimeType, size }));
          })
          .catch(async (err) => {
            if (uploadedPath) {
              await this.storageService
                .deleteFile(uploadedPath)
                .catch(() => undefined);
            }
            settle(() =>
              reject(err instanceof Error ? err : new Error(String(err))),
            );
          });
      });

      busboy.on('error', (err) => {
        settle(() =>
          reject(err instanceof Error ? err : new Error(String(err))),
        );
      });

      busboy.on('finish', () => {
        if (!fileHandled) {
          settle(() => reject(new BadRequestException('File is required')));
        }
      });

      req.pipe(busboy);
    });
  }
}
