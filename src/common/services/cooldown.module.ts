import { Global, Module } from '@nestjs/common';
import { CooldownService } from './cooldown.service';

@Global()
@Module({
  providers: [CooldownService],
  exports: [CooldownService],
})
export class CooldownModule {}
