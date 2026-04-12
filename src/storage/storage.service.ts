import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { extname } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class StorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly signedUrlExpiry: number;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.getOrThrow<string>('GCS_PROJECT_ID');
    this.bucketName = this.configService.getOrThrow<string>('GCP_BUCKET_NAME');
    // Signed URL expiry in minutes, default 7 days
    this.signedUrlExpiry = Number(
      this.configService.get<string>('GCS_SIGNED_URL_EXPIRY_MINUTES', '10080'),
    );
    this.storage = new Storage({ projectId });
  }

  /**
   * Upload a file buffer to GCS and return the GCS file path.
   * The path is stored in the database; use getSignedUrl() to generate
   * a temporary access URL when serving to clients.
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${folder}/${uniqueSuffix}${extname(file.originalname)}`;

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(fileName);

    await blob.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      resumable: false,
    });

    this.logger.log(`Uploaded ${fileName} to GCS`);
    // Return the GCS path (not a public URL — bucket is private)
    return fileName;
  }

  /**
   * Generate a temporary signed URL for a file stored in GCS.
   */
  async getSignedUrl(filePath: string): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(filePath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + this.signedUrlExpiry * 60 * 1000,
      });
    return url;
  }

  /**
   * Upload a file and return a signed URL directly.
   */
  async uploadFileAndSign(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ path: string; url: string }> {
    const path = await this.uploadFile(file, folder);
    const url = await this.getSignedUrl(path);
    return { path, url };
  }

  /**
   * Stream a file directly into GCS without buffering it in memory.
   * Required for large media uploads (audio/video) — buffering 500 MB
   * via memoryStorage would OOM Cloud Run instances.
   *
   * Note: This relies on Cloud Run gen2 execution environment for
   * request body sizes >32 MiB. See cloudbuild config.
   */
  async uploadStream(
    stream: Readable,
    folder: string,
    originalName: string,
    contentType: string,
  ): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${folder}/${uniqueSuffix}${extname(originalName)}`;
    const blob = this.storage.bucket(this.bucketName).file(fileName);

    await pipeline(
      stream,
      blob.createWriteStream({
        resumable: true,
        metadata: { contentType },
      }),
    );

    this.logger.log(`Streamed ${fileName} to GCS`);
    return fileName;
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    const paths: string[] = [];
    for (const file of files) {
      const path = await this.uploadFile(file, folder);
      paths.push(path);
    }
    return paths;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.storage.bucket(this.bucketName).file(filePath).delete();
      this.logger.log(`Deleted ${filePath} from GCS`);
    } catch (error) {
      this.logger.warn(`Failed to delete file from GCS: ${error.message}`);
    }
  }
}
