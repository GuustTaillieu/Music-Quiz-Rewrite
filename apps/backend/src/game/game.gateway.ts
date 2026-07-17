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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  // Map socket.id -> { lobbyId, username } to track active connections
  private readonly clientMap = new Map<
    string,
    { lobbyId: string; username: string }
  >();

  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly gameService: GameService) {}

  public handleDisconnect(client: Socket): void {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      return;
    }

    this.logger.log(
      `Client ${client.id} (${clientData.username}) disconnected from lobby ${clientData.lobbyId}`,
    );

    this.gameService
      .removePlayer(clientData.lobbyId, client.id)
      .then((updatedState) => {
        this.clientMap.delete(client.id);
        if (updatedState) {
          this.server
            .to(clientData.lobbyId)
            .emit('game_state_update', updatedState);
        }
      })
      .catch((err: Error) => {
        this.logger.error(`Error removing player on disconnect: ${err.message}`);
      });
  }

  @SubscribeMessage('join_lobby')
  public async handleJoinLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; username: string },
  ): Promise<void> {
    const lobbyId = data.lobbyId.toUpperCase();
    const username = data.username.trim();

    try {
      this.logger.log(
        `Player ${username} (socket: ${client.id}) joining lobby ${lobbyId}`,
      );

      // Join the socket.io room
      await client.join(lobbyId);

      // Add player to domain session state
      const state = await this.gameService.addPlayer(
        lobbyId,
        client.id,
        username,
      );

      // Save connection context
      this.clientMap.set(client.id, { lobbyId, username });

      // Broadcast new state to room
      this.server.to(lobbyId).emit('game_state_update', state);
      // Respond to joining client
      client.emit('join_success', { lobbyId, state });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join lobby';
      this.logger.warn(`Join lobby error: ${message}`);
      client.emit('join_error', { message });
    }
  }

  @SubscribeMessage('game_start')
  public async handleGameStart(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit('error', { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.startGame(
        clientData.lobbyId,
        client.id, // The host socket ID must match the creatorId/hostId
      );

      this.server.to(clientData.lobbyId).emit('game_state_update', state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      client.emit('error', { message });
    }
  }

  @SubscribeMessage('submit_guess')
  public async handleGuess(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { guess: string },
  ): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit('error', { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const { correct, state } = await this.gameService.submitGuess(
        clientData.lobbyId,
        client.id,
        data.guess,
      );

      client.emit('guess_result', { correct });
      this.server.to(clientData.lobbyId).emit('game_state_update', state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit guess';
      client.emit('error', { message });
    }
  }

  @SubscribeMessage('pass_turn')
  public async handlePass(@ConnectedSocket() client: Socket): Promise<void> {
    const clientData = this.clientMap.get(client.id);
    if (!clientData) {
      client.emit('error', { message: 'Not connected to a lobby' });
      return;
    }

    try {
      const state = await this.gameService.passTurn(
        clientData.lobbyId,
        client.id,
      );

      this.server.to(clientData.lobbyId).emit('game_state_update', state);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to pass turn';
      client.emit('error', { message });
    }
  }
}
