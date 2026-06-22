import { Module } from '@nestjs/common';
import { CopilotController } from './controllers/copilot.controller';
import { CopilotService } from './services/copilot.service';
import { CopilotSuggestionRepository } from './repositories/copilot-suggestion.repository';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  controllers: [CopilotController],
  providers: [
    CopilotService,
    CopilotSuggestionRepository,
    GeminiProvider,
    {
      provide: 'AI_PROVIDER',
      useClass: GeminiProvider,
    },
  ],
  exports: [CopilotService],
})
export class CopilotModule {}
