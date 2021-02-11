import { Server, Namespace } from 'socket.io';
import http from 'http';
import {
  SocketActions,
  ChatMessage,
  Action,
} from '../../colonists-shared/dist/Shared';
import { GameService } from './services/GameService';
import { World } from '../../colonists-shared/dist/World';
import { Tile } from '../../colonists-shared/dist/Tile';
import { ChatService } from './services/ChatService';
import { GameRepository } from './repositories/GameRepository';
import { LockMapAction } from '../../colonists-shared/dist/Action';
import { GamePlayerSockets, Disconnected } from './App';

export class GameSocket {
  private io: Server;
  private gameService: GameService;
  private chatService: ChatService;
  private gameRepository: GameRepository;

  constructor(
    server: http.Server,
    gameService: GameService,
    chatService: ChatService,
    gameRepository: GameRepository,
  ) {
    this.io = new Server(server, { cors: { origin: "*" } });
    this.gameService = gameService;
    this.chatService = chatService;
    this.gameRepository = gameRepository;
  }

  public setupSocketOnNamespace(
    gameID: string,
    gamePlayerSockets: GamePlayerSockets,
  ) {
    const nsp = this.io.of(`/${gameID}`);
    nsp.on(SocketActions.connect, (connection) => {
      this.logSocketEvent(gameID, SocketActions.connect);
      this.logConnectEvent(gameID, connection.id);
      
      connection.on(SocketActions.join, (name: string) => {
        this.logSocketEvent(gameID, SocketActions.join);
        const playerName = name ? name : connection.id;
        this.logJoinEvent(gameID, playerName);

        connection.on(SocketActions.getWorld, async () => {
          this.logSocketEvent(gameID, SocketActions.getWorld);
          connection.emit(
            SocketActions.newWorld,
            await this.gameRepository.getWorld(gameID),
          );
        });

        connection.on(SocketActions.initWorld, (init: World) => {
          this.logSocketEvent(gameID, SocketActions.initWorld);
          this.gameService.initWorld(init, gameID, nsp);
        });

        connection.on(SocketActions.lockMap, async () => {
          this.logSocketEvent(gameID, SocketActions.lockMap);
          const lock: LockMapAction = { type: 'lockMap' };
          nsp.emit(
            SocketActions.newWorld,
            await this.gameService.applyAction(gameID, lock),
          );
        });

        connection.on(SocketActions.newMap, (map: Tile[]) => {
          this.logSocketEvent(gameID, SocketActions.newMap);
          this.gameService.updateMap(map, gameID, nsp);
        });

        connection.on(SocketActions.chat, (chat: ChatMessage) => {
          this.logSocketEvent(gameID, SocketActions.chat);
          this.chatService.chatMessage(chat, gameID, nsp);
        });

        connection.on(SocketActions.sendAction, async (action: Action) => {
          this.logSocketEvent(gameID, SocketActions.sendAction);
          const result = await this.gameService.applyAction(gameID, action);
          nsp.emit(SocketActions.newWorld, result);
        });

        connection.on('disconnect', () => {
          const sockets = gamePlayerSockets[gameID];
          const disconnectPlayerName = Object.keys(sockets).find(
            (key) => sockets[key] === connection.id,
          );
          if (disconnectPlayerName) sockets[disconnectPlayerName] = Disconnected;
        });

        this.checkForReconnect(
          gameID,
          playerName,
          gamePlayerSockets,
          connection.id,
        ).then((r) => {
          nsp.emit(SocketActions.newWorld, r)
        });
      });

      setInterval(
        () => this.clearNamespaceIfEmpty(nsp, gamePlayerSockets),
        18000000,
      ); // Clear every half hour.
    });
  }

  private async checkForReconnect(
    gameID: string,
    playerName: string,
    gamePlayerSockets: GamePlayerSockets,
    socketID: string,
  ) {
    const sockets = gamePlayerSockets[gameID];
    if (!sockets[playerName]) {
      sockets[playerName] = socketID;
      return this.gameService.addPlayer(gameID, playerName);
    }
    // Previous socket disconnected, but player exists. Re-add socket, but don't add player.
    sockets[playerName] = socketID;
    return this.gameRepository.getWorld(gameID);
  }

  private logSocketEvent(gameID: string, type: string) {
    console.info(`[${gameID}] Received a ${type} socket event.`);
  }
  private logJoinEvent(gameID: string, playerName: string) {
    console.info(`[${gameID}] Join by player named: ${playerName}.`);
  }
  private logConnectEvent(gameID: string, socketID: string) {
    console.info(`[${gameID}] Player connected with socket ID ${socketID}.`);
  }

  private clearNamespaceIfEmpty(
    namespace: Namespace,
    gamePlayerSockets: GamePlayerSockets,
  ) {
    namespace.sockets.forEach(socket => socket.disconnect());
    namespace.removeAllListeners();
    delete gamePlayerSockets[namespace.name.substring(1)];
  }
}
