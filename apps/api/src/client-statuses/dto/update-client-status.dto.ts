import { PartialType } from '@nestjs/swagger';
import { CreateClientStatusDto } from './create-client-status.dto';

export class UpdateClientStatusDto extends PartialType(CreateClientStatusDto) {}


