// s3.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;


  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; 
  private readonly MAX_VIDEO_SIZE = 200 * 1024 * 1024; 
  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') as string;
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') as string;
    const accessKeyId = this.configService.get<string>('ACCESS_KEY_ID') as string;
    const secretAccessKey = this.configService.get<string>('SECRET_ACCESS_KEY') as string;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

    private validateFile(file: Express.Multer.File, fileType: 'image' | 'video'): void {
    if (fileType === 'image') {
      if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new BadRequestException('Invalid image type. Allowed: JPEG, PNG, GIF, WebP');
      }
      if (file.size > this.MAX_IMAGE_SIZE) {
        throw new BadRequestException(`Image size exceeds ${this.MAX_IMAGE_SIZE / (1024 * 1024)}MB limit`);
      }
    } else if (fileType === 'video') {
      if (!this.ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        throw new BadRequestException('Invalid video type. Allowed: MP4, MPEG, MOV, AVI, WebM');
      }
      if (file.size > this.MAX_VIDEO_SIZE) {
        throw new BadRequestException(`Video size exceeds ${this.MAX_VIDEO_SIZE / (1024 * 1024)}MB limit`);
      }
    }
  }

   async uploadVideo(file: Express.Multer.File, folder: string = 'videos'): Promise<string> {
  this.validateFile(file, 'video');
  
  const fileName = `${folder}/${uuidv4()}.${file.originalname.split('.').pop()}`;

  await this.s3Client.send(
    new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
}

  async uploadFile(file: Express.Multer.File, folder: string = 'images'): Promise<string> {
    const fileName = `${folder}/${uuidv4()}.${file.originalname.split('.').pop()}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = new URL(fileUrl).pathname.substring(1);
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }

  async uploadMultiple(files: Express.Multer.File[], folder: string = 'images'): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteMultiple(fileUrls: string[]): Promise<void> {
    await Promise.all(fileUrls.map((url) => this.deleteFile(url)));
  }
}