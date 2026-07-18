import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.constants';
import type { DrizzleDb } from '../database/database.constants';
import { account } from '../database/schema';

@Injectable()
export class SpotifyTokenService {
  private readonly logger = new Logger(SpotifyTokenService.name);
  private clientCredentialsToken: string | null = null;
  private clientCredentialsExpiresAt: number = 0;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDb,
  ) {}

  /**
   * Fetches and caches a public Client Credentials token for catalog search.
   */
  public async getClientCredentialsToken(): Promise<string> {
    const now = Date.now();
    // Use cached token if it has more than 60 seconds left
    if (this.clientCredentialsToken && this.clientCredentialsExpiresAt > now + 60000) {
      return this.clientCredentialsToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify Client credentials are not configured in environment variables.');
    }

    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch client credentials token: ${response.statusText} - ${errorText}`);
      }

      const body = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };

      this.clientCredentialsToken = body.access_token;
      this.clientCredentialsExpiresAt = Date.now() + body.expires_in * 1000;
      this.logger.log('Refreshed Spotify Client Credentials access token successfully.');
      return this.clientCredentialsToken;
    } catch (err) {
      this.logger.error('Error fetching client credentials token:', err);
      throw err;
    }
  }

  /**
   * Resolves the host's active Spotify Access Token from Drizzle.
   * Automatically refreshes it if expired.
   */
  public async getHostAccessToken(userId: string): Promise<string> {
    // 1. Query the database for the user's Spotify account credentials
    const hostAccount = await this.db.query.account.findFirst({
      where: and(
        eq(account.userId, userId),
        eq(account.providerId, 'spotify'),
      ),
    });

    if (!hostAccount) {
      throw new Error(`No Spotify account credentials linked for host userId: ${userId}`);
    }

    const now = new Date();
    // If the token is still valid (with a 60-second buffer), return it
    if (hostAccount.accessToken && hostAccount.accessTokenExpiresAt > new Date(now.getTime() + 60000)) {
      return hostAccount.accessToken;
    }

    // 2. If expired, request a refresh using the Spotify accounts refresh token
    const refreshToken = hostAccount.refreshToken;
    if (!refreshToken) {
      throw new Error(`No refresh token available to refresh Spotify credentials for userId: ${userId}`);
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify Client credentials are not configured in environment variables.');
    }

    this.logger.log(`Refreshing expired Spotify access token for userId: ${userId}`);

    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh host access token: ${response.statusText} - ${errorText}`);
      }

      const body = (await response.json()) as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
      };

      const newExpiresAt = new Date(Date.now() + body.expires_in * 1000);

      // 3. Update the database record with the new token
      await this.db
        .update(account)
        .set({
          accessToken: body.access_token,
          accessTokenExpiresAt: newExpiresAt,
          refreshToken: body.refresh_token || refreshToken, // Update refresh token if returned
          updatedAt: new Date(),
        })
        .where(eq(account.id, hostAccount.id));

      this.logger.log(`Spotify access token refreshed and saved successfully for userId: ${userId}`);
      return body.access_token;
    } catch (err) {
      this.logger.error(`Error refreshing Spotify access token for userId: ${userId}:`, err);
      throw err;
    }
  }
}
