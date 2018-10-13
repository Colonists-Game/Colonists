import express = require('express');
import rethink = require('rethinkdb');
import http = require('http');

import * as bodyParser from 'body-parser';
import * as socket from 'socket.io';
import { Result, Rule, Turn, World, Action, Player, ChatMessage, rules, ruleReducer } from 'pilgrims-shared';

const app = express();
const server = new http.Server(app);
const io = socket(server);
const port = 3000;
let connection: rethink.Connection | undefined;

// RethinkDB
rethink.connect( {host: 'localhost', port: 28015}, (err, c) => {
    if (err) { throw err; }
    connection = c;
});

rethink.db('pilgrims').tableCreate('games').run(connection, (err, result) => {
    if (err) { throw err; }
    console.log(JSON.stringify(result, null, 2));
});

app.post('/newGame', (req, res) => {
    const world = req.body;
    rethink.table('games').insert(world).run(connection, (err, result) => {
        if (err) { throw err; }
        res.send(result. generated_keys[0]);
    });
});
//

//Socket.io
io.on('connection', (socket) => {
    console.info(`Player connected on ${socket.id}.`)
    socket.on('game_start', (message) => {
        const game = JSON.parse(message);
        if (!game || !game.id) return;
        console.info(`'game_start' with game ${game}.`);
        io.of(`/${game.id}`)
          .on('join', (message) => {
                const player: Player = JSON.parse(message);
                if (!player || !player.id) return;
                console.info(`'join' on game ${game.id} by ${player.id}.`);
                const result = addPlayer(game.id, player);
                socket.to(game.id).emit('joined', result);
            })
          .on('turn_end', (message) => {
                const turn: Turn = JSON.parse(message);
                if (!turn || !turn.player || !turn.actions) return;
                console.info(`'turn_end' on game ${game.id} with ${turn}.`);
                applyTurn(game.id, turn).then((res) => socket.to(game.id).emit('apply_turn', res));
          })
          .on('chat', (message) => {
                const chatMessage: ChatMessage = JSON.parse(message);
                if (!chatMessage || !chatMessage.user || !chatMessage.text) return;
                console.info(`'chat' on game ${game.id} by ${chatMessage.user} with text ${chatMessage.text}.`);
                socket.to(game.id).emit('chat', message);
          });
        });

    socket.on('disconnect', (socket) => console.info(`Socket ${socket.id} disconnected.`));
  });
//


//Game
const applyTurn = async (id: string, turn: Turn) => {
    const toApply = mapRules(turn.actions)
    const world = await findWorld(id);
    const result = toApply.reduce(ruleReducer, world);
    return result;
}

const mapRules = (actions : Action[]) => {
    const mapped: Rule[] = actions.map((a) => {
        if (a.buildCity)    return rules["Build City"](a.buildCity.playerID, a.buildCity.coordinates);
        if (a.buildHouse)   return rules["Build House"](a.buildHouse.playerID, a.buildHouse.coordinates);
        if (a.buildRoad)    return rules["Build Road"](a.buildRoad.playerID, a.buildRoad.start, a.buildRoad.end);
        if (a.buyCard)      return rules["Buy Card"](a.buyCard.playerID);
        if (a.moveThief)    return rules["Move Thief"](a.moveThief.playerID, a.moveThief.coordinates);
        if (a.playCard)     return rules["Play Card"](a.playCard.playerID, a.playCard.card);
        if (a.trade)        return rules["Trade"](a.trade.playerID, a.trade.otherPlayerID, a.trade.resources);
        return undefined
    });
    if (mapped.some(r => r === undefined)) return undefined;
    return mapped;
}

const addPlayer = async (id: string, player: Player) => {
    try {
        const result: Result<World> = await findWorld(id);
        if (result.tag === 'Failure') return result;
        const players = result.world.players.concat(player);
        return { tag: 'Success', world: { ...result, players }};
    } catch {
        return { tag: 'Failure'}
    }
}

async function findWorld(id: string): Promise<Result<World>> {
    try {
        const dbResult = await rethink.table('games').get(id).run(connection);
        const result = dbResult as World;
        if (!(result as World)) return { tag: 'Failure', reason: "World could not be found!" };
        return { tag: 'Success', world: result };
    } catch {
        return { tag: 'Failure', reason: "World could not be found!" };
    }
}
//

//Initialize
app.use(bodyParser.json());
server.listen(port, () => console.log(`pilgrims-server listening on port ${port}!`))
//