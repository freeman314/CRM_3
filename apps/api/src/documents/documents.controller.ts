import { Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

function randomName(original: string): string {
  const name = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return name + extname(original);
}

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService, private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @Get('client/:clientId')
  list(@Param('clientId') clientId: string) {
    return this.docs.listByClient(clientId);
  }

  @Post('upload/:clientId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: Express.Multer.File, cb: (error: any, destination: string) => void) => {
          const dir = join(process.cwd(), 'uploads')
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          cb(null, dir)
        },
        filename: (req: any, file: Express.Multer.File, cb: (error: any, filename: string) => void) => cb(null, randomName(file.originalname)),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg']
        if (allowed.includes(file.mimetype)) cb(null, true)
        else cb(new Error('Unsupported file type'), false)
      },
    }),
  )
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Roles('manager', 'chief_manager', 'admin')
  async upload(@Param('clientId') clientId: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const created = await this.prisma.document.create({
      data: {
        client: { connect: { id: clientId } },
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: { connect: { id: req.user.userId } },
      } as any,
    });
    await this.audit.log({ userId: req.user.userId, action: 'document.upload', method: 'POST', path: req.url, entity: 'Document', entityId: created.id, metadata: { originalName: file.originalname } });
    return created;
  }

  @Delete(':id')
  @Roles('chief_manager', 'admin')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.docs.remove(id, req.user.userId);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const filePath = join(process.cwd(), 'uploads', doc.fileName);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.originalName)}"`);
    return res.sendFile(filePath);
  }
}


