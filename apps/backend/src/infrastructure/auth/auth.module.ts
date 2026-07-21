import { Module } from '@nestjs/common';
import { AuthModule as NestBetterAuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DatabaseModule } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database.constants';
import type { DrizzleDb } from '../database/database.constants';
import * as schema from '../database/schema';

@Module({
  imports: [
    DatabaseModule,
    NestBetterAuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DATABASE_CONNECTION],
      useFactory: (db: DrizzleDb) => {
        const auth = betterAuth({
          database: drizzleAdapter(db, {
            provider: 'pg',
            schema: schema,
          }),
          baseURL: process.env.BETTER_AUTH_URL ?? 'http://127.0.0.1:3000/api/auth',
          errorPage: (process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000') + '/?error=premium_required',
          trustedOrigins: [
            process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
          ],
          accountLinking: {
            enabled: true,
            trustedProviders: ['spotify'],
          },
          socialProviders: {
            spotify: {
              clientId: process.env.SPOTIFY_CLIENT_ID!,
              clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
              redirectURI: `${process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000'}/api/auth/callback/spotify`,
              scope: [
                'streaming',
                'user-read-email',
                'user-read-private',
                'user-read-playback-state',
                'user-modify-playback-state',
                'user-read-currently-playing',
              ],
              mapProfileToUser: (profile: any) => {
                if (profile.product !== 'premium') {
                  throw new Error('PREMIUM_REQUIRED');
                }
                return {
                  name: profile.display_name,
                  email: profile.email,
                  image: profile.images?.[0]?.url,
                };
              },
            },
          },
        });
        return {
          auth,
        };
      },
    }),
  ],
  exports: [NestBetterAuthModule],
})
export class AuthModule { }
