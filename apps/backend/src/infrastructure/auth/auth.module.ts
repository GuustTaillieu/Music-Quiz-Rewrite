import { Module } from '@nestjs/common';
import { AuthModule as NestBetterAuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DatabaseModule } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database.constants';
import type { DrizzleDb } from '../database/database.constants';
import * as schema from '../database/schema';
import { env } from '../../env';

import { eq } from 'drizzle-orm';

@Module({
  imports: [
    DatabaseModule,
    NestBetterAuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DATABASE_CONNECTION],
      useFactory: (db: DrizzleDb) => {
        const isDev = env.NODE_ENV !== 'production';
        const frontendUrl = env.FRONTEND_URL?.replace(/\/$/, '');

        const trustedOrigins = isDev
          ? [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://10.*:*',
            'http://192.168.*:*',
            'http://172.*:*',
            ...(frontendUrl ? [frontendUrl] : []),
          ]
          : [frontendUrl!];

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
          baseURL: isDev
            ? {
              allowedHosts: trustedOrigins,
              protocol: 'http',
            }
            : `${frontendUrl}/api/auth`,
          errorPage: isDev ? '/?error=premium_required' : `${frontendUrl}/?error=premium_required`,
          trustedOrigins,
          advanced: {
            trustedProxyHeaders: true,
            useSecureCookies: !isDev && Boolean(frontendUrl?.startsWith('https://')),
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
              clientId: env.SPOTIFY_CLIENT_ID,
              clientSecret: env.SPOTIFY_CLIENT_SECRET,
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
            ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
              ? {
                google: {
                  clientId: env.GOOGLE_CLIENT_ID,
                  clientSecret: env.GOOGLE_CLIENT_SECRET,
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
export class AuthModule { }
