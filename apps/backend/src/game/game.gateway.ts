import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';
import { GAME_EVENTS } from '@spotify-music-quiz/shared/constants/game-events';
import { GameMode } from '@spotify-music-quiz/shared/schema/game';
import { randomUUID } from 'node:crypto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  // Map socket.id -> { lobbyId, username, playerId } to track active connections
  private readonly clientMap = new Map<
    string,
    { lobbyId: string; username: string; playerId: string }
  >();

  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly gameService: GameService) { }

  public handleDisconnect(client: Socket): void {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      return;
    }

    this.logger.log(
      `Client ${client.id} (${clientData.username}, player: ${clientData.playerId}) disconnected from lobby ${clientData.lobbyId}`,
    );

    this.gameService
      .removePlayer(clientData.lobbyId, clientData.playerId)
      .then((updatedState) => {
        this.clientMap.delete(client.id);
        if (updatedState) {
          this.server
            .to(clientData.lobbyId)
            .emit(GAME_EVENTS.GAME_STATE_UPDATE, updatedState);
        }
      })
      .catch((err: Error) => {
        this.logger.error(`Error removing player on disconnect: ${err.message}`);
      });
  }

  @SubscribeMessage(GAME_EVENTS.JOIN_LOBBY)
  public async handleJoinLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; username: string; userId?: string, token?: string },
  ): Promise<void> {
    const lobbyId = data.lobbyId.toUpperCase();
    const username = data.username.trim();
    const userId = data.userId;
    const sessionToken = data.token ?? randomUUID();

    try {
      this.logger.log(
        `Player ${username} (token: ${sessionToken}, socket: ${client.id}, user: ${userId ?? 'none'}) joining lobby ${lobbyId}`,
      );

      // Join the socket.io room
      await client.join(lobbyId);

      // Add player to domain session state
      const { state, token } = await this.gameService.addPlayer(
        lobbyId,
        sessionToken,
        username,
        userId,
      );

      // Save connection context
      this.clientMap.set(client.id, { lobbyId, username, playerId: token });

      // Broadcast new state to room
      this.server.to(lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
      // Respond to joining client with playerSessionToken
      client.emit(GAME_EVENTS.JOIN_SUCCESS, { lobbyId, state, playerSessionToken: token });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join lobby';
      this.logger.warn(`Join lobby error: ${message}`);
      client.emit(GAME_EVENTS.JOIN_ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.CONFIGURE_LOBBY)
  public async handleConfigureLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameMode: GameMode; guessingTimeLimit: number },
  ): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit(GAME_EVENTS.ERROR, { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.configureLobby(
        clientData.lobbyId,
        clientData.playerId,
        data.gameMode,
        data.guessingTimeLimit,
      );
      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to configure lobby';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.GAME_START)
  public async handleGameStart(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit(GAME_EVENTS.ERROR, { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.startGame(
        clientData.lobbyId,
        clientData.playerId,
      );

      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.HOST_AUDIO_STARTED)
  public async handleHostAudioStarted(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      return;
    }

    try {
      const state = await this.gameService.startAudioTimer(
        clientData.lobbyId,
        clientData.playerId,
      );
      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start audio timer';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.SUBMIT_GUESS)
  public async handleGuess(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guess: string },
  ): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit(GAME_EVENTS.ERROR, { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const { correct, state } = await this.gameService.submitGuess(
        clientData.lobbyId,
        clientData.playerId,
        data.guess,
      );

      client.emit(GAME_EVENTS.GUESS_RESULT, { correct });
      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit guess';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.PASS_TURN)
  public async handlePass(@ConnectedSocket() client: Socket): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit(GAME_EVENTS.ERROR, { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.passTurn(
        clientData.lobbyId,
        clientData.playerId,
      );

      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to pass turn';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.NEXT_SONG)
  public async handleNextSong(@ConnectedSocket() client: Socket): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit(GAME_EVENTS.ERROR, { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.advanceRound(
        clientData.lobbyId,
        clientData.playerId,
      );

      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to advance round';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.FORCE_REVEAL)
  public async handleForceReveal(@ConnectedSocket() client: Socket): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit(GAME_EVENTS.ERROR, { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.forceReveal(
        clientData.lobbyId,
        clientData.playerId,
      );
      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to force reveal';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }

  @SubscribeMessage(GAME_EVENTS.END_GAME)
  public async handleEndGame(@ConnectedSocket() client: Socket): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit(GAME_EVENTS.ERROR, { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.endGame(
        clientData.lobbyId,
        clientData.playerId,
      );
      this.server.to(clientData.lobbyId).emit(GAME_EVENTS.GAME_STATE_UPDATE, state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to end game';
      client.emit(GAME_EVENTS.ERROR, { message });
    }
  }
}
