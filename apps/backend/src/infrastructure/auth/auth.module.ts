import { Module } from '@nestjs/common';
import { AuthModule as NestBetterAuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DatabaseModule } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database.constants';
import type { DrizzleDb } from '../database/database.constants';
import * as schema from '../database/schema';

import { eq } from 'drizzle-orm';

@Module({
  imports: [
    DatabaseModule,
    NestBetterAuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DATABASE_CONNECTION],
      useFactory: (db: DrizzleDb) => {
        const isDev = process.env.NODE_ENV !== 'production';
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000';
        const authBaseUrl = process.env.BETTER_AUTH_URL ?? `${frontendUrl}/api/auth`;

        const auth = betterAuth({
          database: drizzleAdapter(db, {
            provider: 'pg',
            schema: schema,
          }),
          databaseHooks: {
            session: {
              create: {
                after: async (session) => {
                  try {
                    const spotifyAcc = await db.query.account.findFirst({
                      where: (acc: any, { and: opAnd, eq: opEq }: any) =>
                        opAnd(opEq(acc.userId, session.userId), opEq(acc.providerId, 'spotify')),
                    });
                    if (spotifyAcc?.accessToken) {
                      const res = await fetch('https://api.spotify.com/v1/me', {
                        headers: { Authorization: `Bearer ${spotifyAcc.accessToken}` },
                      });
                      if (res.ok) {
                        const fresh = (await res.json()) as any;
                        const freshImage = fresh.images?.[0]?.url ?? null;
                        await (db as any)
                          .update(schema.user)
                          .set({
                            image: freshImage,
                            name: fresh.display_name,
                            updatedAt: new Date(),
                          })
                          .where(eq(schema.user.id, session.userId));
                      }
                    }
                  } catch {
                    // Non-blocking
                  }
                },
              },
            },
          },
          baseURL: authBaseUrl,
          errorPage: `${frontendUrl}/?error=premium_required`,
          trustedOrigins: [
            frontendUrl,
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://localhost:3001',
            'https://*.netlify.app',
          ],
          advanced: {
            useSecureCookies: !isDev && authBaseUrl.startsWith('https://'),
          },
          account: {
            accountLinking: {
              enabled: true,
              trustedProviders: ['spotify', 'google'],
              allowDifferentEmails: true,
            },
          },
          accountLinking: {
            enabled: true,
            trustedProviders: ['spotify', 'google'],
            allowDifferentEmails: true,
          },
          socialProviders: {
            spotify: {
              clientId: process.env.SPOTIFY_CLIENT_ID!,
              clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
              redirectURI: `${frontendUrl}/api/auth/callback/spotify`,
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
            ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
              ? {
                  google: {
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    redirectURI: `${frontendUrl}/api/auth/callback/google`,
                    scope: ['openid', 'email', 'profile'],
                  },
                }
              : {}),
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
export class AuthModule {}
