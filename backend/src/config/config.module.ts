import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.config';
import * as path from 'path';
import * as fs from 'fs';

// Calculate potential env file paths
const possiblePaths = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), 'backend', '.env')];

// Find the first path that actually exists
const envFilePath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];

// Temporary debug logs
console.log('=== ENVIRONMENT LOADING AUDIT ===');
console.log('process.cwd():', process.cwd());
console.log('envFilePath determined:', envFilePath);
console.log('envFilePath exists:', fs.existsSync(envFilePath));
console.log('process.env.DATABASE_URL presence (before load):', !!process.env.DATABASE_URL);
console.log('=================================');

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath,
      validate: validateEnv,
    }),
  ],
})
export class ConfigModule {}
